// Teste funcional: roda o MESMO roteiro contra as 4 APIs e confere que o comportamento é idêntico.
import assert from 'node:assert/strict';
import { todosClientes } from './clientes.js';

const clientes = await todosClientes();
let falhas = 0;

for (const c of clientes) {
  try {
    // consultas da especificação
    assert.equal((await c.usuarios.listar()).length >= 100, true, 'listar usuários');
    assert.equal((await c.musicas.listar()).length >= 500, true, 'listar músicas');
    const pls = await c.playlistsDoUsuario(1);
    assert.ok(pls.length > 0 && pls.every((p) => p.usuarioId === 1), 'playlists do usuário');
    const ms = await c.musicasDaPlaylist(pls[0].id);
    assert.equal(ms.length, pls[0].musicaIds.length, 'músicas da playlist');
    const dasMusica = await c.playlistsDaMusica(ms[0].id);
    assert.ok(dasMusica.some((p) => p.id === pls[0].id), 'playlists da música');

    // composição
    const comp = await c.playlistCompleta(pls[0].id);
    assert.equal(Number(comp.usuario.id), 1); // GraphQL ID é string
    assert.equal(comp.musicas.length, ms.length);

    // CRUD completo
    const u = await c.usuarios.criar({ nome: 'Teste', idade: 30 });
    assert.equal(u.nome, 'Teste');
    assert.equal((await c.usuarios.atualizar(u.id, { nome: 'Teste 2', idade: 31 })).idade, 31);
    const m = await c.musicas.criar({ nome: 'Nova', artista: 'Alguém' });
    const p = await c.playlists.criar({ nome: 'Minha', usuarioId: u.id, musicaIds: [m.id] });
    assert.deepEqual((await c.playlists.obter(p.id)).musicaIds.map(Number), [m.id]);
    await c.playlists.atualizar(p.id, { nome: 'Renomeada', usuarioId: u.id, musicaIds: [m.id, 1] });
    assert.equal((await c.musicasDaPlaylist(p.id)).length, 2);

    // erros
    await assert.rejects(c.usuarios.obter(999999), (e) => e.kind === 'NOT_FOUND', 'não encontrado');
    await assert.rejects(c.usuarios.criar({ nome: '', idade: 1 }), (e) => e.kind === 'INVALID', 'inválido');
    await assert.rejects(c.playlists.criar({ nome: 'x', usuarioId: u.id, musicaIds: [] }), (e) => e.kind === 'INVALID', 'playlist vazia');

    // remoção em cascata
    assert.ok(await c.usuarios.remover(u.id));
    await assert.rejects(c.playlists.obter(p.id), (e) => e.kind === 'NOT_FOUND', 'cascata');
    assert.ok(await c.musicas.remover(m.id));
    console.log(`✔ ${c.nome}`);
  } catch (e) {
    falhas++;
    console.log(`✘ ${c.nome}: ${e.message}`);
    console.log(e.stack?.split('\n').slice(0, 4).join('\n'));
  }
  c.fechar();
}
process.exit(falhas ? 1 : 0);
