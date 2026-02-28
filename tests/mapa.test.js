const request = require('supertest');
const app = require('../src/app');
const { getMapaEstadisticas, PROVINCE_COORDS } = require('../src/services/mapaService');

describe('GET /api/mapa-estadisticas/datos', () => {
  it('debe retornar status success y array de provincias', async () => {
    const res = await request(app).get('/api/mapa-estadisticas/datos');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('cada provincia debe tener los campos requeridos', async () => {
    const res = await request(app).get('/api/mapa-estadisticas/datos');
    for (const p of res.body.data) {
      expect(p).toHaveProperty('provincia');
      expect(p).toHaveProperty('cantidad');
      expect(p).toHaveProperty('importe');
      expect(p).toHaveProperty('beneficio');
      expect(p).toHaveProperty('lat');
      expect(p).toHaveProperty('lng');
    }
  });

  it('los valores numéricos deben ser positivos', async () => {
    const res = await request(app).get('/api/mapa-estadisticas/datos');
    for (const p of res.body.data) {
      expect(p.cantidad).toBeGreaterThan(0);
      expect(p.importe).toBeGreaterThan(0);
    }
  });

  it('el beneficio debe ser importe menos costo', async () => {
    const res = await request(app).get('/api/mapa-estadisticas/datos');
    // beneficio = importe - costo, siempre <= importe
    for (const p of res.body.data) {
      expect(p.beneficio).toBeLessThanOrEqual(p.importe);
    }
  });

  it('las coordenadas deben ser válidas para Argentina', async () => {
    const res = await request(app).get('/api/mapa-estadisticas/datos');
    for (const p of res.body.data) {
      expect(p.lat).toBeGreaterThan(-60);
      expect(p.lat).toBeLessThan(-20);
      expect(p.lng).toBeGreaterThan(-75);
      expect(p.lng).toBeLessThan(-50);
    }
  });

  it('no debe incluir provincias sin coordenadas', async () => {
    const res = await request(app).get('/api/mapa-estadisticas/datos');
    for (const p of res.body.data) {
      expect(p.lat).not.toBeNull();
      expect(p.lng).not.toBeNull();
    }
  });
});

describe('GET /mapa-estadisticas', () => {
  it('debe retornar la página HTML', async () => {
    const res = await request(app).get('/mapa-estadisticas');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('la página debe incluir el elemento del mapa', async () => {
    const res = await request(app).get('/mapa-estadisticas');
    expect(res.text).toContain('id="mapa"');
  });

  it('la página debe incluir el dropdown de métricas', async () => {
    const res = await request(app).get('/mapa-estadisticas');
    expect(res.text).toContain('id="metrica"');
    expect(res.text).toContain('cantidad');
    expect(res.text).toContain('importe');
    expect(res.text).toContain('beneficio');
  });
});

describe('mapaService', () => {
  it('debe agregar correctamente los tickets por provincia', () => {
    const datos = getMapaEstadisticas();
    const bsAs = datos.find(p => p.provincia === 'Buenos Aires');
    expect(bsAs).toBeDefined();
    // Buenos Aires tiene 3 registros en mockData: 15200 + 8300 + 22100 = 45600
    expect(bsAs.cantidad).toBe(45600);
  });

  it('el beneficio debe ser importe - costo', () => {
    const datos = getMapaEstadisticas();
    const cordoba = datos.find(p => p.provincia === 'Córdoba');
    // ingresos: 294000 + 420000 + 115000 = 829000
    // costos:   200000 + 290000 + 95000  = 585000
    expect(cordoba.importe).toBe(829000);
    expect(cordoba.beneficio).toBe(829000 - 585000);
  });

  it('solo debe incluir provincias que tienen coordenadas', () => {
    const datos = getMapaEstadisticas();
    datos.forEach(p => {
      expect(PROVINCE_COORDS[p.provincia]).toBeDefined();
    });
  });

  it('PROVINCE_COORDS debe tener las 5 provincias del mock', () => {
    const provincias = ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán'];
    for (const prov of provincias) {
      expect(PROVINCE_COORDS[prov]).toBeDefined();
      expect(PROVINCE_COORDS[prov].lat).toBeDefined();
      expect(PROVINCE_COORDS[prov].lng).toBeDefined();
    }
  });
});
