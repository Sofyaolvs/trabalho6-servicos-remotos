// Domínio compartilhado pelas 4 tecnologias: usuários, músicas e playlists em memória.
// Assim, qualquer diferença medida vem da tecnologia de invocação, não da lógica de negócio.

export class AppError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // NOT_FOUND | INVALID
  }
}

const invalid = (m) => new AppError('INVALID', m);
const notFound = (what, id) => new AppError('NOT_FOUND', `${what} ${id} não encontrado(a)`);

export class Store {
  constructor() {
    this.usuarios = new Map();
    this.musicas = new Map();
    this.playlists = new Map();
    this.seq = { u: 1, m: 1, p: 1 };
  }

  // ---------- usuários ----------
  listarUsuarios() { return [...this.usuarios.values()]; }
  obterUsuario(id) {
    const u = this.usuarios.get(Number(id));
    if (!u) throw notFound('Usuário', id);
    return u;
  }
  criarUsuario({ nome, idade }) {
    this.#validarUsuario(nome, idade);
    const u = { id: this.seq.u++, nome, idade: Number(idade) };
    this.usuarios.set(u.id, u);
    return u;
  }
  atualizarUsuario(id, { nome, idade }) {
    this.obterUsuario(id);
    this.#validarUsuario(nome, idade);
    const u = { id: Number(id), nome, idade: Number(idade) };
    this.usuarios.set(u.id, u);
    return u;
  }
  removerUsuario(id) {
    this.obterUsuario(id);
    this.usuarios.delete(Number(id));
    // cascata: playlists pertencem a exatamente um usuário (1..1)
    for (const p of this.playlists.values()) if (p.usuarioId === Number(id)) this.playlists.delete(p.id);
    return true;
  }
  #validarUsuario(nome, idade) {
    if (!nome || typeof nome !== 'string') throw invalid('nome é obrigatório');
    if (!Number.isInteger(Number(idade)) || Number(idade) < 0) throw invalid('idade deve ser inteiro >= 0');
  }

  // ---------- músicas ----------
  listarMusicas() { return [...this.musicas.values()]; }
  obterMusica(id) {
    const m = this.musicas.get(Number(id));
    if (!m) throw notFound('Música', id);
    return m;
  }
  criarMusica({ nome, artista }) {
    this.#validarMusica(nome, artista);
    const m = { id: this.seq.m++, nome, artista };
    this.musicas.set(m.id, m);
    return m;
  }
  atualizarMusica(id, { nome, artista }) {
    this.obterMusica(id);
    this.#validarMusica(nome, artista);
    const m = { id: Number(id), nome, artista };
    this.musicas.set(m.id, m);
    return m;
  }
  removerMusica(id) {
    this.obterMusica(id);
    const mid = Number(id);
    this.musicas.delete(mid);
    // remove a música das playlists; playlist que ficar vazia viola 1..* e é removida
    for (const p of [...this.playlists.values()]) {
      if (!p.musicaIds.includes(mid)) continue;
      const restantes = p.musicaIds.filter((x) => x !== mid);
      if (restantes.length === 0) this.playlists.delete(p.id);
      else this.playlists.set(p.id, { ...p, musicaIds: restantes });
    }
    return true;
  }
  #validarMusica(nome, artista) {
    if (!nome || typeof nome !== 'string') throw invalid('nome é obrigatório');
    if (!artista || typeof artista !== 'string') throw invalid('artista é obrigatório');
  }

  // ---------- playlists ----------
  listarPlaylists() { return [...this.playlists.values()]; }
  obterPlaylist(id) {
    const p = this.playlists.get(Number(id));
    if (!p) throw notFound('Playlist', id);
    return p;
  }
  criarPlaylist({ nome, usuarioId, musicaIds }) {
    const ids = this.#validarPlaylist(nome, usuarioId, musicaIds);
    const p = { id: this.seq.p++, nome, usuarioId: Number(usuarioId), musicaIds: ids };
    this.playlists.set(p.id, p);
    return p;
  }
  atualizarPlaylist(id, { nome, usuarioId, musicaIds }) {
    this.obterPlaylist(id);
    const ids = this.#validarPlaylist(nome, usuarioId, musicaIds);
    const p = { id: Number(id), nome, usuarioId: Number(usuarioId), musicaIds: ids };
    this.playlists.set(p.id, p);
    return p;
  }
  removerPlaylist(id) {
    this.obterPlaylist(id);
    this.playlists.delete(Number(id));
    return true;
  }
  #validarPlaylist(nome, usuarioId, musicaIds) {
    if (!nome || typeof nome !== 'string') throw invalid('nome é obrigatório');
    this.obterUsuario(usuarioId); // 1..1: dono deve existir
    if (!Array.isArray(musicaIds) || musicaIds.length === 0) throw invalid('playlist precisa de ao menos 1 música (1..*)');
    const ids = musicaIds.map(Number);
    for (const m of ids) this.obterMusica(m);
    return ids;
  }

  // ---------- consultas relacionais ----------
  playlistsDoUsuario(usuarioId) {
    this.obterUsuario(usuarioId);
    return this.listarPlaylists().filter((p) => p.usuarioId === Number(usuarioId));
  }
  musicasDaPlaylist(playlistId) {
    const p = this.obterPlaylist(playlistId);
    return p.musicaIds.map((m) => this.musicas.get(m)).filter(Boolean);
  }
  playlistsDaMusica(musicaId) {
    this.obterMusica(musicaId);
    return this.listarPlaylists().filter((p) => p.musicaIds.includes(Number(musicaId)));
  }
}

// Dados iniciais determinísticos (mesmos nas 4 APIs)
export function popular(store, { usuarios = 100, musicas = 500, playlists = 300, musicasPorPlaylist = 10 } = {}) {
  const artistas = ['Djavan', 'Elis Regina', 'Gilberto Gil', 'Caetano Veloso', 'Marisa Monte', 'Tim Maia', 'Cássia Eller', 'Legião Urbana'];
  for (let i = 1; i <= usuarios; i++) store.criarUsuario({ nome: `Usuário ${i}`, idade: 15 + (i % 60) });
  for (let i = 1; i <= musicas; i++) store.criarMusica({ nome: `Música ${i}`, artista: artistas[i % artistas.length] });
  for (let i = 1; i <= playlists; i++) {
    const ids = Array.from({ length: musicasPorPlaylist }, (_, k) => ((i * 7 + k * 13) % musicas) + 1);
    store.criarPlaylist({ nome: `Playlist ${i}`, usuarioId: (i % usuarios) + 1, musicaIds: [...new Set(ids)] });
  }
  return store;
}
