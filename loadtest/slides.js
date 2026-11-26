import pptxgen from 'pptxgenjs';
import { readFileSync } from 'node:fs';
const R = JSON.parse(readFileSync('results/resultados.json', 'utf8')).resultados;
const PL = JSON.parse(readFileSync('results/payload.json', 'utf8'));
const code = (f) => readFileSync(f, 'utf8');
const get = (t, w, c) => R.find((r) => r.tech === t && r.workload === w && r.conc === c);

const p = new pptxgen(); p.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
const COR = { rest: '2E7D32', graphql: 'D81B8C', grpc: '1565C0', soap: 'EF6C00' };
const NOME = { rest: 'REST', graphql: 'GraphQL', grpc: 'gRPC', soap: 'SOAP' };
const T = ['rest', 'graphql', 'grpc', 'soap'];
const AZUL = '1F3A6E', CINZA = '555555';
const F = 'Calibri', M = 'Consolas';

function slide(titulo, sub) {
  const s = p.addSlide(); s.background = { color: 'FFFFFF' };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: AZUL } });
  s.addText(titulo, { x: 0.5, y: 0.3, w: 12.3, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: AZUL });
  if (sub) s.addText(sub, { x: 0.5, y: 0.95, w: 12.3, h: 0.4, fontFace: F, fontSize: 15, color: CINZA, italic: true });
  return s;
}
const bullets = (s, itens, o) => s.addText(itens.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })),
  { fontFace: F, fontSize: 16, color: '222222', valign: 'top', paraSpaceAfter: 6, ...o });
const bloco = (s, tit, itens, x, y, w, h, cor) => {
  s.addShape(p.ShapeType.rect, { x, y, w, h, fill: { color: 'F4F6FA' }, line: { color: cor, width: 1.5 } });
  s.addText(tit, { x: x + 0.1, y: y + 0.05, w: w - 0.2, h: 0.4, fontFace: F, fontSize: 17, bold: true, color: cor });
  bullets(s, itens, { x: x + 0.1, y: y + 0.5, w: w - 0.2, h: h - 0.55, fontSize: 14 });
};
const codigo = (s, txt, x, y, w, h, fs = 11) => s.addText(txt, { x, y, w, h, fontFace: M, fontSize: fs, color: 'E8EAF0', fill: { color: '1E2433' }, valign: 'top', margin: 8 });

// 1. Título + membros
let s = p.addSlide(); s.background = { color: AZUL };
s.addText('Comparação de Tecnologias de\nInvocação de Serviços Remotos', { x: 0.7, y: 1.3, w: 12, h: 1.8, fontFace: F, fontSize: 40, bold: true, color: 'FFFFFF' });
s.addText('SOAP · REST · GraphQL · gRPC\nEstudo com um serviço de streaming de músicas', { x: 0.7, y: 3.2, w: 12, h: 1, fontFace: F, fontSize: 22, color: 'C9D6F2' });
s.addText('Computação Distribuída — Prof. Nabor C. Mendonça\nSofya Emilly Oliveira Sousa — 2320314\nPedro Vitor Medeiros Holanda Pequeno — 2315091\nRicardo Filho Sobral Monteiro Ramos — 2310365', { x: 0.7, y: 4.6, w: 12, h: 2, fontFace: F, fontSize: 18, color: 'FFFFFF' });

