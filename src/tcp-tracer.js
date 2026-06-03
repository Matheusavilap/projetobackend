// tcp-receiver.js
const net = require('net');

const PORT = 3000;
const HOST = '0.0.0.0';

const server = net.createServer((socket) => {
  console.log('✅ Dispositivo conectado:', socket.remoteAddress);

  // Garante que não haverá conversão automática para string
  socket.setEncoding(null);

  socket.on('data', (chunk) => {
    // `chunk` já é um Buffer com os bytes brutos
    console.log('\n📦 Dados recebidos:');
    console.log('Tamanho:', chunk.length, 'bytes');
    console.log('Hex (contínuo):', chunk.toString('hex'));
    console.log('Hex (formatado):', chunk.toString('hex').match(/.{1,2}/g).join(' '));
    console.log('Array de bytes:', Array.from(chunk));
  });

  socket.on('error', (err) => console.error('❌ Erro no socket:', err.message));
  socket.on('close', () => console.log('🔌 Dispositivo desconectado'));
});

server.listen(PORT, HOST, () => {
  console.log(`🟢 Servidor TCP ouvindo em ${HOST}:${PORT}`);
});