const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-dev';

// Middleware de autenticação + autorização por dispositivo
const authenticateAndAuthorize = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Token não fornecido',
      message: 'Formato esperado: Authorization: Bearer <token>' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica assinatura e decodifica o payload
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, allowedDevices: [...], ... }

    // Normaliza device_id para minúsculo
    const requestedDevice = req.params.device_id?.toLowerCase();

    // Validação de escopo: o usuário tem permissão para este veículo?
    if (!decoded.allowedDevices || !decoded.allowedDevices.includes(requestedDevice)) {
      return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Você não tem permissão para consultar este dispositivo' 
      });
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(401).json({ error: 'Erro na autenticação' });
  }
};

module.exports = { authenticateAndAuthorize, JWT_SECRET };