// 2. Serviço
s = slide('O serviço de streaming de músicas', 'Mesma regra de negócio (Store em memória) exposta de 4 formas');
bullets(s, ['3 recursos com CRUD completo: Usuário, Música, Playlist', 'Playlist pertence a exatamente 1 usuário (1..1) e contém 1..* músicas', 'Consultas exigidas: todos os usuários · todas as músicas · playlists de um usuário · músicas de uma playlist · playlists que contêm uma música', 'Remoção em cascata: apagar usuário apaga suas playlists', 'Erros de domínio mapeados: 404 / NOT_FOUND / Fault / errors[]', 'Dados de teste: 100 usuários, 500 músicas, 300 playlists'], { x: 0.5, y: 1.5, w: 6.3, h: 5.2 });
const box = (t, x, y, w, h, c) => { s.addShape(p.ShapeType.rect, { x, y, w, h, fill: { color: 'FFFFFF' }, line: { color: c, width: 2 } }); s.addText(t, { x, y, w, h, fontFace: F, fontSize: 14, align: 'center', valign: 'middle', color: '222222' }); };
box('Usuário\nid · nome · idade', 7.3, 2.0, 2.4, 1.1, COR.rest); box('Playlist\nid · nome', 7.3, 4.6, 2.4, 1.1, COR.grpc); box('Música\nid · nome · artista', 10.5, 4.6, 2.4, 1.1, COR.soap);
s.addShape(p.ShapeType.line, { x: 8.5, y: 3.1, w: 0, h: 1.5, line: { color: '444444', width: 2, endArrowType: 'triangle' } });
s.addShape(p.ShapeType.line, { x: 9.7, y: 5.15, w: 0.8, h: 0, line: { color: '444444', width: 2, endArrowType: 'triangle' } });
s.addText('1..1', { x: 8.6, y: 3.6, w: 0.8, h: 0.3, fontSize: 12, fontFace: F }); s.addText('1..*', { x: 9.7, y: 4.8, w: 0.8, h: 0.3, fontSize: 12, fontFace: F });
s.addText('Node.js 26 · express · graphql-js · @grpc/grpc-js · soap', { x: 7, y: 6.3, w: 6, h: 0.4, fontFace: M, fontSize: 12, color: CINZA });

// 3-6. Tecnologias
const techs = [
  ['soap', 'SOAP', 'Origem: 1998 (Microsoft, DevelopMentor, UserLand). SOAP 1.1 enviado ao W3C em 2000; SOAP 1.2 é Recomendação W3C (2003).',
    ['Envelope XML (Header + Body) sobre HTTP (ou SMTP, JMS…)', 'Contrato formal: WSDL + XSD', 'Padrões WS-*: segurança, transações, confiabilidade', 'Erros padronizados via SOAP Fault', 'Geração de stubs a partir do WSDL'],
    ['Forte contrato e tipagem; ferramentas maduras', 'Extensível (WS-Security, WS-AtomicTransaction)', 'Independe do transporte', 'Muito usado em sistemas corporativos/legados e bancos'],
    ['XML verboso: payloads até 9× maiores neste estudo', 'Parsing caro; menor throughput', 'Complexidade (WSDL, namespaces, WS-*)', 'Cache HTTP ineficaz (tudo é POST)']],
  ['rest', 'REST', 'Origem: Roy Fielding, tese de doutorado (UC Irvine, 2000) — estilo arquitetural derivado das propriedades da própria Web.',
    ['Recursos identificados por URI (/usuarios/5)', 'Verbos HTTP: GET, POST, PUT, DELETE', 'Sem estado; representações (em geral JSON)', 'Códigos de status HTTP; cache e proxies nativos', 'Contrato opcional (OpenAPI)'],
    ['Simples, universal, depurável com curl/navegador', 'Cache HTTP e escalabilidade horizontal fáceis', 'Ecossistema enorme; JSON leve', 'Curva de aprendizado baixa'],
    ['Over-fetching e under-fetching', 'Dados relacionados exigem várias chamadas (ex.: 3 para a playlist completa)', 'Sem contrato/tipagem forte por padrão', 'Versionamento de API e convenções divergentes']],
  ['graphql', 'GraphQL', 'Origem: Facebook, 2012 (app móvel). Aberto em 2015; GraphQL Foundation (Linux Foundation) desde 2018.',
    ['Linguagem de consulta + runtime; um único endpoint', 'Schema fortemente tipado (SDL)', 'Cliente escolhe os campos e o formato da resposta', 'Query, Mutation e Subscription', 'Introspecção do schema'],
    ['Elimina over/under-fetching: 1 ida para o grafo completo', 'Schema serve de documentação e contrato', 'Evolução sem versões (campos deprecados)', 'Ótimo para clientes móveis/heterogêneos'],
    ['Overhead de execução: mais lento em todas as cargas simples deste estudo', 'Cache HTTP difícil (POST único)', 'Risco de queries caras/N+1; exige limites de profundidade', 'Tratamento de erros menos padronizado (200 com errors[])']],
  ['grpc', 'gRPC', 'Origem: Google (evolução do Stubby interno); código aberto em 2015; projeto da CNCF desde 2017.',
    ['RPC sobre HTTP/2 com Protocol Buffers (binário)', 'Contrato .proto → código gerado em várias linguagens', 'Streaming: unário, servidor, cliente e bidirecional', 'Deadlines, cancelamento, status codes próprios', 'Multiplexação de chamadas em uma conexão'],
    ['Mensagens compactas (2–3× menores que JSON aqui)', 'Contrato forte e geração de código', 'Streaming nativo; ideal para microsserviços', 'Baixa latência'],
    ['Binário: difícil de depurar sem ferramentas', 'Suporte limitado em navegadores (precisa gRPC-Web)', 'Acoplamento ao .proto; proxies/balanceadores precisam falar HTTP/2', 'Em Node.js (grpc-js, JS puro) o ganho de velocidade sobre REST não apareceu']],
];
for (const [t, nome, origem, car, van, des] of techs) {
  s = slide(nome, origem);
  bloco(s, 'Principais características', car, 0.5, 1.9, 4.0, 4.9, COR[t]);
  bloco(s, 'Vantagens', van, 4.65, 1.9, 4.0, 4.9, '2E7D32');
  bloco(s, 'Desvantagens', des, 8.8, 1.9, 4.0, 4.9, 'C62828');
}

