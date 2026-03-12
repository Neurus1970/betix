'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('GET /backoffice', () => {
  it('debe retornar la página HTML con status 200', async () => {
    const res = await request(app).get('/backoffice');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('debe incluir "Backoffice" en el título', async () => {
    const res = await request(app).get('/backoffice');
    expect(res.text).toMatch(/[Bb]ackoffice/);
  });

  it('debe incluir el tab "Visual"', async () => {
    const res = await request(app).get('/backoffice');
    expect(res.text).toContain('Visual');
  });

  it('debe incluir el tab "Lista"', async () => {
    const res = await request(app).get('/backoffice');
    expect(res.text).toContain('Lista');
  });

  it('debe incluir un link o referencia al dashboard', async () => {
    const res = await request(app).get('/backoffice');
    expect(res.text).toContain('dashboard');
  });

  it('debe referenciar el endpoint /api/provincias_juegos en el JS', async () => {
    const res = await request(app).get('/backoffice');
    expect(res.text).toContain('/api/provincias_juegos');
  });
});
