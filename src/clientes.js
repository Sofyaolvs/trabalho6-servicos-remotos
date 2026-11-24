// Clientes idiomáticos para cada tecnologia, expondo a MESMA interface (usada nos testes funcionais e de carga).
import * as grpc from '@grpc/grpc-js';
import soap from 'soap';
import { pacote } from './grpc.js';
import { WSDL } from './soap.js';

const H = (host) => host ?? 'localhost';
// RTT simulado (ms) somado a cada chamada de rede, para estudar o efeito de latência
const atraso = (ms) => (ms ? new Promise((r) => setTimeout(r, ms)) : undefined);

// ---------- REST ----------
export function clienteRest({ host, porta = 3001, rtt = 0 } = {}) {
  const base = `http://${H(host)}:${porta}`;
  const chamar = async (metodo, caminho, corpo) => {
    await atraso(rtt);
    const r = await fetch(base + caminho, {
      method: metodo,
      headers: corpo ? { 'content-type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (r.status === 204) return true;
    const j = await r.json();
    if (!r.ok) throw Object.assign(new Error(j.erro), { kind: r.status === 404 ? 'NOT_FOUND' : 'INVALID' });
    return j;
  };
  const crud = (rec) => ({
    listar: () => chamar('GET', `/${rec}`),
    obter: (id) => chamar('GET', `/${rec}/${id}`),
    criar: (d) => chamar('POST', `/${rec}`, d),
    atualizar: (id, d) => chamar('PUT', `/${rec}/${id}`, d),
    remover: (id) => chamar('DELETE', `/${rec}/${id}`),
  });
  const u = crud('usuarios'), m = crud('musicas'), p = crud('playlists');
  return {
    nome: 'REST', usuarios: u, musicas: m, playlists: p,
    playlistsDoUsuario: (id) => chamar('GET', `/usuarios/${id}/playlists`),
    musicasDaPlaylist: (id) => chamar('GET', `/playlists/${id}/musicas`),
    playlistsDaMusica: (id) => chamar('GET', `/musicas/${id}/playlists`),
    // sem agregação no servidor: 1 chamada + 2 em paralelo
    async playlistCompleta(id) {
      const pl = await p.obter(id);
      const [musicas, dono] = await Promise.all([chamar('GET', `/playlists/${id}/musicas`), u.obter(pl.usuarioId)]);
      return { ...pl, usuario: dono, musicas };
    },
    chamadasPlaylistCompleta: 3,
    fechar() {},
  };
}

// ---------- GraphQL ----------
export function clienteGraphQL({ host, porta = 3002, rtt = 0 } = {}) {
  const url = `http://${H(host)}:${porta}/graphql`;
  const q = async (query, variables) => {
    await atraso(rtt);
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }) });
    const j = await r.json();
    if (j.errors) {
      const msg = j.errors[0].message;
      throw Object.assign(new Error(msg), { kind: /não encontrad/.test(msg) ? 'NOT_FOUND' : 'INVALID' });
    }
    return j.data;
  };
  const U = 'id nome idade', M = 'id nome artista', P = 'id nome usuarioId: usuario { id } musicaIds: musicas { id }';
  const plNorm = (p) => p && ({ id: p.id, nome: p.nome, usuarioId: p.usuarioId.id, musicaIds: p.musicaIds.map((x) => x.id) });
  const tid = (o) => o && ({ ...o, id: Number(o.id) });
  const pn = (p) => p && ({ ...plNorm(p), id: Number(p.id), usuarioId: Number(p.usuarioId), musicaIds: p.musicaIds.map(Number) });
  const plN = (p) => pn(p && plNorm(p));
  const mk = (Rec, rec, plural, campos, norm) => ({
    listar: async () => (await q(`{ ${plural} { ${campos} } }`))[plural].map(norm),
    obter: async (id) => {
      const d = (await q(`query($id: ID!){ ${rec}(id:$id){ ${campos} } }`, { id }))[rec];
      if (!d) throw Object.assign(new Error('não encontrado'), { kind: 'NOT_FOUND' });
      return norm(d);
    },
    criar: async (d) => norm((await q(`mutation($i: ${Rec}Input!){ criar${Rec}(input:$i){ ${campos} } }`, { i: d }))[`criar${Rec}`]),
    atualizar: async (id, d) => norm((await q(`mutation($id: ID!, $i: ${Rec}Input!){ atualizar${Rec}(id:$id, input:$i){ ${campos} } }`, { id, i: d }))[`atualizar${Rec}`]),
    remover: async (id) => (await q(`mutation($id: ID!){ remover${Rec}(id:$id) }`, { id }))[`remover${Rec}`],
  });
  const usuarios = mk('Usuario', 'usuario', 'usuarios', U, tid);
  const musicas = mk('Musica', 'musica', 'musicas', M, tid);
  const playlists = mk('Playlist', 'playlist', 'playlists', P, plN);
  return {
    nome: 'GraphQL', usuarios, musicas, playlists,
    playlistsDoUsuario: async (id) => (await q(`query($id: ID!){ usuario(id:$id){ playlists { ${P} } } }`, { id })).usuario.playlists.map(plN),
    musicasDaPlaylist: async (id) => (await q(`query($id: ID!){ playlist(id:$id){ musicas { ${M} } } }`, { id })).playlist.musicas.map(tid),
    playlistsDaMusica: async (id) => (await q(`query($id: ID!){ musica(id:$id){ playlists { ${P} } } }`, { id })).musica.playlists.map(plN),
    // uma única ida ao servidor: o cliente descreve o grafo que quer receber
    async playlistCompleta(id) {
      const d = await q(`query($id: ID!){ playlist(id:$id){ id nome usuario { ${U} } musicas { ${M} } } }`, { id });
      if (!d.playlist) throw Object.assign(new Error('não encontrado'), { kind: 'NOT_FOUND' });
      return d.playlist;
    },
    chamadasPlaylistCompleta: 1,
    fechar() {},
  };
}