// 7-10. Código
const trecho = (f, a, b) => code(f).split('\n').slice(a - 1, b).join('\n');
const cod = [
  ['rest', 'REST — rotas Express e chamada com fetch',
    "// servidor (src/rest.js)\napp.get('/usuarios/:id', (q, r) => r.json(store.obterUsuario(q.params.id)));\napp.post('/usuarios', (q, r) => r.status(201).json(store.criarUsuario(q.body)));\napp.get('/playlists/:id/musicas', (q, r) => r.json(store.musicasDaPlaylist(q.params.id)));",
    "// cliente (src/clientes.js)\nconst pl = await chamar('GET', `/playlists/${id}`);\nconst [musicas, dono] = await Promise.all([\n  chamar('GET', `/playlists/${id}/musicas`),\n  chamar('GET', `/usuarios/${pl.usuarioId}`),\n]);   // 3 chamadas, 2 viagens de rede"],
  ['graphql', 'GraphQL — schema SDL, resolvers e query',
    "# schema (src/graphql.js)\ntype Playlist { id: ID!  nome: String!\n  usuario: Usuario!  musicas: [Musica!]! }\ntype Query { playlist(id: ID!): Playlist }\n\n// resolver\nplaylist: ({id}) => P(store.obterPlaylist(id)),",
    "# cliente: UMA chamada traz o grafo inteiro\nquery($id: ID!) {\n  playlist(id: $id) {\n    id nome\n    usuario { id nome idade }\n    musicas { id nome artista }\n  }\n}"],
  ['grpc', 'gRPC — contrato .proto, handler e stub',
    "// proto/streaming.proto\nservice PlaylistService {\n  rpc Obter (Id) returns (Playlist);\n  rpc ListarMusicas (Id) returns (Musicas);\n}\n// servidor (src/grpc.js)\nObter: un(({ id }) => pl(store.obterPlaylist(id))),",
    "// cliente: stub gerado dinamicamente do .proto\nconst ps = new s.PlaylistService(alvo, cred);\nps.Obter({ id }, (err, playlist) => { /* ... */ });\n// 3 chamadas / 2 viagens, como no REST"],
  ['soap', 'SOAP — WSDL gerado, serviço e cliente',
    "<!-- wsdl/streaming.wsdl: 128 linhas, 18 operações -->\n<wsdl:operation name=\"ObterPlaylist\">\n  <wsdl:input message=\"tns:ObterPlaylistIn\"/>\n  <wsdl:output message=\"tns:ObterPlaylistOut\"/>\n</wsdl:operation>\n// servidor (src/soap.js)\nObterPlaylist: op(({ id }) => pl(store.obterPlaylist(id))),",
    "// cliente: métodos criados a partir do WSDL\nconst cli = await soap.createClientAsync(WSDL);\nconst [r] = await cli.ObterPlaylistAsync({ id: 7 });\nreturn r.resultado;\n// 3 chamadas / 2 viagens; resposta em envelope XML"],
];
for (const [t, tit, a, b] of cod) {
  s = slide(tit, 'Mesma linguagem (JavaScript/Node.js) nas quatro implementações');
  codigo(s, a, 0.5, 1.6, 6.1, 4.6, 13); codigo(s, b, 6.8, 1.6, 6.0, 4.6, 13);
  s.addShape(p.ShapeType.rect, { x: 0.5, y: 1.5, w: 12.3, h: 0.08, fill: { color: COR[t] } });
}

