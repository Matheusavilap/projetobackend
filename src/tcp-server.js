const net = require('net');
const { SFT9001Parser } = require('./parser');
const storage = require('./storage');

function startTcpServer(port = 3001) {
  const parser = new SFT9001Parser();
  const server = net.createServer((socket) => {
    console.log(`📡 Conectado: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on('data', async (data) => {
      const packets = parser.feed(data);
      for (const pkt of packets) {
        const msg = parser.parsePacket(pkt);
        if (msg.type === 'ping') {
          // ACK: 50F7 + 01 + 73C4
          socket.write(Buffer.from('50f70173c4', 'hex'));
        } else if (msg.type === 'location') {
          await storage.saveLatest(msg.deviceId, msg.data);
        }
      }
    });

    socket.on('error', (err) => console.error('❌ Erro TCP:', err.message));
    socket.on('end', () => console.log('🔌 Rastreador desconectado.'));
  });

  server.listen(port, () => console.log(`🔌 TCP Server ouvindo na porta ${port}`));
  return server;
}

module.exports = { startTcpServer };