### Vazão (ops/s) com 100 usuários

| Carga | REST | GraphQL | gRPC | SOAP |
|---|---:|---:|---:|---:|
| Leitura simples | 33,034 | 6,551 | 33,644 | 15,591 |
| Lista 500 músicas | 6,156 | 2,052 | 5,402 | 709 |
| Playlist completa | 9,931 | 5,490 | 9,960 | 4,400 |
| Playlist completa + RTT | 1,554 | 3,100 | 1,556 | 1,549 |
| Escrita (criar+remover) | 13,103 | 3,426 | 16,135 | 7,480 |

### Latência p95 (ms) com 100 usuários

| Carga | REST | GraphQL | gRPC | SOAP |
|---|---:|---:|---:|---:|
| Leitura simples | 5.7 | 20 | 5.5 | 9.2 |
| Lista 500 músicas | 29 | 58 | 24 | 150 |
| Playlist completa | 15 | 23 | 15 | 28 |
| Playlist completa + RTT | 67 | 35 | 68 | 67 |
| Escrita (criar+remover) | 12 | 36 | 9.6 | 18 |

### Latência p50 (ms) com 1 usuário

| Carga | REST | GraphQL | gRPC | SOAP |
|---|---:|---:|---:|---:|
| Leitura simples | 0.1 | 0.2 | 0.1 | 0.3 |
| Lista 500 músicas | 0.3 | 0.7 | 0.3 | 3.6 |
| Playlist completa | 0.2 | 0.5 | 0.2 | 0.8 |
| Playlist completa + RTT | 65 | 32 | 65 | 65 |
| Escrita (criar+remover) | 0.2 | 0.5 | 0.3 | 0.6 |
