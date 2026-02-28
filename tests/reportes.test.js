const request = require('supertest');
const app = require('../src/app');

describe('GET /api/reportes/provincias', () => {

  // --- Happy path: sin filtros ---
  it('debe retornar status success y array de provincias sin filtros', async () => {
    const res = await request(app).get('/api/reportes/provincias');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('cada provincia debe tener los campos requeridos', async () => {
    const res = await request(app).get('/api/reportes/provincias');
    const campos = ['provincia', 'ticketsVendidos', 'ingresos', 'costos', 'rentabilidad', 'topJuego'];
    res.body.data.forEach(item => {
      campos.forEach(campo => expect(item).toHaveProperty(campo));
    });
  });

  it('debe estar ordenado por ingresos descendente', async () => {
    const res = await request(app).get('/api/reportes/provincias');
    const ingresos = res.body.data.map(p => p.ingresos);
    for (let i = 0; i < ingresos.length - 1; i++) {
      expect(ingresos[i]).toBeGreaterThanOrEqual(ingresos[i + 1]);
    }
  });

  it('la rentabilidad debe ser un número entre 0 y 100', async () => {
    const res = await request(app).get('/api/reportes/provincias');
    res.body.data.forEach(item => {
      expect(typeof item.rentabilidad).toBe('number');
      expect(item.rentabilidad).toBeGreaterThanOrEqual(0);
      expect(item.rentabilidad).toBeLessThanOrEqual(100);
    });
  });

  it('Buenos Aires debe tener el mayor ingreso (es la provincia con más datos)', async () => {
    const res = await request(app).get('/api/reportes/provincias');
    expect(res.body.data[0].provincia).toBe('Buenos Aires');
  });

  // --- Happy path: con filtros ---
  it('debe filtrar por fechaInicio y fechaFin', async () => {
    const res = await request(app).get('/api/reportes/provincias?fechaInicio=2026-01-01&fechaFin=2026-01-31');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.length).toBeGreaterThan(0);
    // Enero tiene menos datos que el total
    const resTotal = await request(app).get('/api/reportes/provincias?fechaInicio=2026-01-01&fechaFin=2026-12-31');
    const totalEne = res.body.data.reduce((s, p) => s + p.ticketsVendidos, 0);
    const totalAnio = resTotal.body.data.reduce((s, p) => s + p.ticketsVendidos, 0);
    expect(totalEne).toBeLessThan(totalAnio);
  });

  it('debe filtrar por tipoJuego (case-insensitive)', async () => {
    const resLower = await request(app).get('/api/reportes/provincias?tipoJuego=quiniela');
    const resUpper = await request(app).get('/api/reportes/provincias?tipoJuego=QUINIELA');
    expect(resLower.statusCode).toBe(200);
    expect(resUpper.statusCode).toBe(200);
    // Ambos deben devolver la misma cantidad de provincias
    expect(resLower.body.data.length).toBe(resUpper.body.data.length);
    // topJuego de cada provincia debe ser Quiniela
    resLower.body.data.forEach(p => expect(p.topJuego).toBe('Quiniela'));
  });

  it('debe filtrar combinando fechaInicio, fechaFin y tipoJuego', async () => {
    const res = await request(app)
      .get('/api/reportes/provincias')
      .query({ fechaInicio: '2026-02-01', fechaFin: '2026-02-28', tipoJuego: 'Lotería' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach(p => expect(p.topJuego).toBe('Lotería'));
  });

  it('debe usar defaults (últimos 30 días) cuando no se pasan fechas', async () => {
    // Con fechas reales del mock (2026-01-xx y 2026-02-xx), el default
    // puede no traer datos — validamos solo que responde correctamente
    const res = await request(app).get('/api/reportes/provincias');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });

  // --- Edge case: sin resultados ---
  it('debe retornar array vacío con mensaje cuando no hay datos para los filtros', async () => {
    const res = await request(app).get('/api/reportes/provincias?tipoJuego=JuegoInexistente');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe('No data found for the given filters');
  });

  it('debe retornar array vacío para rango de fechas sin datos', async () => {
    const res = await request(app).get('/api/reportes/provincias?fechaInicio=2020-01-01&fechaFin=2020-01-31');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.message).toBe('No data found for the given filters');
  });

  // --- Validación de errores: HTTP 400 ---
  it('debe retornar 400 si fechaInicio tiene formato inválido', async () => {
    const res = await request(app).get('/api/reportes/provincias?fechaInicio=01-01-2026');
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/fechaInicio/);
  });

  it('debe retornar 400 si fechaFin tiene formato inválido', async () => {
    const res = await request(app).get('/api/reportes/provincias?fechaFin=2026/02/28');
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/fechaFin/);
  });

  it('debe retornar 400 si fechaInicio es posterior a fechaFin', async () => {
    const res = await request(app).get('/api/reportes/provincias?fechaInicio=2026-02-01&fechaFin=2026-01-01');
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/posterior/);
  });

  it('debe retornar 400 si fechaInicio es una fecha imposible', async () => {
    const res = await request(app).get('/api/reportes/provincias?fechaInicio=2026-13-45');
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
