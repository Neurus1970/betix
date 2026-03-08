'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/datos/temporal', () => {
  it('debe retornar status HTTP 200', async () => {
    const res = await request(app).get('/api/datos/temporal');
    expect(res.statusCode).toBe(200);
  });

  it('debe retornar status ok en la respuesta', async () => {
    const res = await request(app).get('/api/datos/temporal');
    expect(res.body.status).toBe('ok');
  });

  it('data contiene meses y series', async () => {
    const res = await request(app).get('/api/datos/temporal');
    expect(res.body.data).toHaveProperty('meses');
    expect(res.body.data).toHaveProperty('series');
  });

  it('meses tiene exactamente 10 entradas (Jun 2025 - Mar 2026)', async () => {
    const res = await request(app).get('/api/datos/temporal');
    expect(res.body.data.meses).toHaveLength(10);
    expect(res.body.data.meses[0]).toBe('2025-06');
    expect(res.body.data.meses[9]).toBe('2026-03');
  });

  it('series tiene exactamente 10 provincias', async () => {
    const res = await request(app).get('/api/datos/temporal');
    expect(res.body.data.series).toHaveLength(10);
  });

  it('cada serie tiene las métricas cantidad, ingresos, costo y beneficio', async () => {
    const res  = await request(app).get('/api/datos/temporal');
    const serie = res.body.data.series[0];
    expect(serie).toHaveProperty('provincia');
    expect(serie).toHaveProperty('cantidad');
    expect(serie).toHaveProperty('ingresos');
    expect(serie).toHaveProperty('costo');
    expect(serie).toHaveProperty('beneficio');
  });

  it('cada métrica tiene 10 valores mensuales', async () => {
    const res   = await request(app).get('/api/datos/temporal');
    const serie = res.body.data.series[0];
    expect(serie.cantidad).toHaveLength(10);
    expect(serie.ingresos).toHaveLength(10);
    expect(serie.costo).toHaveLength(10);
    expect(serie.beneficio).toHaveLength(10);
  });

  it('beneficio = ingresos - costo para cada mes', async () => {
    const res   = await request(app).get('/api/datos/temporal');
    const serie = res.body.data.series[0];
    for (let i = 0; i < 10; i++) {
      expect(serie.beneficio[i]).toBe(serie.ingresos[i] - serie.costo[i]);
    }
  });

  it('acepta filtro por juego=Quiniela y retorna solo datos de Quiniela', async () => {
    const resTodos    = await request(app).get('/api/datos/temporal');
    const resQuiniela = await request(app).get('/api/datos/temporal?juego=Quiniela');
    expect(resQuiniela.statusCode).toBe(200);
    expect(resQuiniela.body.data.series).toHaveLength(10);
    // Quiniela values are a subset of Todos → should be smaller
    const totalIngTodos    = resTodos.body.data.series[0].ingresos[0];
    const totalIngQuiniela = resQuiniela.body.data.series[0].ingresos[0];
    expect(totalIngQuiniela).toBeLessThan(totalIngTodos);
  });

  it('filtrando por juego=Todos retorna los mismos datos que sin filtro', async () => {
    const res1 = await request(app).get('/api/datos/temporal');
    const res2 = await request(app).get('/api/datos/temporal?juego=Todos');
    expect(res2.body.data.meses).toEqual(res1.body.data.meses);
    expect(res2.body.data.series.length).toBe(res1.body.data.series.length);
  });
});
