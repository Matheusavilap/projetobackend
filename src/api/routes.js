const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateAndAuthorize, JWT_SECRET } = require('./middleware');
const LocationStore = require('../services/LocationStore');

// Endpoint de Login (mock para testes - em produção, validar contra banco)
router.post('/auth/login', (req, res) => {
  const { userId, allowedDevices } = req.body;

  if (!userId || !allowedDevices || !Array.isArray(allowedDevices)) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: userId (string), allowedDevices (array)' 
    });
  }

  // Normaliza devices para minúsculo
  const normalizedDevices = allowedDevices.map(d => d.toLowerCase());

  // Gera JWT com payload contendo os dispositivos permitidos
  const payload = {
    userId,
    allowedDevices: normalizedDevices,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expira em 1 hora
  };

  const token = jwt.sign(payload, JWT_SECRET);

  res.json({
    status: 'ok',
    token,
    expiresIn: '1h',
    allowedDevices: normalizedDevices
  });
});

// Endpoint protegido: só retorna localização se o usuário tem permissão
router.get('/location/:device_id', authenticateAndAuthorize, (req, res) => {
  const deviceId = req.params.device_id.toLowerCase();
  const loc = LocationStore.get(deviceId);
  
  if (!loc) {
    return res.status(404).json({ 
      status: 'error', 
      message: 'Dispositivo não encontrado ou sem dados' 
    });
  }
  
  res.json({ status: 'ok', data: loc });
});

module.exports = router;