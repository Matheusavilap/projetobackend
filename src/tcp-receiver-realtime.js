const net = require('net');

const PORT = 3000;
const HOST = '0.0.0.0';
const INACTIVITY_TIMEOUT_MS = 10_000; // 10s sem dados = aviso

let packetCount = 0;
let totalBytes = 0;

const server = net.createServer((socket) => {
  const peer = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`\n🔗 [${new Date().toLocaleTimeString()}] Conexão recebida de ${peer}`);

  socket.setEncoding(null); // Garante que recebe Buffer puro, sem conversão

  let inactivityTimer = setTimeout(() => {
    console.warn(`⏳ [${new Date().toLocaleTimeString()}] ${peer} inativo há ${INACTIVITY_TIMEOUT_MS/1000}s (nenhum dado recebido)`);
  }, INACTIVITY_TIMEOUT_MS);

  socket.on('data', (chunk) => {
    clearTimeout(inactivityTimer);
    packetCount++;
    totalBytes += chunk.length;

    console.log(`\n📦 [${new Date().toLocaleTimeString()}] Pacote #${packetCount} | ${chunk.length} bytes`);
    console.log('🔹 Hex (compacto):', chunk.toString('hex'));
    console.log('🔹 Hex (espaçado):', chunk.toString('hex').match(/.{1,2}/g).join(' '));
    console.log('🔹 Bytes dec:', Array.from(chunk));
    console.log(`📊 Total recebido: ${totalBytes} bytes | ${packetCount} pacote(s)\n`);

    // Reinicia timer de inatividade
    inactivityTimer = setTimeout(() => {
      console.warn(`⏳ [${new Date().toLocaleTimeString()}] ${peer} inativo há ${INACTIVITY_TIMEOUT_MS/1000}s`);
    }, INACTIVITY_TIMEOUT_MS);
  });

  socket.on('end', () => console.log(`🔚 [${new Date().toLocaleTimeString()}] ${peer} encerrou a conexão`));
  socket.on('error', (err) => console.error(`❌ [${new Date().toLocaleTimeString()}] Erro em ${peer}:`, err.message));
  socket.on('close', () => {
    clearTimeout(inactivityTimer);
    console.log(`🔌 [${new Date().toLocaleTimeString()}] ${peer} desconectado`);
  });
});

server.on('error', (err) => console.error('❌ Erro no servidor:', err.message));

server.listen(PORT, HOST, () => {
  console.log(`🟢 [${new Date().toLocaleTimeString()}] Servidor TCP ativo em ${HOST}:${PORT}`);
  console.log(`⏳ Aguardando conexão do dispositivo... (Ctrl+C para sair)`);
});