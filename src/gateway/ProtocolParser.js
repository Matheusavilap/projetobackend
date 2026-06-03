const HEADER = Buffer.from([0x50, 0xF7]);
const FOOTER = Buffer.from([0x73, 0xC4]);
const MAX_BUFFER = 1024;

class ProtocolParser {
  constructor() { this.buffer = Buffer.alloc(0); }

  feed(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    if (this.buffer.length > MAX_BUFFER) {
      console.warn('⚠️ Buffer excedido. Limpando para evitar memory leak.');
      this.buffer = this.buffer.slice(-MAX_BUFFER);
    }

    const packets = [];
    let start = this.buffer.indexOf(HEADER);

    while (start !== -1) {
      const end = this.buffer.indexOf(FOOTER, start + HEADER.length);
      if (end === -1) break; // Pacote incompleto, aguarda mais dados

      const packet = this.buffer.slice(start, end + FOOTER.length);
      this.buffer = this.buffer.slice(end + FOOTER.length);
      packets.push(packet);
      start = this.buffer.indexOf(HEADER);
    }
    return packets;
  }

  parse(rawPacket) {
    if (rawPacket.length < 5) throw new Error('Pacote muito curto');
    const deviceId = rawPacket.slice(2, 5).toString('hex');
    const msgType = rawPacket[5];
    const data = rawPacket.slice(6, rawPacket.length - 2);
    return { deviceId, msgType, data, raw: rawPacket };
  }

 decodeLocation(data) {
  // Debug: mostra o que realmente chegou
  console.log(`[DEBUG] Data length: ${data.length} bytes | Hex: ${data.toString('hex')}`);
  
  // Aceita 24 a 27 bytes para cobrir variações do protocolo real
  if (data.length < 24) {
    throw new Error(`Payload muito curto: ${data.length} bytes (mínimo esperado: 24)`);
  }

  const epoch = data.readUInt32BE(0);
  const direction = data.readUInt16BE(4) / 100;
  const odometer = data.readUInt32BE(6);
  const hourmeter = data.readUInt32BE(10);
  const flags = data.readUInt16BE(14);
  const speed = data.readUInt8(16);
  
  // Latitude e longitude sempre nos últimos 8 bytes (4+4)
  const latRaw = data.readUInt32BE(data.length - 8);
  const lonRaw = data.readUInt32BE(data.length - 4);

  const gpsFixed = (flags & 0x8000) !== 0;
  const isHistorical = (flags & 0x4000) !== 0;
  const ignitionOn = (flags & 0x2000) !== 0;
  const latNegative = (flags & 0x1000) !== 0;
  const lonNegative = (flags & 0x0800) !== 0;

  return {
    epoch,
    timestamp: new Date(epoch * 1000).toISOString(),
    direction: parseFloat(direction.toFixed(2)),
    odometer,
    hourmeter,
    speed,
    gpsFixed,
    isHistorical,
    ignitionOn,
    latitude: (latNegative ? -1 : 1) * (latRaw / 1_000_000),
    longitude: (lonNegative ? -1 : 1) * (lonRaw / 1_000_000)
  };
}
}

module.exports = ProtocolParser;