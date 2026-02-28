const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('debe retornar status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('betix-api');
  });
});

describe('GET /api/estadisticas/provincia', () => {
  it('debe retornar estadísticas por provincia sin filtros', async () => {
    const res = await request(app).get('/api/estadisticas/provincia');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('cada provincia debe tener los campos requeridos', async () => {
    const res = await request(app).get('/api/estadisticas/provincia');
    const campos = ['provincia', 'totalTickets', 'totalIngresos', 'totalCosto', 'rentabilidad'];
    res.body.data.forEach(item => {
      campos.forEach(campo => expect(item).toHaveProperty(campo));
    });
  });

  it('la rentabilidad debe ser un número válido entre 0 y 100', async () => {
    const res = await request(app).get('/api/estadisticas/provincia');
    res.body.data.forEach(item => {
      expect(typeof item.rentabilidad).toBe('number');
      expect(item.rentabilidad).toBeGreaterThanOrEqual(0);
      expect(item.rentabilidad).toBeLessThanOrEqual(100);
    });
  });

  it('debe filtrar por tipo de juego', async () => {
    const res = await request(app).get('/api/estadisticas/provincia?juego=Quiniela');
    expect(res.statusCode).toBe(200);
    expect(res.body.filtros.juego).toBe('Quiniela');
    expect(res.body.data.length).toBeGreaterThan(0);
    // Los totales deben ser menores que sin filtro
    const resSinFiltro = await request(app).get('/api/estadisticas/provincia');
    const totalConFiltro = res.body.data.reduce((sum, p) => sum + p.totalTickets, 0);
    const totalSinFiltro = resSinFiltro.body.data.reduce((sum, p) => sum + p.totalTickets, 0);
    expect(totalConFiltro).toBeLessThan(totalSinFiltro);
  });

  it('debe filtrar por fechaDesde', async () => {
    const res = await request(app).get('/api/estadisticas/provincia?fechaDesde=2026-02-01');
    expect(res.statusCode).toBe(200);
    expect(res.body.filtros.fechaDesde).toBe('2026-02-01');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('debe filtrar por rango de fechas', async () => {
    const res = await request(app).get('/api/estadisticas/provincia?fechaDesde=2026-01-01&fechaHasta=2026-01-31');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Solo datos de enero: deben ser menores al total
    const resSinFiltro = await request(app).get('/api/estadisticas/provincia');
    const totalConFiltro = res.body.data.reduce((sum, p) => sum + p.totalTickets, 0);
    const totalSinFiltro = resSinFiltro.body.data.reduce((sum, p) => sum + p.totalTickets, 0);
    expect(totalConFiltro).toBeLessThan(totalSinFiltro);
  });

  it('debe filtrar combinando fecha y juego', async () => {
    const res = await request(app).get('/api/estadisticas/provincia?fechaDesde=2026-02-01&juego=Quiniela');
    expect(res.statusCode).toBe(200);
    expect(res.body.filtros.fechaDesde).toBe('2026-02-01');
    expect(res.body.filtros.juego).toBe('Quiniela');
  });

  it('debe retornar array vacío si no hay datos para el filtro aplicado', async () => {
    const res = await request(app).get('/api/estadisticas/provincia?juego=JuegoInexistente');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/estadisticas/juego', () => {
  it('debe retornar estadísticas por juego sin filtros', async () => {
    const res = await request(app).get('/api/estadisticas/juego');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('cada juego debe tener los campos requeridos', async () => {
    const res = await request(app).get('/api/estadisticas/juego');
    const campos = ['juego', 'totalTickets', 'totalIngresos', 'totalCosto', 'rentabilidad'];
    res.body.data.forEach(item => {
      campos.forEach(campo => expect(item).toHaveProperty(campo));
    });
  });

  it('debe incluir los juegos Quiniela, Lotería y Raspadita', async () => {
    const res = await request(app).get('/api/estadisticas/juego');
    const juegos = res.body.data.map(j => j.juego);
    expect(juegos).toContain('Quiniela');
    expect(juegos).toContain('Lotería');
    expect(juegos).toContain('Raspadita');
  });

  it('debe filtrar por rango de fechas', async () => {
    const resFeb = await request(app).get('/api/estadisticas/juego?fechaDesde=2026-02-01&fechaHasta=2026-02-28');
    const resEne = await request(app).get('/api/estadisticas/juego?fechaDesde=2026-01-01&fechaHasta=2026-01-31');
    expect(resFeb.statusCode).toBe(200);
    expect(resEne.statusCode).toBe(200);
    // Ambos meses deben tener datos
    expect(resFeb.body.data.length).toBeGreaterThan(0);
    expect(resEne.body.data.length).toBeGreaterThan(0);
  });
});

describe('GET /api/estadisticas/resumen', () => {
  it('debe retornar el resumen general sin filtros', async () => {
    const res = await request(app).get('/api/estadisticas/resumen');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('el resumen debe tener totalTickets, totalIngresos, totalCosto y rentabilidad', async () => {
    const res = await request(app).get('/api/estadisticas/resumen');
    const campos = ['totalTickets', 'totalIngresos', 'totalCosto', 'rentabilidad'];
    campos.forEach(campo => expect(res.body.data).toHaveProperty(campo));
  });

  it('totalIngresos debe ser mayor que totalCosto (negocio rentable)', async () => {
    const res = await request(app).get('/api/estadisticas/resumen');
    expect(res.body.data.totalIngresos).toBeGreaterThan(res.body.data.totalCosto);
  });

  it('el resumen filtrado por mes debe tener menos tickets que el total', async () => {
    const resTotal = await request(app).get('/api/estadisticas/resumen');
    const resFiltrado = await request(app).get('/api/estadisticas/resumen?fechaDesde=2026-01-01&fechaHasta=2026-01-31');
    expect(resFiltrado.body.data.totalTickets).toBeLessThan(resTotal.body.data.totalTickets);
  });

  it('el resumen filtrado por juego debe retornar datos consistentes', async () => {
    const res = await request(app).get('/api/estadisticas/resumen').query({ juego: 'Lotería' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalTickets).toBeGreaterThan(0);
    expect(res.body.filtros.juego).toBe('Lotería');
  });
});
