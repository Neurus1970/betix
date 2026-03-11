'use strict';

/**
 * Tests para src/middleware/cacheMiddleware.js con Redis habilitado.
 *
 * Se mockea src/cache con isEnabled: true para cubrir los caminos
 * que el archivo cache.test.js no puede ejercitar (fast-path sin Redis).
 * Los tres caminos cubiertos aquí:
 *   1. Cache HIT  — get() devuelve datos → res.json(cached), next() no se llama
 *   2. Cache MISS — get() devuelve null  → res.json wrapeado, next() se llama
 *   3. Cache error — get() rechaza       → next() se llama (degradación elegante)
 */

jest.mock('../src/cache', () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  isEnabled: true,
}));

const cache = require('../src/cache');
const cacheMiddleware = require('../src/middleware/cacheMiddleware');

const mockReq = (path, query = {}) => ({ path, query });
const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cacheMiddleware — con Redis habilitado', () => {
  it('Cache HIT: responde desde Redis y no llama a next()', async () => {
    const cached = { status: 'ok', data: { provinces: [] } };
    cache.get.mockResolvedValue(cached);

    const req  = mockReq('/api/datos/geodata');
    const res  = mockRes();
    const next = jest.fn();

    cacheMiddleware(req, res, next);
    await new Promise(resolve => setImmediate(resolve));

    expect(res.json).toHaveBeenCalledWith(cached);
    expect(next).not.toHaveBeenCalled();
  });

  it('Cache MISS: llama a next() y wrappea res.json para guardar en caché', async () => {
    cache.get.mockResolvedValue(null);

    const req  = mockReq('/api/datos/geodata');
    const res  = mockRes();
    const next = jest.fn();

    cacheMiddleware(req, res, next);
    await new Promise(resolve => setImmediate(resolve));

    expect(next).toHaveBeenCalled();

    const responseData = { status: 'ok', data: {} };
    res.json(responseData);
    expect(cache.set).toHaveBeenCalledWith(
      expect.stringContaining('/api/datos/geodata'),
      responseData,
      expect.any(Number)
    );
  });

  it('Cache error: llama a next() si cache.get rechaza (degradación elegante)', async () => {
    cache.get.mockRejectedValue(new Error('Redis connection lost'));

    const req  = mockReq('/api/datos/geodata');
    const res  = mockRes();
    const next = jest.fn();

    cacheMiddleware(req, res, next);
    await new Promise(resolve => setImmediate(resolve));

    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('La clave de caché ordena los query params alfabéticamente', async () => {
    cache.get.mockResolvedValue(null);

    const req  = mockReq('/api/datos/proyectado', { meses: '3', provincia: 'Salta', juego: 'Quiniela' });
    const res  = mockRes();
    const next = jest.fn();

    cacheMiddleware(req, res, next);
    await new Promise(resolve => setImmediate(resolve));

    expect(cache.get).toHaveBeenCalledWith(
      'betix:/api/datos/proyectado:juego=Quiniela&meses=3&provincia=Salta'
    );
  });

  it('La clave de caché es correcta con query params vacíos', async () => {
    cache.get.mockResolvedValue(null);

    const req  = mockReq('/api/datos/geodata');
    const res  = mockRes();
    const next = jest.fn();

    cacheMiddleware(req, res, next);
    await new Promise(resolve => setImmediate(resolve));

    expect(cache.get).toHaveBeenCalledWith('betix:/api/datos/geodata:');
  });
});