// ---------- gRPC ----------
export function clienteGrpc({ host, porta = 3003, rtt = 0 } = {}) {
  const s = pacote();
  const alvo = `${H(host)}:${porta}`;
  const cred = grpc.credentials.createInsecure();
  const us = new s.UsuarioService(alvo, cred), ms = new s.MusicaService(alvo, cred), ps = new s.PlaylistService(alvo, cred);
  const KIND = { [grpc.status.NOT_FOUND]: 'NOT_FOUND', [grpc.status.INVALID_ARGUMENT]: 'INVALID' };
  const c = async (stub, m, req) => { await atraso(rtt); return new Promise((ok, no) => stub[m](req, (e, r) => (e ? no(Object.assign(new Error(e.details), { kind: KIND[e.code] ?? 'INTERNAL' })) : ok(r)))); };
  const crud = (stub) => ({
    listar: async () => (await c(stub, 'Listar', {})).itens,
    obter: (id) => c(stub, 'Obter', { id }),
    criar: (d) => c(stub, 'Criar', d),
    atualizar: (id, d) => c(stub, 'Atualizar', { id, dados: d }),
    remover: async (id) => (await c(stub, 'Remover', { id })).sucesso,
  });
  const u = crud(us), m = crud(ms), p = crud(ps);
  return {
    nome: 'gRPC', usuarios: u, musicas: m, playlists: p,
    playlistsDoUsuario: async (id) => (await c(us, 'ListarPlaylists', { id })).itens,
    musicasDaPlaylist: async (id) => (await c(ps, 'ListarMusicas', { id })).itens,
    playlistsDaMusica: async (id) => (await c(ms, 'ListarPlaylists', { id })).itens,
    async playlistCompleta(id) {
      const pl = await p.obter(id);
      const [musicas, dono] = await Promise.all([c(ps, 'ListarMusicas', { id }).then((r) => r.itens), u.obter(pl.usuarioId)]);
      return { ...pl, usuario: dono, musicas };
    },
    chamadasPlaylistCompleta: 3,
    fechar() { us.close(); ms.close(); ps.close(); },
  };
}

// ---------- SOAP ----------
export async function clienteSoap({ host, porta = 3004, rtt = 0 } = {}) {
  const cli = await soap.createClientAsync(WSDL, { endpoint: `http://${H(host)}:${porta}/soap` });
  const c = async (op, args) => {
    await atraso(rtt);
    try {
      const [r] = await cli[`${op}Async`](args);
      return r.resultado;
    } catch (e) {
      const msg = e.root?.Envelope?.Body?.Fault?.faultstring ?? e.message;
      throw Object.assign(new Error(msg), { kind: /não encontrad/.test(msg) ? 'NOT_FOUND' : 'INVALID' });
    }
  };
  const L = (v) => (v === undefined ? [] : v);
  const pn = (p) => p && ({ id: p.id, nome: p.nome, usuarioId: p.usuarioId, musicaIds: [].concat(p.musicaId ?? []) });
  const pIn = (p) => ({ nome: p.nome, usuarioId: p.usuarioId, musicaId: p.musicaIds });
  const crud = (R, campo, plural, norm = (x) => x, entrada = (x) => x) => ({
    listar: async () => L(await c(`Listar${plural}`, {})).map(norm),
    obter: async (id) => norm(await c(`Obter${R}`, { id })),
    criar: async (d) => norm(await c(`Criar${R}`, { [campo]: entrada(d) })),
    atualizar: async (id, d) => norm(await c(`Atualizar${R}`, { id, [campo]: entrada(d) })),
    remover: (id) => c(`Remover${R}`, { id }),
  });
  const u = crud('Usuario', 'usuario', 'Usuarios'), m = crud('Musica', 'musica', 'Musicas'), p = crud('Playlist', 'playlist', 'Playlists', pn, pIn);
  return {
    nome: 'SOAP', _cli: cli, usuarios: u, musicas: m, playlists: p,
    playlistsDoUsuario: async (id) => L(await c('ListarPlaylistsDoUsuario', { usuarioId: id })).map(pn),
    musicasDaPlaylist: async (id) => L(await c('ListarMusicasDaPlaylist', { playlistId: id })),
    playlistsDaMusica: async (id) => L(await c('ListarPlaylistsDaMusica', { musicaId: id })).map(pn),
    async playlistCompleta(id) {
      const pl = await p.obter(id);
      const [musicas, dono] = await Promise.all([c('ListarMusicasDaPlaylist', { playlistId: id }).then(L), u.obter(pl.usuarioId)]);
      return { ...pl, usuario: dono, musicas };
    },
    chamadasPlaylistCompleta: 3,
    fechar() {},
  };
}

export async function todosClientes(opts = {}) {
  return [clienteRest(opts), clienteGraphQL(opts), clienteGrpc(opts), await clienteSoap(opts)];
}
