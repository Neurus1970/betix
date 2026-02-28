const request = require('supertest');
const app = require('../src/app');
const { getDashboardData } = require('../src/services/dashboardService');

describe('GET /api/dashboard/datos', () => {
  it('debe retornar 410 Gone (endpoint deprecado)', async () => {
    const res = await request(app).get('/api/dashboard/datos');
    expect(res.statusCode).toBe(410);
    expect(res.body.status).toBe('gone');
  });
});

describe('GET /dashboard-rendimiento', () => {
  it('debe retornar la página HTML con status 200', async () => {
    const res = await request(app).get('/dashboard-rendimiento');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('debe incluir el selector de juego', async () => {
    const res = await request(app).get('/dashboard-rendimiento');
    expect(res.text).toContain('id="juego"');
  });

  it('debe incluir el selector de métrica', async () => {
    const res = await request(app).get('/dashboard-rendimiento');
    expect(res.text).toContain('id="metrica"');
  });

  it('debe incluir el selector de provincias', async () => {
    const res = await request(app).get('/dashboard-rendimiento');
    expect(res.text).toContain('id="provincias"');
  });
});

describe('dashboardService', () => {
  it('debe mapear cada ticket a los campos correctos', () => {
    const data = getDashboardData();
    expect(data.length).toBe(30);
    for (const item of data) {
      expect(item).toHaveProperty('provincia');
      expect(item).toHaveProperty('juego');
      expect(item).toHaveProperty('cantidad');
      expect(item).toHaveProperty('importe');
      expect(item).toHaveProperty('beneficio');
    }
  });

  it('beneficio debe ser importe - costo del ticket original', () => {
    const data = getDashboardData();
    const salta_quiniela = data.find(d => d.provincia === 'Salta' && d.juego === 'Quiniela');
    expect(salta_quiniela).toBeDefined();
    // Salta/Quiniela: ingresos=144000, costo=105000 → beneficio=39000
    expect(salta_quiniela.importe).toBe(144000);
    expect(salta_quiniela.beneficio).toBe(39000);
  });
});
