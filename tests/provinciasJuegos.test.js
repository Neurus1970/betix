'use strict';

const request = require('supertest');
const nock    = require('nock');
const app     = require('../src/app');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

const MOCK_DATA = [
  { provincia_id: 1, juego_id: 1, provincia_nombre: 'Buenos Aires', juego_nombre: 'Lotería' },
  { provincia_id: 1, juego_id: 2, provincia_nombre: 'Buenos Aires', juego_nombre: 'Quiniela' },
  { provincia_id: 2, juego_id: 1, provincia_nombre: 'Córdoba',      juego_nombre: 'Lotería' },
];

afterEach(() => nock.cleanAll());

describe('GET /api/provincias_juegos', () => {
  it('retorna 200 con la lista completa', async () => {
    nock(CORE_URL).get('/provincias_juegos').reply(200, { status: 'ok', data: MOCK_DATA });
    const res = await request(app).get('/api/provincias_juegos');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('cada item tiene los campos requeridos', async () => {
    nock(CORE_URL).get('/provincias_juegos').reply(200, { status: 'ok', data: MOCK_DATA });
    const res = await request(app).get('/api/provincias_juegos');
    for (const item of res.body.data) {
      expect(item).toHaveProperty('provincia_id');
      expect(item).toHaveProperty('juego_id');
      expect(item).toHaveProperty('provincia_nombre');
      expect(item).toHaveProperty('juego_nombre');
    }
  });

  it('reenvía el query param provincia_id al core', async () => {
    const filtered = MOCK_DATA.filter(d => d.provincia_id === 1);
    nock(CORE_URL)
      .get('/provincias_juegos')
      .query({ provincia_id: '1' })
      .reply(200, { status: 'ok', data: filtered });
    const res = await request(app).get('/api/provincias_juegos?provincia_id=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('reenvía el query param juego_id al core', async () => {
    const filtered = MOCK_DATA.filter(d => d.juego_id === 1);
    nock(CORE_URL)
      .get('/provincias_juegos')
      .query({ juego_id: '1' })
      .reply(200, { status: 'ok', data: filtered });
    const res = await request(app).get('/api/provincias_juegos?juego_id=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('retorna 502 si el core no está disponible', async () => {
    nock(CORE_URL).get('/provincias_juegos').replyWithError('ECONNREFUSED');
    const res = await request(app).get('/api/provincias_juegos');
    expect(res.status).toBe(502);
  });
});

describe('POST /api/provincias_juegos', () => {
  it('retorna 201 al crear una asignación válida', async () => {
    const created = { provincia_id: 3, juego_id: 2, provincia_nombre: 'Salta', juego_nombre: 'Quiniela' };
    nock(CORE_URL)
      .post('/provincias_juegos', { provincia_id: 3, juego_id: 2 })
      .reply(201, { status: 'ok', data: created });
    const res = await request(app)
      .post('/api/provincias_juegos')
      .send({ provincia_id: 3, juego_id: 2 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.provincia_id).toBe(3);
    expect(res.body.data.juego_id).toBe(2);
  });

  it('retorna 409 si la asignación ya existe', async () => {
    nock(CORE_URL)
      .post('/provincias_juegos')
      .reply(409, { status: 'error', message: 'La asignación ya existe' });
    const res = await request(app)
      .post('/api/provincias_juegos')
      .send({ provincia_id: 1, juego_id: 1 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('La asignación ya existe');
  });

  it('retorna 400 si los IDs son inválidos', async () => {
    nock(CORE_URL)
      .post('/provincias_juegos')
      .reply(400, { status: 'error', message: 'provincia_id o juego_id no válidos' });
    const res = await request(app)
      .post('/api/provincias_juegos')
      .send({ provincia_id: 9999, juego_id: 9999 });
    expect(res.status).toBe(400);
  });

  it('retorna 502 si el core no está disponible', async () => {
    nock(CORE_URL).post('/provincias_juegos').replyWithError('ECONNREFUSED');
    const res = await request(app)
      .post('/api/provincias_juegos')
      .send({ provincia_id: 1, juego_id: 1 });
    expect(res.status).toBe(502);
  });
});

describe('DELETE /api/provincias_juegos/:provincia_id/:juego_id', () => {
  it('retorna 204 al eliminar una asignación existente', async () => {
    nock(CORE_URL).delete('/provincias_juegos/1/2').reply(204);
    const res = await request(app).delete('/api/provincias_juegos/1/2');
    expect(res.status).toBe(204);
  });

  it('retorna 404 si la asignación no existe', async () => {
    nock(CORE_URL)
      .delete('/provincias_juegos/9999/9999')
      .reply(404, { status: 'error', message: 'Asignación no encontrada' });
    const res = await request(app).delete('/api/provincias_juegos/9999/9999');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Asignación no encontrada');
  });

  it('retorna 502 si el core no está disponible', async () => {
    nock(CORE_URL).delete('/provincias_juegos/1/2').replyWithError('ECONNREFUSED');
    const res = await request(app).delete('/api/provincias_juegos/1/2');
    expect(res.status).toBe(502);
  });
});
