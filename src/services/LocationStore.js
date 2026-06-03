// Em produção, substituir por Redis ou PostgreSQL
const store = new Map();

module.exports = {
  upsert(deviceId, data) { store.set(deviceId.toLowerCase(), data); },
  get(deviceId) { return store.get(deviceId.toLowerCase()) || null; },
  clear() { store.clear(); }
};