'use strict';

/**
 * Tests para src/cache.js y src/middleware/cacheMiddleware.js.
 *
 * REDIS_URL no está seteado en el entorno de tests, por lo que
 * cache.js opera en modo no-op (client = null). Los tests verifican
 * que el middleware pasa al siguiente handler sin error y que cache.get/set
 * retornan null / undefined sin lanzar excepciones.
 */

const request = require('supertest');
const nock    = require('nock');
const cache   = require('../src/cache');
const app     = require('../src/app');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

const MOCK_GEODATA = {
  status: 'ok',
  data: {
    globalTotals: { cantidad: 10000, importe: 500000, beneficio: 100000 },
    provinces: [],
  },
};

afterEach(() => nock.cleanAll());

describe('cache module (sin Redis configurado)', () => {
  it('cache.get devuelve null cuando no hay cliente Redis', async () => {
    const result = await cache.get('any-key');
    expect(result).toBeNull();
  });

  it('cache.set no lanza error cuando no hay cliente Redis', async () => {
    await expect(cache.set('any-key', { foo: 'bar' }, 60)).resolves.toBeUndefined();
  });
});

describe('cacheMiddleware — sin Redis (modo pass-through)', () => {
  it('pasa la petición al controller cuando no hay caché', async () => {
    nock(CORE_URL).get('/geodata').reply(200, MOCK_GEODATA);
    const res = await request(app).get('/api/datos/geodata');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('sigue funcionando aunque el core esté caído (no swallows 502)', async () => {
    // replyWithError emite un error de socket que en Node.js 20 puede dispararse
    // antes de que node-fetch registre su listener. Usamos JSON inválido para
    // provocar el mismo 502 via el catch del controller, sin timing issues.
    nock(CORE_URL).get('/geodata').reply(200, 'invalid-json', { 'content-type': 'application/json' });
    const res = await request(app).get('/api/datos/geodata');
    expect(res.status).toBe(502);
  });

  it('proyectado llama al core sin filtros para obtener el dataset completo', async () => {
    // El controller llama al core SIN query params (all-data mode); los filtros
    // se aplican en memoria después. Nock sin .query() solo coincide sin params.
    nock(CORE_URL).get('/proyectado').reply(200, {
      status: 'ok',
      data: {
        todos: [{ provincia: 'Salta', juego: 'Quiniela', historico: [], proyectado: [] }],
        provincias: ['Salta'],
        juegos: ['Quiniela'],
      },
    });
    const res = await request(app).get('/api/datos/proyectado?provincia=Salta&juego=Quiniela&meses=2');
    expect(res.status).toBe(200);
  });

  it('el middleware no modifica el body de la respuesta', async () => {
    nock(CORE_URL).get('/geodata').reply(200, MOCK_GEODATA);
    const res = await request(app).get('/api/datos/geodata');
    expect(res.body).toEqual(MOCK_GEODATA);
  });
});
