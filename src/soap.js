import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import soap from 'soap';
import { Store, popular } from './store.js';

export const WSDL = fileURLToPath(new URL('../wsdl/streaming.wsdl', import.meta.url));

const lista = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const pl = (p) => ({ id: p.id, nome: p.nome, usuarioId: p.usuarioId, musicaId: p.musicaIds });
const plIn = (p) => ({ nome: p.nome, usuarioId: p.usuarioId, musicaIds: lista(p.musicaId) });

// Erros de domínio viram SOAP Fault (HTTP 500, conforme o binding SOAP/HTTP)
const op = (fn) => (args) => {
  try { return { resultado: fn(args) }; }
  catch (e) {
    if (!e.kind) throw e;
    throw { Fault: { faultcode: e.kind === 'NOT_FOUND' ? 'soap:Client.NotFound' : 'soap:Client', faultstring: e.message }, statusCode: 500 };
  }
};

export function criarSoap(store, servidorHttp) {
  const servico = {
    StreamingService: {
      StreamingPort: {
        ListarUsuarios: op(() => store.listarUsuarios()),
        ObterUsuario: op(({ id }) => store.obterUsuario(id)),
        CriarUsuario: op(({ usuario }) => store.criarUsuario(usuario)),
        AtualizarUsuario: op(({ id, usuario }) => store.atualizarUsuario(id, usuario)),
        RemoverUsuario: op(({ id }) => store.removerUsuario(id)),

        ListarMusicas: op(() => store.listarMusicas()),
        ObterMusica: op(({ id }) => store.obterMusica(id)),
        CriarMusica: op(({ musica }) => store.criarMusica(musica)),
        AtualizarMusica: op(({ id, musica }) => store.atualizarMusica(id, musica)),
        RemoverMusica: op(({ id }) => store.removerMusica(id)),

        ListarPlaylists: op(() => store.listarPlaylists().map(pl)),
        ObterPlaylist: op(({ id }) => pl(store.obterPlaylist(id))),
        CriarPlaylist: op(({ playlist }) => pl(store.criarPlaylist(plIn(playlist)))),
        AtualizarPlaylist: op(({ id, playlist }) => pl(store.atualizarPlaylist(id, plIn(playlist)))),
        RemoverPlaylist: op(({ id }) => store.removerPlaylist(id)),

        ListarPlaylistsDoUsuario: op(({ usuarioId }) => store.playlistsDoUsuario(usuarioId).map(pl)),
        ListarMusicasDaPlaylist: op(({ playlistId }) => store.musicasDaPlaylist(playlistId)),
        ListarPlaylistsDaMusica: op(({ musicaId }) => store.playlistsDaMusica(musicaId).map(pl)),
      },
    },
  };
  return soap.listen(servidorHttp, { path: '/soap', services: servico, xml: readFileSync(WSDL, 'utf8'), suppressStack: true });
}

if (import.meta.main) {
  const porta = Number(process.env.PORT ?? 3004);
  const srv = http.createServer((_q, r) => r.writeHead(404).end());
  criarSoap(popular(new Store()), srv);
  srv.listen(porta, () => console.log(`SOAP em http://localhost:${porta}/soap?wsdl`));
}
