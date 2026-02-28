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

  it('data.geo debe tener 10 provincias', () => {
    expect(Array.isArray(body.data.geo)).toBe(true);
    expect(body.data.geo).toHaveLength(10);
  });

  it('data.detail debe tener 30 registros (10 provincias × 3 juegos)', () => {
    expect(Array.isArray(body.data.detail)).toBe(true);
    expect(body.data.detail).toHaveLength(30);
  });

  it('cada registro de data.geo tiene los campos requeridos con coordenadas', () => {
    for (const item of body.data.geo) {
      expect(item).toHaveProperty('provincia');
      expect(item).toHaveProperty('cantidad');
      expect(item).toHaveProperty('importe');
      expect(item).toHaveProperty('beneficio');
      expect(item.lat).not.toBeNull();
      expect(item.lng).not.toBeNull();
    }
  });

  it('cada registro de data.detail tiene los campos requeridos', () => {
    for (const item of body.data.detail) {
      expect(item).toHaveProperty('provincia');
      expect(item).toHaveProperty('juego');
      expect(item).toHaveProperty('cantidad');
      expect(item).toHaveProperty('importe');
      expect(item).toHaveProperty('beneficio');
    }
  });
});
