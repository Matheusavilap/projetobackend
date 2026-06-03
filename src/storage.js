const redis = require('redis');

class StorageService {
  constructor() {
    this.memory = new Map();
    this.client = null;
  }

  async connect() {
    if (!process.env.REDIS_URL) {
      console.log('⚠️ Redis não configurado. Usando cache em memória.');
      return;
    }
    this.client = redis.createClient({ url: process.env.REDIS_URL });
    await this.client.connect();
    console.log('✅ Redis conectado.');
  }

  async saveLatest(deviceId, data) {
    const payload = JSON.stringify({ deviceId, ...data });
    if (this.client) {
      await this.client.set(`loc:${deviceId}`, payload, { EX: 86400 });
    }
    this.memory.set(deviceId, payload);
  }

  async getLatest(deviceId) {
    if (this.client) {
      const cached = await this.client.get(`loc:${deviceId}`);
      if (cached) return JSON.parse(cached);
    }
    const mem = this.memory.get(deviceId);
    return mem ? JSON.parse(mem) : null;
  }
}

module.exports = new StorageService();