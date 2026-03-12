'use strict';

/**
 * Tests de estrategia MISS → HIT para el controller de proyectado.
 *
 * Se mockea src/cache con isEnabled: true para simular el comportamiento
 * descrito en BETIX-29:
 *   - Primera llamada: MISS  → llama al core, guarda en caché
 *   - Llamadas siguientes: HIT → filtra en memoria, no llama al core
 */

jest.mock('../src/cache', () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  isEnabled: true,
}));

const request = require('supertest');
const nock    = require('nock');
const cache   = require('../src/cache');
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
  }));
}

function makeProyectado(k = 6) {
  return Array.from({ length: k }, (_, i) => ({
    fecha:           `2026-${String(i + 3).padStart(2, '0')}`,
    cantidad:        1120,
    error_cantidad:  50 + i * 8,
    ingresos:        55500,
    error_ingresos:  2000,
    costo:           44400,
    error_costo:     1500,
    beneficio:       11100,
    error_beneficio: 500 + i * 75,
  }));
}

function buildAllData() {
  const todos = [];
  for (const prov of PROVINCIAS) {
    for (const juego of JUEGOS) {
      todos.push({ provincia: prov, juego, historico: makeHistorico(), proyectado: makeProyectado(6) });
    }
  }
  return { todos, provincias: PROVINCIAS, juegos: JUEGOS };
}

const ALL_DATA = buildAllData();

afterEach(() => {
  nock.cleanAll();
  jest.clearAllMocks();
});

// ── MISS → HIT ────────────────────────────────────────────────────────────────

describe('proyectadoController — estrategia MISS → HIT', () => {
  it('MISS: llama al core sin params y guarda todo en caché', async () => {
    cache.get.mockResolvedValueOnce(null); // MISS
    nock(CORE_URL).get('/proyectado').reply(200, { status: 'ok', data: ALL_DATA });

    const res = await request(app).get('/api/datos/proyectado');

    expect(res.status).toBe(200);
    expect(cache.set).toHaveBeenCalledWith(
      'betix:proyectado:all',
      ALL_DATA,
      expect.any(Number)
    );
  });

  it('HIT: no llama al core, filtra correctamente desde caché', async () => {
    cache.get.mockResolvedValueOnce(ALL_DATA); // HIT

    // No se configura nock → si el controller llamara al core, el test fallaría
    // con "Nock: No match for request".
    const res = await request(app).get('/api/datos/proyectado?provincia=Salta&juego=Quiniela');

    expect(res.status).toBe(200);
    expect(res.body.data.provincia).toBe('Salta');
    expect(res.body.data.juego).toBe('Quiniela');
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('HIT: aplica el filtro de meses correctamente', async () => {
    cache.get.mockResolvedValueOnce(ALL_DATA);

    const res = await request(app).get('/api/datos/proyectado?meses=3');

    expect(res.status).toBe(200);
    expect(res.body.data.proyectado).toHaveLength(3);
  });

  it('HIT: usa la primera provincia y juego disponibles si no se especifican', async () => {
    cache.get.mockResolvedValueOnce(ALL_DATA);

    const res = await request(app).get('/api/datos/proyectado');

    expect(res.status).toBe(200);
    expect(res.body.data.provincia).toBe(PROVINCIAS[0]);
    expect(res.body.data.juego).toBe(JUEGOS[0]);
  });

  it('HIT: retorna 400 si la combinación provincia/juego no existe en caché', async () => {
    cache.get.mockResolvedValueOnce(ALL_DATA);

    const res = await request(app).get('/api/datos/proyectado?provincia=Inexistente&juego=Quiniela');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
