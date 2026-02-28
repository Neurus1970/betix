const request = require('supertest');
const app = require('../src/app');
const { getMapaEstadisticas, PROVINCE_COORDS } = require('../src/services/mapaService');

describe('GET /api/mapa-estadisticas/datos', () => {
  it('debe retornar 410 Gone (endpoint deprecado)', async () => {
    const res = await request(app).get('/api/mapa-estadisticas/datos');
    expect(res.statusCode).toBe(410);
    expect(res.body.status).toBe('gone');
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
    const neuquen = datos.find(p => p.provincia === 'Neuquén');
    expect(neuquen).toBeDefined();
    // Neuquén tiene 3 registros en mockData: 5200 + 2300 + 6100 = 13600
    expect(neuquen.cantidad).toBe(13600);
  });

  it('el beneficio debe ser importe - costo', () => {
    const datos = getMapaEstadisticas();
    const laRioja = datos.find(p => p.provincia === 'La Rioja');
    // ingresos: 93000  + 130000 + 37000  = 260000
    // costos:   78000  + 52000  + 31000  = 161000
    expect(laRioja.importe).toBe(260000);
    expect(laRioja.beneficio).toBe(260000 - 161000);
  });

  it('solo debe incluir provincias que tienen coordenadas', () => {
    const datos = getMapaEstadisticas();
    datos.forEach(p => {
      expect(PROVINCE_COORDS[p.provincia]).toBeDefined();
    });
  });

  it('PROVINCE_COORDS debe tener las 10 provincias de Tecno Acción', () => {
    const provincias = [
      'Salta', 'Santiago del Estero', 'Neuquén', 'La Pampa',
      'Santa Cruz', 'La Rioja', 'Catamarca', 'Tierra del Fuego',
      'Corrientes', 'Río Negro',
    ];
    for (const prov of provincias) {
      expect(PROVINCE_COORDS[prov]).toBeDefined();
      expect(PROVINCE_COORDS[prov].lat).toBeDefined();
      expect(PROVINCE_COORDS[prov].lng).toBeDefined();
    }
  });
});
