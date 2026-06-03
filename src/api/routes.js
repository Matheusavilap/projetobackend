const express = require('express');
const router = express.Router();
const { authenticate } = require('./middleware');
const LocationStore = require('../services/LocationStore');

router.get('/location/:device_id', authenticate, (req, res) => {
  const loc = LocationStore.get(req.params.device_id);
  if (!loc) return res.status(404).json({ status: 'error', message: 'Dispositivo não encontrado ou sem dados' });
  
  res.json({ status: 'ok', data: loc });
});

module.exports = router;