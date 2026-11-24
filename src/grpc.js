import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'node:url';
import { Store, popular } from './store.js';

export const PROTO = fileURLToPath(new URL('../proto/streaming.proto', import.meta.url));
export const pacote = () =>
  grpc.loadPackageDefinition(
    protoLoader.loadSync(PROTO, { keepCase: false, longs: Number, defaults: true, oneofs: true }),
  ).streaming;

const COD = { NOT_FOUND: grpc.status.NOT_FOUND, INVALID: grpc.status.INVALID_ARGUMENT };

// Converte uma função de domínio em handler gRPC unário
const un = (fn) => (call, cb) => {
  try { cb(null, fn(call.request)); }
  catch (e) { cb(e.kind ? { code: COD[e.kind], message: e.message } : { code: grpc.status.INTERNAL, message: String(e) }); }
};
const pl = (p) => ({ id: p.id, nome: p.nome, usuarioId: p.usuarioId, musicaIds: p.musicaIds });
const plIn = (p) => ({ nome: p.nome, usuarioId: p.usuarioId, musicaIds: p.musicaIds });

export function criarGrpc(store) {
  const s = pacote();
  const server = new grpc.Server();
  server.addService(s.UsuarioService.service, {
    Listar: un(() => ({ itens: store.listarUsuarios() })),
    Obter: un(({ id }) => store.obterUsuario(id)),
    Criar: un((u) => store.criarUsuario(u)),
    Atualizar: un(({ id, dados }) => store.atualizarUsuario(id, dados)),
    Remover: un(({ id }) => ({ sucesso: store.removerUsuario(id) })),
    ListarPlaylists: un(({ id }) => ({ itens: store.playlistsDoUsuario(id).map(pl) })),
  });
  server.addService(s.MusicaService.service, {
    Listar: un(() => ({ itens: store.listarMusicas() })),
    Obter: un(({ id }) => store.obterMusica(id)),
    Criar: un((m) => store.criarMusica(m)),
    Atualizar: un(({ id, dados }) => store.atualizarMusica(id, dados)),
    Remover: un(({ id }) => ({ sucesso: store.removerMusica(id) })),
    ListarPlaylists: un(({ id }) => ({ itens: store.playlistsDaMusica(id).map(pl) })),
  });
  server.addService(s.PlaylistService.service, {
    Listar: un(() => ({ itens: store.listarPlaylists().map(pl) })),
    Obter: un(({ id }) => pl(store.obterPlaylist(id))),
    Criar: un((p) => pl(store.criarPlaylist(plIn(p)))),
    Atualizar: un(({ id, dados }) => pl(store.atualizarPlaylist(id, plIn(dados)))),
    Remover: un(({ id }) => ({ sucesso: store.removerPlaylist(id) })),
    ListarMusicas: un(({ id }) => ({ itens: store.musicasDaPlaylist(id) })),
  });
  return server;
}

if (import.meta.main) {
  const porta = Number(process.env.PORT ?? 3003);
  criarGrpc(popular(new Store())).bindAsync(`0.0.0.0:${porta}`, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) throw err;
    console.log(`gRPC em localhost:${porta}`);
  });
}
