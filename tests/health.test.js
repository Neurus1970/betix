'use strict';

const request = require('supertest');
const nock    = require('nock');
const cache   = require('../src/cache');
const app     = require('../src/app');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

beforeEach(() => {
  jest.spyOn(cache, 'ping').mockResolvedValue({ status: 'healthy' });
});

afterEach(() => {
  jest.restoreAllMocks();
  nock.cleanAll();
});

describe('GET /healthz', () => {
  it('200 con dependencies cuando core y redis están healthy', async () => {
    nock(CORE_URL).get('/healthz').reply(200, {
      status: 'healthy',
      component: 'betix-core',
      timestamp: '2026-03-12T00:00:00.000000Z',
      dependencies: { postgresql: { status: 'healthy' } },
    });
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.component).toBe('betix-api');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.dependencies['betix-core'].status).toBe('healthy');
    expect(res.body.dependencies['redis']).toBeDefined();
  });

  it('503 si el core reporta unhealthy — propaga dependencies de core', async () => {
    nock(CORE_URL).get('/healthz').reply(503, {
      status: 'unhealthy',
      component: 'betix-core',
      timestamp: '2026-03-12T00:00:00.000000Z',
      dependencies: {
        postgresql: { status: 'unhealthy', error: 'DB connection failed: connection refused', pgcode: '08006' },
      },
    });
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.component).toBe('betix-api');
    expect(res.body.timestamp).toBeDefined();
    const coreDep = res.body.dependencies['betix-core'];
    expect(coreDep.status).toBe('unhealthy');
    expect(coreDep.httpStatus).toBe(503);
    expect(coreDep.dependencies.postgresql.pgcode).toBe('08006');
  });

  it('503 con error en betix-core si el core no está disponible (ECONNREFUSED)', async () => {
    nock(CORE_URL).get('/healthz').replyWithError('ECONNREFUSED');
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.component).toBe('betix-api');
    expect(res.body.timestamp).toBeDefined();
    const coreDep = res.body.dependencies['betix-core'];
    expect(coreDep.status).toBe('unhealthy');
    expect(coreDep.error).toMatch(/Connection failed:/);
  });
});
