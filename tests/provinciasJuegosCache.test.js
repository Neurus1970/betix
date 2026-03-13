'use strict';

/**
 * Tests de invalidación de caché para el controller de provinciasJuegos.
 *
 * Se mockea src/cache con isEnabled: true para verificar que POST y DELETE
 * exitosos disparan cache.del con las claves correctas.
 */

jest.mock('../src/cache', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  isEnabled: true,
}));

const request = require('supertest');
const nock    = require('nock');
const cache   = require('../src/cache');
const app     = require('../src/app');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

const CACHE_KEYS = [
  'betix:proyectado:all',
  'betix:/api/datos/geodata:',
];

afterEach(() => {
  nock.cleanAll();
  jest.clearAllMocks();
});

describe('POST /api/provincias_juegos — invalidación de caché', () => {
  it('llama a cache.del con las claves correctas al crear una asignación (201)', async () => {
    const created = { provincia_id: 3, juego_id: 2, provincia_nombre: 'Salta', juego_nombre: 'Quiniela' };
    nock(CORE_URL)
      .post('/provincias_juegos')
      .reply(201, { status: 'ok', data: created });

    await request(app)
      .post('/api/provincias_juegos')
      .send({ provincia_id: 3, juego_id: 2 });

    expect(cache.del).toHaveBeenCalledWith(...CACHE_KEYS);
  });

  it('NO llama a cache.del si el core responde 409', async () => {
    nock(CORE_URL)
      .post('/provincias_juegos')
      .reply(409, { status: 'error', message: 'La asignación ya existe' });

    await request(app)
      .post('/api/provincias_juegos')
      .send({ provincia_id: 1, juego_id: 1 });

    expect(cache.del).not.toHaveBeenCalled();
  });

  it('NO llama a cache.del si el core responde 400', async () => {
    nock(CORE_URL)
      .post('/provincias_juegos')
      .reply(400, { status: 'error', message: 'provincia_id o juego_id no válidos' });

    await request(app)
      .post('/api/provincias_juegos')
      .send({ provincia_id: 9999, juego_id: 9999 });

    expect(cache.del).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/provincias_juegos — invalidación de caché', () => {
  it('llama a cache.del con las claves correctas al eliminar (204)', async () => {
    nock(CORE_URL).delete('/provincias_juegos/1/2').reply(204);

    await request(app).delete('/api/provincias_juegos/1/2');

    expect(cache.del).toHaveBeenCalledWith(...CACHE_KEYS);
  });

  it('NO llama a cache.del si la asignación no existe (404)', async () => {
    nock(CORE_URL)
      .delete('/provincias_juegos/9999/9999')
      .reply(404, { status: 'error', message: 'Asignación no encontrada' });

    await request(app).delete('/api/provincias_juegos/9999/9999');

    expect(cache.del).not.toHaveBeenCalled();
  });
});