// Comparativo
s = slide('Comparação lado a lado');
const th = (t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: AZUL }, fontFace: F, fontSize: 13 } });
const tr = (...c) => c.map((t, i) => ({ text: t, options: { fontFace: F, fontSize: 12, bold: i === 0 } }));
s.addTable([
  [th(''), th('SOAP'), th('REST'), th('GraphQL'), th('gRPC')],
  tr('Formato', 'XML (envelope)', 'JSON (em geral)', 'JSON', 'Protobuf (binário)'),
  tr('Transporte', 'HTTP/1.1 (POST)', 'HTTP/1.1', 'HTTP/1.1 (POST)', 'HTTP/2'),
  tr('Contrato', 'WSDL/XSD (obrigatório)', 'OpenAPI (opcional)', 'Schema SDL', '.proto'),
  tr('Operações', 'Nomeadas (RPC)', 'Verbos + URIs', 'Query/Mutation', 'Métodos RPC'),
  tr('Cache HTTP', 'Não', 'Sim', 'Difícil', 'Não'),
  tr('Streaming', 'Não', 'Não', 'Subscriptions', 'Nativo'),
  tr('Navegador', 'Sim (verboso)', 'Sim', 'Sim', 'gRPC-Web'),
  tr('Linhas de código (contrato + servidor)', '63 + 128 + 58', '39', '75', '41 + 58'),
  tr('Chamadas p/ playlist completa', '3', '3', '1', '3'),
], { x: 0.5, y: 1.3, w: 12.3, colW: [3.1, 2.3, 2.3, 2.3, 2.3], rowH: 0.5, border: { type: 'solid', color: 'CCCCCC', pt: 1 } });

// Testes de carga: metodologia
s = slide('Testes de carga: metodologia');
bullets(s, ['Mesma máquina (Windows 11, 14 núcleos), servidores Node.js em processo único, localhost', 'Gerador de carga em worker_threads (até 4), loop fechado: N usuários virtuais disparam operações sem pausa', 'Clientes idiomáticos de cada tecnologia (fetch, grpc-js, soap client) com a mesma interface', '2 s de aquecimento + 8 s medidos por combinação; concorrência 1, 10, 50 e 100', 'Cargas: leitura (1 usuário) · lista (500 músicas) · composta (playlist + músicas + dono) · composta com RTT simulado de ~30 ms · escrita (criar + remover)', 'Métricas: vazão (ops/s), latência p50/p95/p99 e erros (0 erros em todas as 80 execuções)', 'Limitações: cliente e servidor compartilham CPU; resultados valem para Node.js, não para a tecnologia em abstrato'], { x: 0.5, y: 1.5, w: 12.3, h: 5.3, fontSize: 18 });

// Gráficos
const barras = (titulo, sub, w, c, campo, fmt) => {
  const sl = slide(titulo, sub);
  sl.addChart(p.charts.BAR, [{ name: '', labels: T.map((t) => NOME[t]), values: T.map((t) => get(t, w, c)[campo]) }],
    { x: 0.5, y: 1.5, w: 8, h: 5.4, barDir: 'col', chartColors: T.map((t) => COR[t]), varyColors: true, showValue: true, dataLabelFormatCode: fmt, dataLabelFontSize: 14, catAxisLabelFontSize: 14, valAxisLabelFontSize: 11, showLegend: false, valGridLine: { color: 'E5E5E5', size: 0.5 } });
  return sl;
};
const nota = (sl, linhas) => bullets(sl, linhas, { x: 8.8, y: 1.7, w: 4.1, h: 5, fontSize: 15 });
const razao = (w, c, a, b, campo = 'rps') => (get(a, w, c)[campo] / get(b, w, c)[campo]).toFixed(1);

