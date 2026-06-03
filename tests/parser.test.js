const ProtocolParser = require('../src/gateway/ProtocolParser');
const LocationStore = require('../src/services/LocationStore');

test('Deve decodificar pacote de localização corretamente', () => {
  const parser = new ProtocolParser();
  // Exemplo do PDF: 50F7 0A3F73 02 5EFCF950... 73C4
  const hex = '50f70a3f73025efcf950156f017d784000008ca0f80084003c013026a1029e72bd73c4';
  const raw = Buffer.from(hex, 'hex');
  
  const packets = parser.feed(raw);
  const parsed = parser.parse(packets[0]);
  const loc = parser.decodeLocation(parsed.data);

  expect(loc.epoch).toBe(1593637200);
  expect(loc.direction).toBe(54.87);
  expect(loc.gpsFixed).toBe(true);
  expect(loc.isHistorical).toBe(true);
  expect(loc.ignitionOn).toBe(true);
  expect(loc.latitude).toBeCloseTo(-19.932833, 6);
  expect(loc.longitude).toBeCloseTo(-43.995131, 6);
});