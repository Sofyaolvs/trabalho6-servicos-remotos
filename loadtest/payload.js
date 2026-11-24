// Mede bytes trafegados (corpo da resposta + requisição) por operação em cada tecnologia.
import { writeFileSync } from 'node:fs';
import { pacote } from '../src/grpc.js';
import { clienteSoap } from '../src/clientes.js';

const out = {};
const texto = async (url, init) => { const r = await fetch(url, init); const t = await r.text(); return { req: init?.body ? Buffer.byteLength(init.body) : 0, res: Buffer.byteLength(t) }; };
const gql = (query, variables) => texto('http://localhost:3002/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }) });

// ---- REST
out.rest = {
  leitura: await texto('http://localhost:3001/usuarios/5'),
  lista: await texto('http://localhost:3001/musicas'),
};
const rc = await Promise.all(['/playlists/7', '/playlists/7/musicas', '/usuarios/8'].map((p) => texto('http://localhost:3001' + p)));
out.rest.composta = { req: 0, res: rc.reduce((s, x) => s + x.res, 0) };

// ---- GraphQL
out.graphql = {
  leitura: await gql('query($id: ID!){ usuario(id:$id){ id nome idade } }', { id: 5 }),
  lista: await gql('{ musicas { id nome artista } }'),
  composta: await gql('query($id: ID!){ playlist(id:$id){ id nome usuario { id nome idade } musicas { id nome artista } } }', { id: 7 }),
};

// ---- gRPC (tamanho da mensagem protobuf serializada, sem o enquadramento HTTP/2 de 5 bytes por mensagem)
const s = pacote();
const sz = (def, tipo, obj) => def[tipo + 'Serialize'](obj).length;
const mus = Array.from({ length: 500 }, (_, i) => ({ id: i + 1, nome: `Música ${i + 1}`, artista: 'Djavan' }));
out.grpc = {
  leitura: { req: sz(s.UsuarioService.service.Obter, 'request', { id: 5 }), res: sz(s.UsuarioService.service.Obter, 'response', { id: 5, nome: 'Usuário 5', idade: 20 }) },
  lista: { req: 0, res: sz(s.MusicaService.service.Listar, 'response', { itens: mus }) },
};
const resPl = sz(s.PlaylistService.service.Obter, 'response', { id: 7, nome: 'Playlist 7', usuarioId: 8, musicaIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
const resMus = sz(s.PlaylistService.service.ListarMusicas, 'response', { itens: mus.slice(0, 10) });
const resUsr = sz(s.UsuarioService.service.Obter, 'response', { id: 8, nome: 'Usuário 8', idade: 23 });
out.grpc.composta = { req: 0, res: resPl + resMus + resUsr };

// ---- SOAP (envelope XML completo lido do cliente)
const c = await clienteSoap();
const lr = async (fn) => { await fn(); return { req: Buffer.byteLength(c._cli.lastRequest), res: Buffer.byteLength(c._cli.lastResponse) }; };
out.soap = { leitura: await lr(() => c.usuarios.obter(5)), lista: await lr(() => c.musicas.listar()) };
const sc = [await lr(() => c.playlists.obter(7)), await lr(() => c.musicasDaPlaylist(7)), await lr(() => c.usuarios.obter(8))];
out.soap.composta = { req: sc.reduce((a, x) => a + x.req, 0), res: sc.reduce((a, x) => a + x.res, 0) };

console.table(Object.fromEntries(Object.entries(out).map(([t, v]) => [t, Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.res]))])));
writeFileSync(new URL('../results/payload.json', import.meta.url), JSON.stringify(out, null, 2));
process.exit(0);
