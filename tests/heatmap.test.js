const request = require('supertest');
const app = require('../src/app');

describe('GET /heatmap-apuestas', () => {
  it('debe retornar la página HTML con status 200', async () => {
    const res = await request(app).get('/heatmap-apuestas');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('debe incluir el selector de juego', async () => {
    const res = await request(app).get('/heatmap-apuestas');
    expect(res.text).toContain('id="juego"');
  });

  it('debe incluir el selector de métrica', async () => {
    const res = await request(app).get('/heatmap-apuestas');
    expect(res.text).toContain('id="metrica"');
  });

  it('debe incluir el elemento del heatmap', async () => {
    const res = await request(app).get('/heatmap-apuestas');
    expect(res.text).toContain('id="heatmap"');
  });
});
