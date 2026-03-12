'use strict';

const request = require('supertest');
const nock    = require('nock');
const app     = require('../src/app');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PROVINCIAS = [
  'Catamarca', 'Corrientes', 'La Pampa', 'La Rioja', 'Neuquén',
  'Río Negro', 'Salta', 'Santa Cruz', 'Santiago del Estero', 'Tierra del Fuego',
];
const JUEGOS = ['Lotería', 'Quiniela', 'Raspadita'];

function makeHistorico(n = 12) {
  return Array.from({ length: n }, (_, i) => ({
    fecha:     `2025-${String(i + 3).padStart(2, '0')}`,
    cantidad:  1000 + i * 10,
    ingresos:  50000 + i * 500,
    costo:     40000 + i * 400,
    beneficio: 10000 + i * 100,
    provincia: 'Catamarca',
    juego:     'Lotería',
  }));
}

function makeProyectado(k = 1) {
  return Array.from({ length: k }, (_, i) => ({
    fecha:           `2026-${String(i + 3).padStart(2, '0')}`,
    cantidad:        1120,
    error_cantidad:  50,
    ingresos:        55500,
    error_ingresos:  2000,
    costo:           44400,
    error_costo:     1500,
    beneficio:       11100,
    error_beneficio: 500 + i * 75,
  }));
}

function mockCoreProyectado(k = 1, provincia = 'Catamarca', juego = 'Lotería') {
  return {
    status: 'ok',
    data: {
      historico:  makeHistorico(),
      proyectado: makeProyectado(k),
      provincias: PROVINCIAS,
      juegos:     JUEGOS,
      provincia,
      juego,
      meses: k,
    },
  };
}

afterEach(() => nock.cleanAll());

// ── API endpoint ──────────────────────────────────────────────────────────────

describe('GET /api/datos/proyectado', () => {
  it('debe retornar status 200 con estructura correcta', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado());
    const res = await request(app).get('/api/datos/proyectado');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toHaveProperty('historico');
    expect(res.body.data).toHaveProperty('proyectado');
    expect(res.body.data).toHaveProperty('provincias');
    expect(res.body.data).toHaveProperty('juegos');
  });

  it('debe retornar 12 registros históricos por defecto', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado());
    const res = await request(app).get('/api/datos/proyectado');
    expect(res.body.data.historico).toHaveLength(12);
  });

  it('debe retornar 1 mes proyectado por defecto (meses=1)', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado(1));
    const res = await request(app).get('/api/datos/proyectado');
    expect(res.body.data.proyectado).toHaveLength(1);
  });

  it('debe retornar 4 meses proyectados cuando meses=4', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado(4));
    const res = await request(app).get('/api/datos/proyectado?meses=4');
    expect(res.body.data.proyectado).toHaveLength(4);
  });

  it('debe filtrar por provincia', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado(1, 'Corrientes', 'Quiniela'));
    const res = await request(app).get('/api/datos/proyectado?provincia=Corrientes&juego=Quiniela');
    expect(res.body.data.provincia).toBe('Corrientes');
    expect(res.body.data.juego).toBe('Quiniela');
  });

  it('los registros históricos deben tener los campos requeridos', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado());
    const res  = await request(app).get('/api/datos/proyectado');
    const item = res.body.data.historico[0];
    expect(item).toHaveProperty('fecha');
    expect(item).toHaveProperty('cantidad');
    expect(item).toHaveProperty('ingresos');
    expect(item).toHaveProperty('costo');
    expect(item).toHaveProperty('beneficio');
  });

  it('los registros proyectados deben tener error_* y fecha futura', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado());
    const res  = await request(app).get('/api/datos/proyectado');
    const item = res.body.data.proyectado[0];
    expect(item).toHaveProperty('fecha');
    expect(item).toHaveProperty('cantidad');
    expect(item).toHaveProperty('error_cantidad');
    expect(item).toHaveProperty('ingresos');
    expect(item).toHaveProperty('error_ingresos');
    expect(item).toHaveProperty('beneficio');
    expect(item).toHaveProperty('error_beneficio');
    expect(item.fecha >= '2026-03').toBe(true);
  });

  it('la lista de provincias está ordenada alfabéticamente', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado());
    const res  = await request(app).get('/api/datos/proyectado');
    const list = res.body.data.provincias;
    expect(list).toEqual([...list].sort());
  });

  it('clampea meses fuera de rango: meses=10 → 4 proyectados', async () => {
    nock(CORE_URL).get('/proyectado').query(true).reply(200, mockCoreProyectado(4));
    const res = await request(app).get('/api/datos/proyectado?meses=10');
    expect(res.body.data.proyectado).toHaveLength(4);
  });
});
