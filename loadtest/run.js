// Orquestrador dos testes de carga: tecnologia x carga de trabalho x concorrência.
// Uso: node loadtest/run.js [--duracao=8] [--aquecimento=2] [--conc=1,10,50,100] [--tecs=rest,graphql,grpc,soap] [--cargas=leitura,lista,composta,escrita]
import { Worker } from 'node:worker_threads';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const duracao = Number(arg('duracao', 8)) * 1000, aquec = Number(arg('aquecimento', 2)) * 1000;
const concs = arg('conc', '1,10,50,100').split(',').map(Number);
const tecs = arg('tecs', 'rest,graphql,grpc,soap').split(',');
const cargas = arg('cargas', 'leitura,lista,composta,escrita').split(',');
const saida = arg('saida', 'results/resultados.json');
const portas = { rest: 3001, graphql: 3002, grpc: 3003, soap: 3004 };
const MAX_WORKERS = 4; // threads do gerador de carga (a máquina tem 14 núcleos)

const pct = (a, p) => a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];

async function rodar(tech, workload, conc) {
  const nw = Math.min(conc, MAX_WORKERS);
  const partes = Array.from({ length: nw }, (_, i) => Math.floor(conc / nw) + (i < conc % nw ? 1 : 0));
  const res = await Promise.all(partes.map((usuarios) => new Promise((ok, no) => {
    const w = new Worker(fileURLToPath(new URL('./worker.js', import.meta.url)), {
      workerData: { tech, workload, usuarios, duracaoMs: duracao, aquecimentoMs: aquec, portas },
    });
    w.once('message', ok); w.once('error', no);
  })));
  const lat = res.flatMap((r) => r.lat).sort((a, b) => a - b);
  const erros = res.reduce((s, r) => s + r.erros, 0);
  const n = lat.length;
  return {
    tech, workload, conc, ops: n, erros,
    rps: +(n / (duracao / 1000)).toFixed(1),
    media: +(lat.reduce((s, x) => s + x, 0) / (n || 1)).toFixed(2),
    p50: +(pct(lat, 50) ?? 0).toFixed(2), p95: +(pct(lat, 95) ?? 0).toFixed(2), p99: +(pct(lat, 99) ?? 0).toFixed(2),
  };
}

mkdirSync(fileURLToPath(new URL('../results', import.meta.url)), { recursive: true });
const todos = [];
for (const workload of cargas) for (const conc of concs) for (const tech of tecs) {
  const r = await rodar(tech, workload, conc);
  todos.push(r);
  console.log(`${workload.padEnd(9)} c=${String(conc).padStart(3)} ${tech.padEnd(8)} ${String(r.rps).padStart(8)} ops/s  p50=${r.p50}ms p95=${r.p95}ms p99=${r.p99}ms erros=${r.erros}`);
  writeFileSync(saida, JSON.stringify({ config: { duracao: duracao / 1000, aquecimento: aquec / 1000, concs }, resultados: todos }, null, 2));
}
