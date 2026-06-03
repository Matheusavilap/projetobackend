const net = require('net');
const ProtocolParser = require('./ProtocolParser');
const LocationStore = require('../services/LocationStore');

const ACK_PING = Buffer.from([0x50, 0xF7, 0x01, 0x73, 0xC4]);

class TcpGateway {
  constructor(port) {
    this.port = port;
    this.server = net.createServer();
    this.parser = new ProtocolParser();
  }

  start() {
    this.server.on('connection', this.handleConnection.bind(this));
    this.server.listen(this.port, () => console.log(`🟢 Gateway TCP ativo na porta ${this.port}`));
    this.server.on('error', err => console.error('❌ Erro no Gateway TCP:', err.message));
  }

  handleConnection(socket) {
    const peer = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`🔗 Dispositivo conectado: ${peer}`);
    socket.setNoDelay(true);

    socket.on('data', (chunk) => {
      const packets = this.parser.feed(chunk);
      packets.forEach(pkt => this.processPacket(socket, pkt));
    });

    socket.on('error', err => console.error(`⚠️ Socket error (${peer}):`, err.message));
    socket.on('close', () => console.log(`🔌 Dispositivo desconectado: ${peer}`));
  }

  processPacket(socket, raw) {
    try {
      const { deviceId, msgType, data } = this.parser.parse(raw);

      if (msgType === 0x01) {
        // Heartbeat/Ping -> Responde ACK para manter fluxo
        socket.write(ACK_PING);
        console.log(`💓 [${deviceId}] Ping recebido. ACK enviado.`);
      } 
      else if (msgType === 0x02) {
        const location = this.parser.decodeLocation(data);
        // FIFO: sobrescreve sempre com a última localização recebida
        LocationStore.upsert(deviceId, location);
        console.log(`📍 [${deviceId}] Localização atualizada: ${location.latitude}, ${location.longitude}`);
      }
    } catch (err) {
      console.error('❌ Erro ao processar pacote:', err.message);
    }
  }
}

module.exports = TcpGateway;