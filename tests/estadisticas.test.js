const request = require('supertest');
const app = require('../src/app');

const { checkDataAccess } = require('../src/services/healthService');
const mockData = require('../src/data/mockData');

describe('GET /healthz', () => {
  it('debe retornar status healthy', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('debe retornar 500 si hay un campo faltante', () => {
    const original = { ...mockData.tickets[0] };
    delete mockData.tickets[0].provincia;
    expect(() => checkDataAccess()).toThrow('Datos corruptos: campo "provincia" faltante');
    Object.assign(mockData.tickets[0], original);
  });

  it('debe retornar 500 si un campo tiene tipo incorrecto', () => {
    const original = mockData.tickets[0].ingresos;
    mockData.tickets[0].ingresos = 'invalido';
    expect(() => checkDataAccess()).toThrow('Datos corruptos: campo "ingresos" inválido');
    mockData.tickets[0].ingresos = original;
  });
});

describe('GET /health', () => {
  it('debe redirigir a /healthz con 301', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(301);
    expect(res.headers.location).toBe('/healthz');
  });
});

describe('GET /api/estadisticas/provincia', () => {
  it('debe retornar estadísticas por provincia', async () => {
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
});

describe('GET /api/estadisticas/juego', () => {
  it('debe retornar estadísticas por juego', async () => {
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
});

describe('GET /api/estadisticas/resumen', () => {
  it('debe retornar el resumen general', async () => {
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
});
