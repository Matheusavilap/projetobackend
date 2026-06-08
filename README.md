# 🛰️ Tracker Gateway & Location API

Sistema de ingestão em tempo real para rastreadores GPS via protocolo binário TCP, com parser de pacotes hexadecimais, handshake automático e API REST protegida por JWT com autorização por dispositivo.

## 📐 Arquitetura
┌─────────────────┐
│ Dispositivo │
│ GPS (SFT9001) │
└────────┬────────┘
│ TCP (Hex Binário)
│ Porta 9000
▼
┌─────────────────────────────────────────┐
│ Gateway TCP (Node.js) │
│ ┌───────────────────────────────────┐ │
│ │ Buffer Parser (50F7...73C4) │ │
│ │ - Fragmentação de stream │ │
│ │ - Validação de header/footer │ │
│ └──────────────┬────────────────────┘ │
│ │ │
│ ┌────────────┴────────────┐ │
│ ▼ ▼ │
│ [Ping 01] [Localização 02]│
│ │ │ │
│ ▼ ▼ │
│ ACK Automático Parser 24 bytes │
│ (50F70173C4) - Epoch │
│ - Direção/100 │
│ - Hodômetro │
│ - Horímetro │
│ - Flags (bits) │
│ - Velocidade │
│ - Lat/Lon c/ sinal │
└────────────────────────┬────────────────┘
│
▼
┌─────────────────────┐
│ LocationStore │
│ (FIFO em memória) │
│ Map<deviceId, │
│ location> │
└──────────┬──────────┘
│
▼
┌─────────────────────┐
│ API REST │
│ Express + JWT │
│ Porta 3000 │
└──────────┬──────────┘
│
▼
┌─────────────────────┐
│ Frontend │
│ (React/Vue/etc) │
└─────────────────────┘

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime assíncrono ideal para I/O de rede
- **Express** - Framework HTTP para API REST
- **net (nativo)** - Servidor TCP para gateway binário
- **jsonwebtoken** - Autenticação stateless com JWT
- **helmet** - Segurança HTTP headers
- **cors** - Cross-Origin Resource Sharing
- **Jest + Supertest** - Testes automatizados

## 📁 Estrutura de Pastas
tracker-gateway/
├── index.js # Entry point: inicia API + Gateway TCP
├── package.json # Dependências e scripts
├── README.md # Esta documentação
├── .gitignore # Arquivos ignorados no versionamento
├── src/
│ ├── gateway/
│ │ ├── TcpServer.js # Servidor TCP com buffer e ACK automático
│ │ └── ProtocolParser.js # Parser binário + decodificação de pacotes
│ ├── services/
│ │ └── LocationStore.js # Storage FIFO em memória (Map)
│ └── api/
│ ├── routes.js # Rotas da API (login + location)
│ └── middleware.js # Autenticação JWT + autorização por device
├── tests/
│ ├── parser.test.js # Testes unitários do parser binário
│ └── api.test.js # Testes de integração da API
└── validation-report-*.json # Relatórios de validação automática


## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ (recomendado 20+)
- npm ou yarn

### Passos