s = barras('Vazão — leitura simples (100 usuários simultâneos)', 'ops/s (maior é melhor)', 'leitura', 100, 'rps', '#,##0');
nota(s, [`REST e gRPC empatam (~33 mil ops/s)`, `SOAP: ${razao('leitura', 100, 'rest', 'soap')}× mais lento que REST`, `GraphQL: ${razao('leitura', 100, 'rest', 'graphql')}× mais lento que REST — custo do parse/validação/execução da query`]);
s = barras('Vazão — listagem de 500 músicas (100 usuários)', 'ops/s (maior é melhor)', 'lista', 100, 'rps', '#,##0');
nota(s, [`Payload grande expõe o custo do XML: SOAP ${razao('lista', 100, 'rest', 'soap')}× mais lento que REST`, `Resposta: SOAP ${(PL.soap.lista.res / 1024).toFixed(0)} KB · REST ${(PL.rest.lista.res / 1024).toFixed(0)} KB · gRPC ${(PL.grpc.lista.res / 1024).toFixed(0)} KB`, `GraphQL ${razao('lista', 100, 'rest', 'graphql')}× mais lento que REST (execução campo a campo)`]);
s = barras('Latência p95 — listagem de 500 músicas (100 usuários)', 'milissegundos (menor é melhor)', 'lista', 100, 'p95', '0.0');
nota(s, [`SOAP: p95 de ${get('soap', 'lista', 100).p95} ms`, `gRPC teve a menor variação (p99 ${get('grpc', 'lista', 100).p99} ms) apesar de vazão ligeiramente menor que REST`, 'Latências em loop fechado crescem com a concorrência (fila no servidor de thread única)']);
s = barras('Vazão — escrita (criar + remover usuário, 100 usuários)', 'ops/s (maior é melhor)', 'escrita', 100, 'rps', '#,##0');
nota(s, [`gRPC foi o mais rápido (${get('grpc', 'escrita', 100).rps.toFixed(0)} ops/s), à frente do REST`, `SOAP ${razao('escrita', 100, 'rest', 'soap')}× e GraphQL ${razao('escrita', 100, 'rest', 'graphql')}× mais lentos que REST`]);
s = barras('Vazão — playlist completa em localhost (100 usuários)', 'ops/s; REST/gRPC/SOAP fazem 3 chamadas, GraphQL faz 1', 'composta', 100, 'rps', '#,##0');
nota(s, ['Sem latência de rede, as 3 chamadas curtas do REST/gRPC ainda vencem a execução GraphQL', `REST ≈ gRPC ≈ ${get('rest', 'composta', 100).rps.toFixed(0)} ops/s`, `SOAP ${get('soap', 'composta', 100).rps.toFixed(0)} · GraphQL ${get('graphql', 'composta', 100).rps.toFixed(0)}`]);
s = barras('Latência p50 — playlist completa com RTT simulado (~30 ms)', 'milissegundos (menor é melhor)', 'composta_rtt', 100, 'p50', '0.0');
nota(s, ['Com rede lenta, o que importa é o número de viagens: 2 sequenciais (REST/gRPC/SOAP) vs 1 (GraphQL)', `GraphQL: ${get('graphql', 'composta_rtt', 100).p50} ms contra ~${get('rest', 'composta_rtt', 100).p50} ms`, `Vazão: GraphQL ${get('graphql', 'composta_rtt', 100).rps.toFixed(0)} ops/s vs ${get('rest', 'composta_rtt', 100).rps.toFixed(0)} — o dobro`]);

// escalabilidade (linhas)
const linhas = (titulo, w) => {
  const sl = slide(titulo, 'ops/s por número de usuários simultâneos');
  const cs = [1, 10, 50, 100];
  sl.addChart(p.charts.LINE, T.map((t) => ({ name: NOME[t], labels: cs.map(String), values: cs.map((c) => get(t, w, c).rps) })),
    { x: 0.5, y: 1.5, w: 12.3, h: 5.4, chartColors: T.map((t) => COR[t]), lineSize: 3, lineDataSymbolSize: 8, showLegend: true, legendPos: 'b', legendFontSize: 14, catAxisLabelFontSize: 13, valAxisLabelFontSize: 12, showCatAxisTitle: true, catAxisTitle: 'usuários simultâneos', catAxisTitleFontSize: 13, valGridLine: { color: 'E5E5E5', size: 0.5 } });
};
linhas('Escalabilidade — leitura simples', 'leitura');
linhas('Escalabilidade — escrita', 'escrita');

// payload
s = slide('Custo na rede: bytes por resposta', 'Corpo da resposta (gRPC: mensagem protobuf serializada)');
const ops = [['leitura', 'Usuário (1 registro)'], ['lista', '500 músicas'], ['composta', 'Playlist completa (soma das chamadas)']];
s.addChart(p.charts.BAR, T.map((t) => ({ name: NOME[t], labels: ops.map((o) => o[1]), values: ops.map((o) => PL[t][o[0]].res) })),
  { x: 0.5, y: 1.5, w: 8.2, h: 5.4, barDir: 'col', barGrouping: 'clustered', chartColors: T.map((t) => COR[t]), showLegend: true, legendPos: 'b', legendFontSize: 13, valAxisLabelFormatCode: '#,##0', catAxisLabelFontSize: 12, valGridLine: { color: 'E5E5E5', size: 0.5 } });
