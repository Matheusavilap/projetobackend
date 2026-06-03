/**
 * Parser robusto para o protocolo SFT9001
 * Lida com streaming TCP, bufferização e extração de campos hexadecimais
 * Especificação: Header(50F7) + DeviceID(3B) + Type(1B) + Data + Footer(73C4)
 */
class SFT9001Parser {
  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Alimenta o parser com chunk de dados TCP e retorna pacotes completos
   * @param {Buffer} chunk - Dados brutos recebidos via socket
   * @returns {Buffer[]} - Array de pacotes completos prontos para parse
   */
  feed(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages = [];

    while (this.buffer.length >= 8) {
      // Procura pelo header 50F7 (case-insensitive em hex)
      const headerIndex = this.buffer.indexOf('50f7', undefined, 'hex');
      if (headerIndex === -1) {
        // Nenhum header válido encontrado, descarta buffer corrompido
        this.buffer = Buffer.alloc(0);
        return messages;
      }
      
      // Descarta dados antes do header (sincronização)
      if (headerIndex > 0) {
        this.buffer = this.buffer.slice(headerIndex);
      }

      // Procura pelo footer 73C4 para delimitar pacote completo
      const footerIndex = this.buffer.indexOf('73c4', undefined, 'hex');
      if (footerIndex === -1 || footerIndex < 7) {
        // Pacote incompleto, aguarda mais dados do stream TCP
        break;
      }

      // Extrai pacote completo: header + conteúdo + footer (2 bytes)
      const packet = this.buffer.slice(0, footerIndex + 2);
      this.buffer = this.buffer.slice(footerIndex + 2);
      messages.push(packet);
    }
    return messages;
  }

  /**
   * Parseia um pacote hex completo e extrai campos estruturados
   * @param {Buffer} packet - Pacote binário completo
   * @returns {Object} - Mensagem parseada com deviceId, type e data
   */
  parsePacket(packet) {
    const hex = packet.toString('hex');
    
    // Estrutura fixa: Header(4 chars) + DeviceID(6 chars) + Type(2 chars) + Data + Footer(4 chars)
    const deviceId = hex.slice(4, 10).toUpperCase(); // Normaliza para maiúsculas
    const type = hex.slice(10, 12);
    
    // Extrai seção de dados: remove header(4) + deviceId(6) + type(2) + footer(4)
    const dataHex = hex.slice(12, -4);

    if (type === '01') {
      return { deviceId, type: 'ping' };
    }
    
    if (type === '02') {
      return { deviceId, type: 'location', data: this.parseLocation(dataHex) };
    }
    
    // Tipo desconhecido: retorna raw para debug/logging
    return { deviceId, type: 'unknown', raw: dataHex };
  }

  /**
   * Parseia a seção de dados de uma mensagem de localização (24 bytes)
   * @param {string} dataHex - Dados em hexadecimal (sem header/footer)
   * @returns {Object} - Campos de localização decodificados
   */
  parseLocation(dataHex) {
    // Garante remoção de footer residual e converte para buffer
    const cleanHex = dataHex.toLowerCase().endsWith('73c4') 
      ? dataHex.slice(0, -4) 
      : dataHex;
    
    const buf = Buffer.from(cleanHex, 'hex');
    
    // Validação crítica: dados de localização devem ter exatamente 24 bytes
    if (buf.length < 24) {
      throw new Error(`Dados insuficientes para parsear localização: esperado 24 bytes, recebido ${buf.length}`);
    }

    // Decodificação Big-Endian conforme especificação SFT9001
    const epoch = buf.readUInt32BE(0);              // 4 bytes: timestamp Unix
    const direction = buf.readUInt16BE(4) / 100;    // 2 bytes: ângulo 0-359.99°
    const odometer = buf.readUInt32BE(6);           // 4 bytes: distância em metros
    const hourmeter = buf.readUInt32BE(10);         // 4 bytes: tempo em minutos
    const flags = buf.readUInt16BE(14);             // 2 bytes: bitmask de status
    const speed = buf.readUInt8(16);                // 1 byte: velocidade km/h ← OFFSET CRÍTICO
    const latRaw = buf.readUInt32BE(17);            // 4 bytes: latitude bruta
    const lonRaw = buf.readUInt32BE(21);            // 4 bytes: longitude bruta

    // Extrai bits das flags (contagem MSB-first: bit 1 = bit 15 em 0-based indexing)
    // Ex: F800 = 1111100000000000 → bits 1-5 ativos
    const getBit = (bitNumber) => ((flags >> (16 - bitNumber)) & 1) === 1;
    
    // Aplica sinal nas coordenadas conforme flags de negatividade
    const latSign = getBit(4) ? -1 : 1;
    const lonSign = getBit(5) ? -1 : 1;
    
    return {
      timestamp: new Date(epoch * 1000).toISOString(),
      epoch,
      direction: Math.round(direction * 100) / 100, // Precisão de 2 casas decimais
      odometer,
      hourmeter,
      flags: {
        gpsFixed: getBit(1),
        isHistorical: getBit(2),
        ignitionOn: getBit(3),
        latNegative: getBit(4),
        lonNegative: getBit(5)
      },
      speed,
      latitude: Math.round(latSign * (latRaw / 1_000_000) * 1_000_000) / 1_000_000,
      longitude: Math.round(lonSign * (lonRaw / 1_000_000) * 1_000_000) / 1_000_000
    };
  }
}

module.exports = { SFT9001Parser };