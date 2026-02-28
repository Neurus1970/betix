const request = require('supertest');
const app = require('../src/app');

describe('GET /api/datos/geodata', () => {
  let body;

  beforeAll(async () => {
    const res = await request(app).get('/api/datos/geodata');
    body = res.body;
  });

  it('debe retornar status HTTP 200', async () => {
    const res = await request(app).get('/api/datos/geodata');
    expect(res.status).toBe(200);
  });

  it('debe incluir status ok en la respuesta', () => {
    expect(body.status).toBe('ok');
  });

  it('data tiene globalTotals y provinces', () => {
    expect(body.data).toHaveProperty('globalTotals');
    expect(body.data).toHaveProperty('provinces');
  });

  it('globalTotals tiene cantidad, importe y beneficio', () => {
    expect(body.data.globalTotals).toHaveProperty('cantidad');
    expect(body.data.globalTotals).toHaveProperty('importe');
    expect(body.data.globalTotals).toHaveProperty('beneficio');
  });

  it('data.provinces debe tener 10 provincias', () => {
    expect(Array.isArray(body.data.provinces)).toBe(true);
    expect(body.data.provinces).toHaveLength(10);
  });

  it('cada provincia tiene lat, lng, totals y games con campos correctos', () => {
    for (const p of body.data.provinces) {
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
