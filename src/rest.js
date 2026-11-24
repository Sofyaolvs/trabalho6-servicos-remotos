import express from 'express';
import { Store, popular, AppError } from './store.js';

export function criarRest(store) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  // CRUD genérico para um recurso
  const crud = (base, { listar, obter, criar, atualizar, remover }) => {
    app.get(base, (_q, r) => r.json(listar()));
    app.post(base, (q, r) => r.status(201).location(`${base}/${(q.novo = criar(q.body)).id}`).json(q.novo));
    app.get(`${base}/:id`, (q, r) => r.json(obter(q.params.id)));
    app.put(`${base}/:id`, (q, r) => r.json(atualizar(q.params.id, q.body)));
    app.delete(`${base}/:id`, (q, r) => { remover(q.params.id); r.status(204).end(); });
  };

  crud('/usuarios', { listar: () => store.listarUsuarios(), obter: (i) => store.obterUsuario(i), criar: (b) => store.criarUsuario(b), atualizar: (i, b) => store.atualizarUsuario(i, b), remover: (i) => store.removerUsuario(i) });
  crud('/musicas', { listar: () => store.listarMusicas(), obter: (i) => store.obterMusica(i), criar: (b) => store.criarMusica(b), atualizar: (i, b) => store.atualizarMusica(i, b), remover: (i) => store.removerMusica(i) });
  crud('/playlists', { listar: () => store.listarPlaylists(), obter: (i) => store.obterPlaylist(i), criar: (b) => store.criarPlaylist(b), atualizar: (i, b) => store.atualizarPlaylist(i, b), remover: (i) => store.removerPlaylist(i) });

  // sub-recursos (consultas relacionais)
  app.get('/usuarios/:id/playlists', (q, r) => r.json(store.playlistsDoUsuario(q.params.id)));
  app.get('/playlists/:id/musicas', (q, r) => r.json(store.musicasDaPlaylist(q.params.id)));
  app.get('/musicas/:id/playlists', (q, r) => r.json(store.playlistsDaMusica(q.params.id)));

  app.use((err, _q, r, _n) => {
    if (err instanceof AppError) return r.status(err.kind === 'NOT_FOUND' ? 404 : 400).json({ erro: err.message });
    if (err.type === 'entity.parse.failed') return r.status(400).json({ erro: 'JSON inválido' });
    console.error(err);
    r.status(500).json({ erro: 'erro interno' });
  });
  return app;
}

if (import.meta.main) {
  const porta = Number(process.env.PORT ?? 3001);
  criarRest(popular(new Store())).listen(porta, () => console.log(`REST em http://localhost:${porta}`));
}
