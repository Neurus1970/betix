'use strict';

// Desactivar Redis en tests — evita conexiones reales a localhost:6379
// (debe ejecutarse antes de que world.js haga require('../../src/app'))
process.env.REDIS_URL = '';

const { Before, After, BeforeAll } = require('@cucumber/cucumber');
const nock = require('nock');
const { provincias: PROVINCIAS, juegos: JUEGOS, provinciasConCoordenadas } = require('../../tests/fixtures/csvLoader');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_PROVINCES = provinciasConCoordenadas.map(({ nombre, lat, lng }) => ({
  provincia: nombre,
  lat,
  lng,
  totals: { cantidad: 1000, importe: 50000, beneficio: 10000 },
  games: [{ juego: 'Quiniela', cantidad: 500, importe: 25000, beneficio: 5000 }],
}));

function makeHistorico() {
  return Array.from({ length: 12 }, (_, i) => ({
    fecha:     `2025-${String(i + 3).padStart(2, '0')}`,
    cantidad:  1000 + i * 10,
    ingresos:  50000 + i * 500,
    costo:     40000 + i * 400,
    beneficio: 10000 + i * 100,
  }));
}

function buildAllData() {
  const todos = [];
  for (const prov of PROVINCIAS) {
    for (const juego of JUEGOS) {
      todos.push({
        provincia: prov,
        juego,
        historico:  makeHistorico(),
        proyectado: makeProyectado(6),
      });
    }
  }
  return { todos, provincias: PROVINCIAS, juegos: JUEGOS };
}

function makeProyectado(k) {
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

BeforeAll(function () {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

Before(function () {
  // Health check
  nock(CORE_URL).get('/healthz').reply(200, { status: 'healthy' }).persist();

  // Geodata
  nock(CORE_URL).get('/geodata').reply(200, {
    status: 'ok',
    data: {
      globalTotals: { cantidad: 10000, importe: 500000, beneficio: 100000 },
      provinces: MOCK_PROVINCES,
    },
  }).persist();

  // Proyectado — formato all-data (el controller llama sin filtros, filtra en memoria)
  nock(CORE_URL).get('/proyectado').reply(200, {
    status: 'ok',
    data: buildAllData(),
  }).persist();
});

After(function () {
  nock.cleanAll();
});
