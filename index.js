const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const TcpGateway = require('./src/gateway/TcpServer');
const locationRoutes = require('./src/api/routes');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/v1', locationRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'running' }));

const API_PORT = process.env.API_PORT || 3000;
const TCP_PORT = process.env.TCP_PORT || 9000;

// Inicia API REST
app.listen(API_PORT, () => console.log(`🌐 API REST em http://localhost:${API_PORT}`));

// Inicia Gateway TCP
new TcpGateway(TCP_PORT).start();