import { parentPort, workerData } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';
import { clienteRest, clienteGraphQL, clienteGrpc, clienteSoap } from '../src/clientes.js';

const { tech, workload, usuarios, duracaoMs, aquecimentoMs, portas } = workerData;
const fab = { rest: clienteRest, graphql: clienteGraphQL, grpc: clienteGrpc, soap: clienteSoap };
const rtt = workload === 'composta_rtt' ? 20 : 0; // RTT simulado de 20 ms por chamada
const c = await fab[tech]({ porta: portas[tech], rtt });
const rnd = (n) => 1 + Math.floor(Math.random() * n);

const cargas = {
  // leitura pequena: 1 usuário
  leitura: () => c.usuarios.obter(rnd(100)),
  // listagem grande: 500 músicas
  lista: () => c.musicas.listar(),
  // composta: playlist + músicas + dono (REST/SOAP/gRPC: 3 chamadas; GraphQL: 1)
  composta: () => c.playlistCompleta(rnd(300)),
  composta_rtt: () => c.playlistCompleta(rnd(300)),
  // escrita: cria e remove um usuário (mantém o tamanho dos dados estável)
  escrita: async () => { const u = await c.usuarios.criar({ nome: 'Carga', idade: 20 }); await c.usuarios.remover(u.id); },
};
const op = cargas[workload];

const lat = []; let erros = 0, feitas = 0;
const t0 = performance.now(), fimAquec = t0 + aquecimentoMs, fim = fimAquec + duracaoMs;
async function usuarioVirtual() {
  while (performance.now() < fim) {
    const ini = performance.now();
    try { await op(); } catch { if (ini >= fimAquec) erros++; continue; }
    const f = performance.now();
    if (ini >= fimAquec) { lat.push(f - ini); feitas++; }
  }
}
await Promise.all(Array.from({ length: usuarios }, usuarioVirtual));
c.fechar();
parentPort.postMessage({ lat, erros, feitas });
process.exit(0);
