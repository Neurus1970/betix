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
  totals: { cantidad: 1000, importe: 50000, beneficio: 10000 },
  games: [{ juego: 'Quiniela', cantidad: 500, importe: 25000, beneficio: 5000 }],
}));

const MOCK_GEODATA = {
  status: 'ok',
  data: {
    globalTotals: { cantidad: 10000, importe: 500000, beneficio: 100000 },
    provinces: MOCK_PROVINCES,
  },
};

afterEach(() => nock.cleanAll());

describe('GET /api/datos/geodata', () => {
  it('debe retornar status HTTP 200', async () => {
    nock(CORE_URL).get('/geodata').reply(200, MOCK_GEODATA);
    const res = await request(app).get('/api/datos/geodata');
    expect(res.status).toBe(200);
  });

  it('debe incluir status ok en la respuesta', async () => {
    nock(CORE_URL).get('/geodata').reply(200, MOCK_GEODATA);
    const res = await request(app).get('/api/datos/geodata');
    expect(res.body.status).toBe('ok');
  });

  it('data tiene globalTotals y provinces', async () => {
    nock(CORE_URL).get('/geodata').reply(200, MOCK_GEODATA);
    const res = await request(app).get('/api/datos/geodata');
    expect(res.body.data).toHaveProperty('globalTotals');
    expect(res.body.data).toHaveProperty('provinces');
  });

  it('globalTotals tiene cantidad, importe y beneficio', async () => {
    nock(CORE_URL).get('/geodata').reply(200, MOCK_GEODATA);
    const res = await request(app).get('/api/datos/geodata');
    expect(res.body.data.globalTotals).toHaveProperty('cantidad');
    expect(res.body.data.globalTotals).toHaveProperty('importe');
    expect(res.body.data.globalTotals).toHaveProperty('beneficio');
  });

  it('data.provinces debe tener 10 provincias', async () => {
    nock(CORE_URL).get('/geodata').reply(200, MOCK_GEODATA);
    const res = await request(app).get('/api/datos/geodata');
    expect(Array.isArray(res.body.data.provinces)).toBe(true);
    expect(res.body.data.provinces).toHaveLength(10);
  });

  it('cada provincia tiene lat, lng, totals y games con campos correctos', async () => {
    nock(CORE_URL).get('/geodata').reply(200, MOCK_GEODATA);
    const res = await request(app).get('/api/datos/geodata');
    for (const p of res.body.data.provinces) {
      expect(p).toHaveProperty('provincia');
      expect(p.lat).not.toBeNull();
      expect(p.lng).not.toBeNull();
      expect(p.totals).toHaveProperty('cantidad');
      expect(p.totals).toHaveProperty('importe');
      expect(p.totals).toHaveProperty('beneficio');
      expect(Array.isArray(p.games)).toBe(true);
      expect(p.games.length).toBeGreaterThan(0);
    }
  });
});
