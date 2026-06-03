const express = require('express');
const { authenticate, authorizeDevice } = require('./middleware');
const storage = require('./storage');

const router = express.Router();

router.get('/api/v1/location/:device_id', authenticate, authorizeDevice, async (req, res) => {
  try {
    const device = req.params.device_id.toUpperCase();
    const location = await storage.getLatest(device);
    if (!location) return res.status(404).json({ error: 'Localização não encontrada' });
    res.json({ status: 'ok', data: location });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao buscar localização' });
  }
});

module.exports = router;