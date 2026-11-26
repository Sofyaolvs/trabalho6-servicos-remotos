// Gera gráficos SVG e CSV a partir de results/*.json (sem dependências).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const R = JSON.parse(readFileSync('results/resultados.json', 'utf8')).resultados;
const PL = JSON.parse(readFileSync('results/payload.json', 'utf8'));
const T = ['rest', 'graphql', 'grpc', 'soap'];
const NOME = { rest: 'REST', graphql: 'GraphQL', grpc: 'gRPC', soap: 'SOAP' };
const COR = { rest: '#2E7D32', graphql: '#D81B8C', grpc: '#1565C0', soap: '#EF6C00' };
const WN = { leitura: 'Leitura simples', lista: 'Lista 500 músicas', composta: 'Playlist completa', composta_rtt: 'Playlist completa + RTT', escrita: 'Escrita (criar+remover)' };
const W = Object.keys(WN), CS = [1, 10, 50, 100];
const get = (t, w, c) => R.find((r) => r.tech === t && r.workload === w && r.conc === c);
mkdirSync('results/graficos', { recursive: true });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = (v) => (v >= 1000 ? Math.round(v).toLocaleString('en-US') : v >= 10 ? v.toFixed(0) : v.toFixed(1));
const nice = (max) => { const p = 10 ** Math.floor(Math.log10(max)); const m = max / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };

function moldura(titulo, sub, corpo, w = 960, h = 520, legenda = true) {
  const leg = legenda ? T.map((t, i) => `<rect x="${200 + i * 140}" y="${h - 28}" width="14" height="14" fill="${COR[t]}"/><text x="${220 + i * 140}" y="${h - 16}" font-size="14">${NOME[t]}</text>`).join('') : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family="Segoe UI, Arial, sans-serif"><rect width="${w}" height="${h}" fill="#fff"/><text x="${w / 2}" y="28" text-anchor="middle" font-size="20" font-weight="bold" fill="#1F3A6E">${esc(titulo)}</text><text x="${w / 2}" y="48" text-anchor="middle" font-size="13" fill="#666">${esc(sub)}</text>${corpo}${leg}</svg>`;
}
function eixoY(max, x0, y0, x1, y1) {
  const top = nice(max); let s = '';
  for (let i = 0; i <= 5; i++) { const v = (top * i) / 5, y = y0 - ((y0 - y1) * i) / 5; s += `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="#e5e5e5"/><text x="${x0 - 8}" y="${y + 4}" text-anchor="end" font-size="12" fill="#555">${fmt(v)}</text>`; }
  return { s, top };
}
function barras(arquivo, titulo, sub, cats, valor) {
  const x0 = 80, x1 = 930, y0 = 430, y1 = 70, max = Math.max(...cats.flatMap((c) => T.map((t) => valor(t, c.k))));
  const { s: grade, top } = eixoY(max, x0, y0, x1, y1);
  const gw = (x1 - x0) / cats.length, bw = (gw - 30) / T.length;
  let b = '';
  cats.forEach((c, i) => {
    T.forEach((t, j) => {
      const v = valor(t, c.k), h = ((y0 - y1) * v) / top, x = x0 + i * gw + 15 + j * bw;
      b += `<rect x="${x}" y="${y0 - h}" width="${bw - 2}" height="${h}" fill="${COR[t]}"/><text x="${x + bw / 2 - 1}" y="${y0 - h - 4}" text-anchor="middle" font-size="10" fill="#333">${fmt(v)}</text>`;
    });
    b += `<text x="${x0 + i * gw + gw / 2}" y="${y0 + 20}" text-anchor="middle" font-size="13">${esc(c.n)}</text>`;
  });
  writeFileSync(`results/graficos/${arquivo}.svg`, moldura(titulo, sub, grade + b));
}
function linhas(arquivo, titulo, sub, valor) {
  const x0 = 80, x1 = 900, y0 = 430, y1 = 70, max = Math.max(...T.flatMap((t) => CS.map((c) => valor(t, c))));
  const { s: grade, top } = eixoY(max, x0, y0, x1, y1);
  const px = (i) => x0 + 40 + (i * (x1 - x0 - 80)) / (CS.length - 1);
  let b = CS.map((c, i) => `<text x="${px(i)}" y="${y0 + 20}" text-anchor="middle" font-size="13">${c}</text>`).join('') + `<text x="${(x0 + x1) / 2}" y="${y0 + 42}" text-anchor="middle" font-size="12" fill="#555">usuários simultâneos</text>`;
  for (const t of T) {
    const pts = CS.map((c, i) => [px(i), y0 - ((y0 - y1) * valor(t, c)) / top]);
    b += `<polyline fill="none" stroke="${COR[t]}" stroke-width="3" points="${pts.map((p) => p.join(',')).join(' ')}"/>` + pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${COR[t]}"/>`).join('');
  }
  writeFileSync(`results/graficos/${arquivo}.svg`, moldura(titulo, sub, grade + b, 960, 520));
}

const cats = W.map((k) => ({ k, n: WN[k] }));
barras('vazao-100-usuarios', 'Vazão com 100 usuários simultâneos', 'operações por segundo (maior é melhor)', cats, (t, w) => get(t, w, 100).rps);
barras('latencia-p95-100-usuarios', 'Latência p95 com 100 usuários simultâneos', 'milissegundos (menor é melhor)', cats, (t, w) => get(t, w, 100).p95);
barras('latencia-p50-1-usuario', 'Latência p50 com 1 usuário (sem concorrência)', 'milissegundos (menor é melhor)', cats, (t, w) => get(t, w, 1).p50);
for (const w of W) {
  linhas(`escalabilidade-${w}`, `Escalabilidade — ${WN[w]}`, 'vazão (ops/s) × usuários simultâneos', (t, c) => get(t, w, c).rps);
  linhas(`latencia-p95-${w}`, `Latência p95 — ${WN[w]}`, 'milissegundos × usuários simultâneos', (t, c) => get(t, w, c).p95);
}
barras('payload-bytes', 'Bytes por resposta', 'corpo da resposta (gRPC: protobuf serializado); playlist completa = soma das 3 chamadas',
  [{ k: 'leitura', n: 'Usuário (1 registro)' }, { k: 'lista', n: '500 músicas' }, { k: 'composta', n: 'Playlist completa' }], (t, k) => PL[t][k].res);

writeFileSync('results/resultados.csv', 'tecnologia,carga,usuarios,operacoes,erros,ops_por_s,media_ms,p50_ms,p95_ms,p99_ms\n' + R.map((r) => [r.tech, r.workload, r.conc, r.ops, r.erros, r.rps, r.media, r.p50, r.p95, r.p99].join(',')).join('\n') + '\n');

// tabela markdown para o README
const tab = (campo, c) => `| Carga | ${T.map((t) => NOME[t]).join(' | ')} |\n|---|${T.map(() => '---:').join('|')}|\n` + W.map((w) => `| ${WN[w]} | ${T.map((t) => fmt(get(t, w, c)[campo])).join(' | ')} |`).join('\n');
writeFileSync('results/tabelas.md', `### Vazão (ops/s) com 100 usuários\n\n${tab('rps', 100)}\n\n### Latência p95 (ms) com 100 usuários\n\n${tab('p95', 100)}\n\n### Latência p50 (ms) com 1 usuário\n\n${tab('p50', 1)}\n`);
console.log('gráficos, CSV e tabelas gerados');
