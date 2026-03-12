'use strict';

const request = require('supertest');
const nock    = require('nock');
const app     = require('../src/app');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

afterEach(() => nock.cleanAll());

describe('GET /healthz', () => {
  it('debe retornar status healthy cuando el core responde ok', async () => {
    nock(CORE_URL).get('/healthz').reply(200, { status: 'healthy' });
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('debe retornar 500 si el core reporta unhealthy', async () => {
    nock(CORE_URL).get('/healthz').reply(500, { status: 'unhealthy', message: 'Datos corruptos' });
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(500);
  });

  it('debe retornar 500 si el core no está disponible', async () => {
    nock(CORE_URL).get('/healthz').reply(503, { status: 'unavailable' });
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(503);
  });
});
