// gere-token.js (execute com node gere-token.js)
const jwt = require('jsonwebtoken');
const payload = {
  userId: 'usr_123',
  allowedDevices: ['0a3f73', '1b2c3d']
};
const token = jwt.sign(payload, 'fallback-secret-do-dev', { expiresIn: '1h' });
console.log('TOKEN:', token);