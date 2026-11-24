// Sobe as 4 APIs em portas diferentes (mesmo processo, uma Store por API).
import http from 'node:http';
import * as grpc from '@grpc/grpc-js';
import { Store, popular } from './store.js';
import { criarRest } from './rest.js';
import { criarGraphQL } from './graphql.js';
import { criarGrpc } from './grpc.js';
import { criarSoap } from './soap.js';

export const PORTAS = { rest: 3001, graphql: 3002, grpc: 3003, soap: 3004 };
const nova = () => popular(new Store());

criarRest(nova()).listen(PORTAS.rest, () => console.log(`REST     http://localhost:${PORTAS.rest}`));
criarGraphQL(nova()).listen(PORTAS.graphql, () => console.log(`GraphQL  http://localhost:${PORTAS.graphql}/graphql`));
criarGrpc(nova()).bindAsync(`0.0.0.0:${PORTAS.grpc}`, grpc.ServerCredentials.createInsecure(), () => console.log(`gRPC     localhost:${PORTAS.grpc}`));
const s = http.createServer((_q, r) => r.writeHead(404).end());
criarSoap(nova(), s);
s.listen(PORTAS.soap, () => console.log(`SOAP     http://localhost:${PORTAS.soap}/soap?wsdl`));
