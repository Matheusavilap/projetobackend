const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'dev-secret-key-123';
  
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized', message: 'API Key inválida ou ausente' });
  }
  next();
};

module.exports = { authenticate };