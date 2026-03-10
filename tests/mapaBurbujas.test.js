'use strict';

const request = require('supertest');
const nock    = require('nock');
const app     = require('../src/app');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

const MOCK_PROVINCES = [
  'Catamarca', 'Corrientes', 'La Pampa', 'La Rioja', 'Neuquén',
  'Río Negro', 'Salta', 'Santa Cruz', 'Santiago del Estero', 'Tierra del Fuego',
].map(name => ({
  provincia: name,
  lat: -30.0,
  lng: -65.0,
  cantidad: 5000,
  ingresos: 120000,
  beneficio: 25000,
}));

const MOCK_RESPONSE = {
  status: 'ok',
  data: {
    provinces: MOCK_PROVINCES,
    juegos:    ['Lotería', 'Quiniela', 'Raspadita'],
    fechas:    ['2025-03', '2025-04', '2025-05'],
  },
};

afterEach(() => nock.cleanAll());

describe('GET /api/datos/mapa-burbujas', () => {
  it('debe retornar status HTTP 200', async () => {
    nock(CORE_URL).get('/mapa-burbujas').reply(200, MOCK_RESPONSE);
    const res = await request(app).get('/api/datos/mapa-burbujas');
    expect(res.status).toBe(200);
  });

  it('debe incluir status ok en la respuesta', async () => {
    nock(CORE_URL).get('/mapa-burbujas').reply(200, MOCK_RESPONSE);
    const res = await request(app).get('/api/datos/mapa-burbujas');
    expect(res.body.status).toBe('ok');
  });

  it('data tiene provinces, juegos y fechas', async () => {
    nock(CORE_URL).get('/mapa-burbujas').reply(200, MOCK_RESPONSE);
    const res = await request(app).get('/api/datos/mapa-burbujas');
    expect(res.body.data).toHaveProperty('provinces');
    expect(res.body.data).toHaveProperty('juegos');
    expect(res.body.data).toHaveProperty('fechas');
  });

  it('data.provinces tiene 10 provincias', async () => {
    nock(CORE_URL).get('/mapa-burbujas').reply(200, MOCK_RESPONSE);
    const res = await request(app).get('/api/datos/mapa-burbujas');
    expect(Array.isArray(res.body.data.provinces)).toBe(true);
    expect(res.body.data.provinces).toHaveLength(10);
  });

  it('cada provincia tiene lat, lng, cantidad, ingresos y beneficio', async () => {
    nock(CORE_URL).get('/mapa-burbujas').reply(200, MOCK_RESPONSE);
    const res = await request(app).get('/api/datos/mapa-burbujas');
    for (const p of res.body.data.provinces) {
      expect(p).toHaveProperty('provincia');
      expect(p.lat).not.toBeNull();
      expect(p.lng).not.toBeNull();
      expect(p).toHaveProperty('cantidad');
      expect(p).toHaveProperty('ingresos');
      expect(p).toHaveProperty('beneficio');
    }
  });

  it('reenvía el query param juego al core', async () => {
    nock(CORE_URL).get('/mapa-burbujas').query({ juego: 'Quiniela' }).reply(200, MOCK_RESPONSE);
    const res = await request(app).get('/api/datos/mapa-burbujas?juego=Quiniela');
    expect(res.status).toBe(200);
  });

  it('reenvía los params fecha_desde y fecha_hasta al core', async () => {
    nock(CORE_URL)
      .get('/mapa-burbujas')
      .query({ fecha_desde: '2025-06', fecha_hasta: '2025-12' })
      .reply(200, MOCK_RESPONSE);
    const res = await request(app).get('/api/datos/mapa-burbujas?fecha_desde=2025-06&fecha_hasta=2025-12');
    expect(res.status).toBe(200);
  });

  // El escenario de core caído (502) está cubierto en cache.test.js
  // junto con los tests del cacheMiddleware para evitar conflictos de
  // timing entre nock y la cadena de promesas del middleware.
});
