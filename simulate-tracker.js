// simulate-tracker.js - VERSÃO CORRIGIDA
const net = require('net');

const PING_PACKET = '50F70A3F730150494E4773C4';
const LOCATION_PACKET = '50F70A3F73025EFCF950156F017D784000008CA0F80084003C013026A1029E72BD73C4';

const client = new net.Socket();
let step = 0; // 0 = enviar ping, 1 = enviar location, 2 = concluir

client.connect(3001, 'localhost', () => {
  console.log('📡 Conectado ao servidor TCP (porta 3001)');
  
  // Passo 1: Envia PING e aguarda ACK
  console.log('📤 [1/2] Enviando PING...');
  client.write(Buffer.from(PING_PACKET, 'hex'));
});

client.on('data', (data) => {
  const hex = data.toString('hex').toUpperCase();
  
  if (step === 0 && hex.includes('50F70173C4')) {
    console.log('📥 ACK de PING recebido:', hex);
    step = 1;
    
    // Passo 2: Envia LOCALIZAÇÃO (não espera resposta)
    console.log('📤 [2/2] Enviando LOCALIZAÇÃO...');
    client.write(Buffer.from(LOCATION_PACKET, 'hex'));
    
    // Aguarda um pouco e encerra (location não tem ACK)
    setTimeout(() => {
      console.log('✅ Pacote de localização enviado com sucesso!');
      console.log('🔌 Encerrando conexão...');
      client.end();
    }, 500);
  }
});

client.on('close', () => {
  console.log('\n🎉 Pronto! Agora teste a API:');
  console.log('   iwr http://localhost:3000/api/v1/location/0A3F73 -Headers @{ Authorization = "Bearer SEU_TOKEN" }');
  process.exit(0);
});

client.on('error', (err) => {
  console.error('❌ Erro de conexão:', err.message);
  process.exit(1);
});

// Timeout de segurança
setTimeout(() => {
  if (step < 2) {
    console.log('⚠️ Timeout - processo não concluído');
    console.log('💡 Dica: Verifique se o servidor TCP está rodando na porta 3001');
  }
  client.destroy();
  process.exit(1);
}, 5000);