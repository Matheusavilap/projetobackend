const net = require('net');

const API_BASE = 'http://localhost:3000/api/v1';
const TCP_HOST = '127.0.0.1';
const TCP_PORT = 9000;
const DEVICE_ID = '0A3F73';

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

const log = (color, msg) => console.log(`${colors[color]}${msg}${colors.reset}`);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Converte string Hex para Buffer
const hexToBuffer = (hex) => Buffer.from(hex, 'hex');

// ── TESTE 1: TCP Ping ──
async function testTcpPing() {
  log('yellow', '[1] Enviando Ping (Heartbeat) via TCP...');
  const hex = '50F70A3F730150494E4773C4';
  
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.connect(TCP_PORT, TCP_HOST, () => {
      client.write(hexToBuffer(hex));
    });

    client.on('data', (data) => {
      const response = data.toString('hex').toUpperCase();
      if (response === '50F70173C4') {
        log('green', '  ✅ Sucesso: ACK recebido corretamente (50F70173C4)');
        resolve(true);
      } else {
        log('red', `  ❌ Falha: Resposta inesperada: ${response}`);
        resolve(false);
      }
      client.destroy();
    });

    client.on('error', (err) => {
      log('red', `  ❌ Falha na conexão TCP: ${err.message}`);
      resolve(false);
    });

    setTimeout(() => {
      log('red', '  ❌ Falha: Timeout na resposta TCP (Servidor está rodando?)');
      client.destroy();
      resolve(false);
    }, 2000);
  });
}

// ── TESTE 2: TCP Localização ──
async function testTcpLocation() {
  log('yellow', '[2] Enviando Pacote de Localização via TCP...');
  const hex = '50F70A3F73025EFCF950156F017D784000008CA0F80084003C013026A1029E72BD73C4';
  
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.connect(TCP_PORT, TCP_HOST, () => {
      client.write(hexToBuffer(hex));
      log('green', '  ✅ Pacote enviado com sucesso. Aguardando processamento...');
      client.destroy();
      resolve(true);
    });

    client.on('error', (err) => {
      log('red', `  ❌ Falha na conexão TCP: ${err.message}`);
      resolve(false);
    });
  });
}

// ── TESTE 3: HTTP Login (Obter JWT) ──
async function testHttpLogin() {
  log('yellow', '[3] Autenticando via API (Obtendo JWT)...');
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_teste_123',
        allowedDevices: [DEVICE_ID.toLowerCase()]
      })
    });
    const data = await response.json();
    
    if (response.ok && data.token) {
      log('green', `  ✅ Sucesso: Token JWT obtido (${data.token.substring(0, 30)}...)`);
      return data.token;
    } else {
      log('red', `  ❌ Falha no login: ${data.error || response.statusText}`);
      return null;
    }
  } catch (err) {
    log('red', `  ❌ Erro na requisição de login: ${err.message}`);
    return null;
  }
}

// ── TESTE 4: HTTP Get Localização (Autorizado) ──
async function testHttpGetLocation(token) {
  log('yellow', `[4] Consultando localização do dispositivo ${DEVICE_ID} (Autorizado)...`);
  try {
    const response = await fetch(`${API_BASE}/location/${DEVICE_ID}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (response.status === 200 && data.status === 'ok') {
      log('green', '  ✅ Sucesso: Localização retornada!');
      console.log(`${colors.gray}  Dados:`, JSON.stringify(data.data, null, 2), colors.reset);
      return true;
    } else {
      log('red', `  ❌ Falha: Esperado 200, recebido ${response.status}. ${data.message || data.error}`);
      return false;
    }
  } catch (err) {
    log('red', `  ❌ Erro na requisição: ${err.message}`);
    return false;
  }
}

// ── TESTE 5: HTTP Get Localização (NÃO Autorizado) ──
async function testHttpGetLocationUnauthorized(token) {
  log('yellow', '[5] Tentando acessar dispositivo NÃO autorizado (999999)...');
  try {
    const response = await fetch(`${API_BASE}/location/999999`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 403) {
      log('green', '  ✅ Sucesso: Acesso bloqueado corretamente (403 Forbidden)');
      return true;
    } else {
      const data = await response.json();
      log('red', `  ❌ Falha: Esperado 403, recebido ${response.status}. ${data.message || data.error}`);
      return false;
    }
  } catch (err) {
    log('red', `  ❌ Erro na requisição: ${err.message}`);
    return false;
  }
}

// ── EXECUÇÃO PRINCIPAL ──
async function runAllTests() {
  log('cyan', '\n========================================');
  log('cyan', '  TESTE AUTOMATIZADO - TRACKER GATEWAY');
  log('cyan', '========================================\n');

  const results = [];
  
  results.push(await testTcpPing());
  await sleep(300);
  
  results.push(await testTcpLocation());
  await sleep(500); // Tempo para o servidor processar e salvar no Map
  
  const token = await testHttpLogin();
  if (!token) {
    log('red', '\n❌ Abortando testes HTTP: Falha na autenticação.');
    process.exit(1);
  }

  results.push(await testHttpGetLocation(token));
  results.push(await testHttpGetLocationUnauthorized(token));

  // Resumo
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log('cyan', '\n========================================');
  log('cyan', `  RESULTADO FINAL: ${passed}/${total} testes passaram`);
  log('cyan', '========================================\n');

  if (passed === total) {
    log('green', '🎉 Todos os testes passaram com sucesso! O sistema está pronto para entrega.');
    process.exit(0);
  } else {
    log('red', '⚠️ Alguns testes falharam. Verifique os logs acima e se o servidor (npm start) está rodando.');
    process.exit(1);
  }
}

runAllTests();