```bash
# Clone o repositório
git clone https://github.com/Matheusavilap/projetobackend.git
cd projetobackend

# Instale as dependências
npm install

# Inicie o servidor
npm start


O servidor iniciará dois serviços simultâneos:

Gateway TCP: localhost:9000 (recebe pacotes dos dispositivos)

API REST: http://localhost:3000 (endpoint para frontend)

🔐 Autenticação e Autorização
Modelo Implementado: JWT com Escopo por Dispositivo

O sistema utiliza JSON Web Tokens (JWT) para garantir que cada usuário só acesse os veículos autorizados.

Fluxo de Autenticação

1 Login: Frontend envia credenciais + lista de dispositivos permitidos

POST /api/v1/auth/login
Content-Type: application/json

{
  "userId": "user_123",
  "allowedDevices": ["0a3f73", "1b2c3d"]
}

2 Resposta: Backend retorna JWT assinado com payload contendo allowedDevices

{
  "status": "ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h",
  "allowedDevices": ["0a3f73", "1b2c3d"]
}

3 Consulta Protegida: Frontend envia token no header Authorization
GET /api/v1/location/0A3F73
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4 Validação: Middleware verifica:
✅ Assinatura do token (integridade)
✅ Expiração (validade temporal)

5 Respostas Possíveis:
200 OK - Usuário autenticado E autorizado
401 Unauthorized - Token inválido, expirado ou ausente
403 Forbidden - Token válido, mas usuário não tem permissão para este dispositivo
404 Not Found - Dispositivo não existe ou ainda não enviou dados
Vantagens desta Abordagem
Stateless: Não requer sessão no servidor, escalabilidade horizontal
Seguro: Token assinado, expiração automática, sem compartilhamento de chaves
Granular: Controle por dispositivo individual
Extensível: Fácil adicionar roles, permissões complexas, refresh tokens
Frontend-ready: Padrão Bearer token nativo em React/Vue/Angular

Exemplo: 50F70A3F73025EFCF950156F017D784000008CA0F80084003C013026A1029E72BD73C4
Resultado decodificado:

{
  "epoch": 1593637200,
  "timestamp": "2020-07-01T21:00:00.000Z",
  "direction": 54.87,
  "odometer": 25000000,
  "hourmeter": 36000,
  "speed": 60,
  "gpsFixed": true,
  "isHistorical": true,
  "ignitionOn": true,
  "latitude": -19.932833,
  "longitude": -43.995131
}

Testes Automatizados

# Executa todos os testes com cobertura
npm test

# Executa em modo watch (desenvolvimento)
npm run test:watch

Validação Manual (PowerShell)
1. Enviar Ping + Localização via TCP

# Ping
$pingHex = "50F70A3F730150494E4773C4"
$bytes = for ($i = 0; $i -lt $pingHex.Length; $i += 2) { [Convert]::ToByte($pingHex.Substring($i, 2), 16) }
$tcp = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 9000)
$stream = $tcp.GetStream()
$stream.Write($bytes, 0, $bytes.Length)
$tcp.Close()

# Localização
$locHex = "50F70A3F73025EFCF950156F017D784000008CA0F80084003C013026A1029E72BD73C4"
$bytes = for ($i = 0; $i -lt $locHex.Length; $i += 2) { [Convert]::ToByte($locHex.Substring($i, 2), 16) }
$tcp = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 9000)
$stream = $tcp.GetStream()
$stream.Write($bytes, 0, $bytes.Length)
$tcp.Close()

2. Fazer Login e obter JWT

$loginBody = @{
    userId = "user_123"
    allowedDevices = @("0a3f73")
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

3. Consultar API com JWT

$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/location/0A3F73" -Headers $headers -Method Get
$response.data | ConvertTo-Json -Depth 10

📝 Decisões Técnicas

1. Buffer Stateless no Parser TCP
Decisão: Implementar parser que acumula chunks até encontrar pacote completo (50F7...73C4).

Motivo: TCP é um stream contínuo que não preserva limites de pacotes. Em redes 2G instáveis, pacotes podem chegar fragmentados ou múltiplos pacotes em um único chunk. O buffer stateless garante:

✅ Não perde dados em conexões instáveis
✅ Lida com fragmentação automaticamente
✅ Sem complexidade de máquina de estados


2. Storage FIFO em Memória (Map)

Decisão: Usar Map nativo do JavaScript para armazenar última localização por device_id.
Motivo: O requisito do projeto é FIFO (último ponto = última localização). O Map oferece:
✅ Acesso O(1) para leitura/escrita
✅ Sobrescrita atômica (sem locks)
✅ Memória otimizada (1 registro por dispositivo)
✅ Interface compatível com Redis/PostgreSQL para migração futura

3. JWT com Claims de Escopo
Decisão: Token JWT contendo allowedDevices: [...] para autorização granular.
Motivo: Atende ao requisito "usuário só acessa seu veículo" com:
✅ Stateless (escalabilidade horizontal)
✅ Assinatura criptográfica (integridade)
✅ Expiração automática (segurança temporal)
✅ Controle por dispositivo individual
✅ Padrão da indústria (Bearer token)

4. ACK Automático para Heartbeat
Decisão: Responder imediatamente com 50F70173C4 ao receber Ping (tipo 01).
Motivo: O dispositivo envia heartbeat a cada 2 minutos. Se não receber ACK:
Interrompe envio de localizações em tempo real
Armazena dados em memória interna
Envia posteriormente como "histórico"
O ACK garante fluxo contínuo de dados em tempo real.

5. Flexibilidade no Payload (24-27 bytes)
Decisão: Parser aceita payloads de 24 a 27 bytes, lendo lat/lon dos últimos 8 bytes.
Motivo: Protocolos reais podem ter pequenas variações não documentadas. A flexibilidade:
✅ Evita falhas por bytes extras
✅ Mantém compatibilidade com documentação
✅ Facilita debug e evolução do protocolo


🚀 Melhorias Futuras



1. Persistência com Redis/PostgreSQL
Atual: Map em memória (perde dados ao reiniciar)
Proposta:
// Redis para alta performance
const redis = require('redis');
const client = redis.createClient();

await client.hSet('locations', deviceId, JSON.stringify(location));
const loc = await client.hGet('locations', deviceId);

Benefícios: Persistência, TTL automático, escalabilidade horizontal, pub/sub para tempo real.


2. Worker Pool para Alto Throughput
Atual: Parsing síncrono no event loop
Proposta: Worker threads ou BullMQ para processamento assíncrono de dezenas de milhões de pacotes/dia.


3. Métricas e Observabilidade
Proposta:
Prometheus + Grafana para monitoramento
Logs estruturados (Winston/Pino)
Tracing distribuído (OpenTelemetry)
Alertas para latência, erros, conexões ativas

4. WebSocket para Frontend em Tempo Real
Proposta: Endpoint WebSocket que notifica frontend sobre novas localizações sem polling.

5. Rate Limiting e DDoS Protection
Proposta: express-rate-limit + Cloudflare/AWS WAF para proteger contra abuso.

6. Refresh Tokens e Revogação
Atual: JWT com expiração fixa (1h)
Proposta: Implementar refresh tokens + blacklist para revogação imediata em caso de comprometimento.

7. Validação de Schema com Zod/Joi
Proposta: Validar payload de login, device_id, e respostas de API para prevenir injection e erros de tipo.

8. CI/CD Pipeline
Proposta: GitHub Actions para:
Rodar testes automaticamente em cada push
Build e deploy automático
Scan de vulnerabilidades (npm audit, Snyk)
Code quality (ESLint, Prettier)

📊 Fluxo Completo em 10 Passos

Dispositivo conecta via TCP na porta 9000

Envia pacote hex começando com 50F7 e terminando com 73C4

Gateway acumula chunks no buffer até encontrar pacote completo

Parser valida estrutura e extrai deviceId, msgType e data

Se tipo = 01 (Ping): servidor responde ACK imediatamente (50F70173C4)

Se tipo = 02 (Localização): parser decodifica os 24+ bytes do payload

Flags são interpretadas bit a bit para status (GPS, ignição, sinal)

Latitude/longitude recebem sinal conforme flags e são divididas por 1.000.000

Objeto final é armazenado no LocationStore sobrescrevendo posição anterior (FIFO)

Frontend consulta via HTTP com JWT e recebe JSON estruturado com a última localização

📄 Licença
Este projeto foi desenvolvido como parte de um teste técnico e está disponível para fins educacionais e de avaliação.

👤 Autor
Desenvolvido por Matheus Ávila

