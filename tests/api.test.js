const request = require('supertest');
const express = require('express');
const routes = require('../src/api/routes');
const LocationStore = require('../src/services/LocationStore');

const app = express();
app.use(express.json());
app.use('/api/v1', routes);

beforeEach(() => LocationStore.clear());

test('GET /api/v1/location/:id retorna 401 sem API Key', async () => {
  const res = await request(app).get('/api/v1/location/test');
  expect(res.statusCode).toBe(401);
});

test('GET /api/v1/location/:id retorna 404 se dispositivo não existir', async () => {
  const res = await request(app)
    .get('/api/v1/location/0A3F73')
    .set('x-api-key', 'dev-secret-key-123');
  expect(res.statusCode).toBe(404);
});