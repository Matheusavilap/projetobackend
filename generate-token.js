// generate-token.js
require('dotenv').config(); // ← Carrega o .env automaticamente!
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_prod';

const token = jwt.sign({ id: 'user_123' }, SECRET, { expiresIn: '1h' });
console.log('✅ Token válido para este servidor:');
console.log(token);