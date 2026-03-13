'use strict';

/**
 * tests/app.test.js
 *
 * Covers three branches in src/app.js that are not exercised by any other test:
 *   1. Global error handler (lines 31-34) — responds 502 when next(err) is called.
 *   2. Unknown routes return 404 — Express default behaviour is not masked.
 *   3. CORS headers are present in responses — cors() middleware is wired up.
 */

const request = require('supertest');
const nock    = require('nock');
const app     = require('../src/app');

afterEach(() => {
  nock.cleanAll();
});

describe('src/app.js — uncovered branches', () => {
  it('el error handler global responde 502 cuando next(err) es llamado', async () => {
    // Adding a route after app is built places it after the error handler in the
    // middleware stack, so Express's own default handler (500) would fire instead.
    // We insert the new layer right before the error handler layer so that
    // next(err) propagates to app.js's error handler (502) as intended.
    app.get('/test-error-handler', (_req, _res, next) => next(new Error('boom')));

    const stack = app._router.stack;
    // The layer we just pushed is at the end; move it to just before the error handler.
    // The error handler is the last layer that has arity 4 (err, req, res, next).
    const errorHandlerIdx = stack.reduceRight((found, layer, idx) => {
      if (found !== -1) return found;
      return layer.handle && layer.handle.length === 4 ? idx : -1;
    }, -1);

    if (errorHandlerIdx !== -1) {
      const newLayer = stack.pop();
      stack.splice(errorHandlerIdx, 0, newLayer);
    }

    const res = await request(app).get('/test-error-handler');
    expect(res.status).toBe(502);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Core service unavailable');
  });

  it('devuelve 404 en rutas no registradas', async () => {
    const res = await request(app).get('/ruta/que/no/existe');
    expect(res.status).toBe(404);
  });

  it('incluye cabecera CORS en las respuestas', async () => {
    const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';
    nock(CORE_URL).get('/healthz').reply(200, {
      status: 'healthy',
      component: 'betix-core',
      timestamp: '2026-03-12T00:00:00.000000Z',
      dependencies: {},
    });
    const res = await request(app).get('/healthz');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