bullets(s, [`500 músicas: SOAP ${(PL.soap.lista.res / 1024).toFixed(0)} KB · REST ${(PL.rest.lista.res / 1024).toFixed(0)} KB · gRPC ${(PL.grpc.lista.res / 1024).toFixed(0)} KB`, `Envelope SOAP: ${PL.soap.leitura.res} bytes para um único usuário (REST: ${PL.rest.leitura.res})`, 'Protobuf é 2,2× menor que JSON na lista', 'GraphQL ≈ REST aqui, pois pedimos os mesmos campos'], { x: 8.9, y: 1.7, w: 4, h: 5, fontSize: 15 });

// Análise crítica
s = slide('Análise crítica a partir da implementação e dos testes');
bloco(s, 'Experiência de implementação', ['REST: o mais rápido de escrever (39 linhas)', 'GraphQL: schema + resolvers de relações dão flexibilidade, mas é preciso cuidar de ID como string e do N+1', 'gRPC: contrato curto, mas mapear status e tipos exige atenção', 'SOAP: o mais trabalhoso — WSDL de 128 linhas (gerado por script), namespaces, Fault manual'], 0.5, 1.4, 6.1, 5.4, AZUL);
bloco(s, 'O que os números mostraram', ['Em Node.js, REST ≈ gRPC em vazão; gRPC tem payload 2× menor e melhor escrita', 'SOAP: 1,7–9× mais lento, sobretudo com payloads grandes', 'GraphQL: 1,8–5× mais lento por requisição, mas 1 viagem em vez de 3 → vence com latência de rede', 'Nenhum erro em 80 execuções; todas as APIs passaram no mesmo teste funcional'], 6.8, 1.4, 6.0, 5.4, AZUL);

s = slide('Quando usar cada tecnologia');
s.addTable([
  [th('Tecnologia'), th('Indicada para'), th('Evitar quando')],
  tr('REST', 'APIs públicas, CRUD, cache HTTP, simplicidade', 'Clientes precisam de dados muito variados/aninhados'),
  tr('GraphQL', 'Clientes móveis/web diversos, redes lentas, agregação de dados', 'Cargas simples de alto volume; cache HTTP essencial'),
  tr('gRPC', 'Comunicação interna entre microsserviços, streaming, baixa latência', 'Consumo direto por navegador / APIs públicas'),
  tr('SOAP', 'Integração corporativa/legada com WS-Security e contratos rígidos', 'Novos projetos sem exigência de WS-*; alto throughput'),
], { x: 0.5, y: 1.4, w: 12.3, colW: [2, 5.3, 5], rowH: 0.8, border: { type: 'solid', color: 'CCCCCC', pt: 1 } });
s.addText('Conclusão: não há vencedor absoluto — a escolha depende do cliente, da rede e do contrato exigido. Em medições, REST/gRPC foram mais rápidos; GraphQL economiza viagens; SOAP paga o custo do XML.', { x: 0.5, y: 5.6, w: 12.3, h: 1, fontFace: F, fontSize: 17, bold: true, color: AZUL });

s = slide('Referências');
bullets(s, ['W3C. SOAP Version 1.2 Part 1: Messaging Framework (Second Edition). https://www.w3.org/TR/soap12/', 'Fielding, R. T. Architectural Styles and the Design of Network-Based Software Architectures. UC Irvine, 2000.', 'REST API Tutorial. https://restfulapi.net/', 'GraphQL: A query language for your API. https://graphql.org/', 'gRPC: A high performance, open source universal RPC framework. https://grpc.io/', 'Stowe, M. XML, SOAP, JSON, REST, GraphQL? (SlideShare)', 'Brito, G.; Valente, M. T. REST vs GraphQL: A Controlled Experiment. ICSA, 2020.', 'Código e dados do experimento: pasta trabalho6-servicos-remotos (src/, loadtest/, results/)'], { x: 0.5, y: 1.4, w: 12.3, h: 5.4, fontSize: 16 });

await p.writeFile({ fileName: 'Trabalho6-Comparacao-Servicos-Remotos.pptx' });
console.log('ok');
