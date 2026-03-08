const request = require('supertest');
const app = require('../src/app');

describe('GET /dashboard-interactivo', () => {
  it('debe retornar la página HTML con status 200', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('debe incluir el selector de juego', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('id="sel-juego"');
  });

  it('debe incluir el selector de métrica', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('id="sel-metrica"');
  });

  it('debe incluir el SVG del mapa', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('id="map-svg"');
  });

  it('debe incluir el SVG del gráfico de torta', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('id="pie-svg"');
  });

  it('debe incluir la librería D3.js', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('d3js.org');
  });

  it('debe consumir el endpoint /api/datos/geodata', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('/api/datos/geodata');
  });

  it('debe consumir el endpoint /api/datos/temporal', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('/api/datos/temporal');
  });

  it('debe incluir el tab de Tendencia temporal', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('tab-line');
  });

  it('debe incluir el SVG del gráfico de líneas', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('id="line-svg"');
  });

  it('debe incluir la leyenda del gráfico de líneas', async () => {
    const res = await request(app).get('/dashboard-interactivo');
    expect(res.text).toContain('id="line-legend"');
  });
});
