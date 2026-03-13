'use strict';

/**
 * cacheErrors.test.js
 *
 * Covers the error branches in src/cache.js when Redis IS configured
 * (REDIS_URL is set) but individual operations fail at runtime.
 *
 * The module is loaded fresh for each test via jest.isolateModules so that
 * the top-level `if (REDIS_URL)` branch executes with a mocked ioredis
 * client injected through the mocked config.
 *
 * Does NOT touch tests/cache.test.js, which covers the no-Redis (client=null)
 * path.
 */

describe('cache module con Redis configurado', () => {
  let cache;
  let mockRedisInstance;

  beforeEach(() => {
    mockRedisInstance = {
      on: jest.fn().mockReturnThis(),
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      ping: jest.fn(),
      status: 'ready',
    };

    jest.isolateModules(() => {
      jest.mock('ioredis', () => jest.fn(() => mockRedisInstance));
      jest.mock('../src/config', () => ({
        REDIS_URL: 'redis://localhost:6379',
        CACHE_TTL: 60,
        CORE_URL: 'http://localhost:5000',
        profile: 'dev',
      }));
      cache = require('../src/cache');
    });
  });

  afterEach(() => {
    jest.resetModules();
  });

  // 1. isEnabled reflects that REDIS_URL is set
  it('isEnabled es true cuando REDIS_URL está configurado', () => {
    expect(cache.isEnabled).toBe(true);
  });

  // 2. get — catch branch: client.get throws
  it('get devuelve null cuando client.get lanza un error', async () => {
    mockRedisInstance.get.mockRejectedValue(new Error('ECONNRESET'));
    const result = await cache.get('test-key');
    expect(result).toBeNull();
  });

  // 3. get — cache miss: client.get resolves to null (no JSON.parse, no error)
  it('get devuelve null cuando client.get resuelve a null (cache miss)', async () => {
    mockRedisInstance.get.mockResolvedValue(null);
    const result = await cache.get('missing-key');
    expect(result).toBeNull();
  });

  // 4. set — catch branch: client.set throws
  it('set resuelve undefined cuando client.set lanza un error', async () => {
    mockRedisInstance.set.mockRejectedValue(new Error('READONLY'));
    await expect(cache.set('test-key', { a: 1 }, 60)).resolves.toBeUndefined();
  });

  // 5. del — catch branch: client.del throws
  it('del resuelve sin lanzar cuando client.del lanza un error', async () => {
    mockRedisInstance.del.mockRejectedValue(new Error('LOADING'));
    await expect(cache.del('key1', 'key2')).resolves.toBeUndefined();
  });

  // 6. ping — healthy: status === 'ready' and ping resolves
  it('ping devuelve { status: "healthy" } cuando el cliente está listo y ping responde', async () => {
    mockRedisInstance.status = 'ready';
    mockRedisInstance.ping.mockResolvedValue('PONG');
    const result = await cache.ping();
    expect(result).toEqual({ status: 'healthy' });
  });

  // 7. ping — unhealthy: status !== 'ready' (skip the ping call entirely)
  it('ping devuelve { status: "unhealthy" } cuando el cliente no está listo', async () => {
    mockRedisInstance.status = 'connecting';
    const result = await cache.ping();
    expect(result.status).toBe('unhealthy');
    expect(result.error).toMatch(/connecting/);
  });

  // 8. ping — unhealthy: status === 'ready' but ping throws
  it('ping devuelve { status: "unhealthy", error } cuando ping lanza un error', async () => {
    mockRedisInstance.status = 'ready';
    mockRedisInstance.ping.mockRejectedValue(new Error('Connection timed out'));
    const result = await cache.ping();
    expect(result.status).toBe('unhealthy');
    expect(result.error).toBe('Connection timed out');
  });
});
