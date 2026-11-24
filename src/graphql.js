import express from 'express';
import { buildSchema, graphql } from 'graphql';
import { Store, popular } from './store.js';

export const typeDefs = /* GraphQL */ `
  type Usuario  { id: ID!  nome: String!  idade: Int!  playlists: [Playlist!]! }
  type Musica   { id: ID!  nome: String!  artista: String!  playlists: [Playlist!]! }
  type Playlist { id: ID!  nome: String!  usuario: Usuario!  musicas: [Musica!]! }

  input UsuarioInput  { nome: String!  idade: Int! }
  input MusicaInput   { nome: String!  artista: String! }
  input PlaylistInput { nome: String!  usuarioId: ID!  musicaIds: [ID!]! }

  type Query {
    usuarios: [Usuario!]!   usuario(id: ID!): Usuario
    musicas: [Musica!]!     musica(id: ID!): Musica
    playlists: [Playlist!]! playlist(id: ID!): Playlist
  }
  type Mutation {
    criarUsuario(input: UsuarioInput!): Usuario!
    atualizarUsuario(id: ID!, input: UsuarioInput!): Usuario!
    removerUsuario(id: ID!): Boolean!
    criarMusica(input: MusicaInput!): Musica!
    atualizarMusica(id: ID!, input: MusicaInput!): Musica!
    removerMusica(id: ID!): Boolean!
    criarPlaylist(input: PlaylistInput!): Playlist!
    atualizarPlaylist(id: ID!, input: PlaylistInput!): Playlist!
    removerPlaylist(id: ID!): Boolean!
  }
`;

export function criarGraphQL(store) {
  const schema = buildSchema(typeDefs);

  // Entidades "ricas": campos relacionais viram métodos resolvidos sob demanda.
  const U = (u) => u && ({ ...u, playlists: () => store.playlistsDoUsuario(u.id).map(P) });
  const M = (m) => m && ({ ...m, playlists: () => store.playlistsDaMusica(m.id).map(P) });
  const P = (p) => p && ({ id: p.id, nome: p.nome,
    usuario: () => U(store.obterUsuario(p.usuarioId)),
    musicas: () => store.musicasDaPlaylist(p.id).map(M) });
  const achar = (fn) => (a) => { try { return fn(a.id); } catch (e) { if (e.kind === 'NOT_FOUND') return null; throw e; } };

  const rootValue = {
    usuarios: () => store.listarUsuarios().map(U),
    usuario: achar((id) => U(store.obterUsuario(id))),
    musicas: () => store.listarMusicas().map(M),
    musica: achar((id) => M(store.obterMusica(id))),
    playlists: () => store.listarPlaylists().map(P),
    playlist: achar((id) => P(store.obterPlaylist(id))),
    criarUsuario: ({ input }) => U(store.criarUsuario(input)),
    atualizarUsuario: ({ id, input }) => U(store.atualizarUsuario(id, input)),
    removerUsuario: ({ id }) => store.removerUsuario(id),
    criarMusica: ({ input }) => M(store.criarMusica(input)),
    atualizarMusica: ({ id, input }) => M(store.atualizarMusica(id, input)),
    removerMusica: ({ id }) => store.removerMusica(id),
    criarPlaylist: ({ input }) => P(store.criarPlaylist(input)),
    atualizarPlaylist: ({ id, input }) => P(store.atualizarPlaylist(id, input)),
    removerPlaylist: ({ id }) => store.removerPlaylist(id),
  };

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  // Um único endpoint; o cliente descreve o formato da resposta na própria query.
  app.post('/graphql', async (q, r) => {
    const { query, variables, operationName } = q.body ?? {};
    r.json(await graphql({ schema, source: query, rootValue, variableValues: variables, operationName }));
  });
  return app;
}

if (import.meta.main) {
  const porta = Number(process.env.PORT ?? 3002);
  criarGraphQL(popular(new Store())).listen(porta, () => console.log(`GraphQL em http://localhost:${porta}/graphql`));
}
