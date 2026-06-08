## 📐 Arquitetura
- Gateway TCP binário (porta 9000)
- Parser de protocolo SFT9001 com buffer de stream
- ACK automático para heartbeat
- Storage FIFO em memória (substituível por Redis/Postgres)
- API REST com autenticação por API Key

## 🛠️ Instalação
npm install

## ▶️ Uso
npm start
# TCP: localhost:9000 | REST: http://localhost:3000

## 🔑 Autenticação
Header: x-api-key: dev-secret-key-123

## 🧪 Testes
npm test

## 📝 Decisões Técnicas
- Buffer stateless para lidar com fragmentação TCP
- Map em memória para O(1) lookup da última localização
- Middleware de API Key para segurança básica (extensível para JWT)

## 🚀 Melhorias Futuras
- Redis para persistência e escala horizontal
- Métricas Prometheus para monitoramento
- WebSocket para frontend em tempo real

# ❌ Sem API Key → deve retornar 401
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/location/0A3F73" -Method Get -ErrorAction Stop

# ✅ Com API Key → deve retornar 200
$headers = @{ "x-api-key" = "dev-secret-key-123" }
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/location/0A3F73" -Headers $headers -Method Get