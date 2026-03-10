'use strict';

const { Before, After, BeforeAll } = require('@cucumber/cucumber');
const nock = require('nock');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PROVINCIAS = [
  'Catamarca', 'Corrientes', 'La Pampa', 'La Rioja', 'Neuquén',
  'Río Negro', 'Salta', 'Santa Cruz', 'Santiago del Estero', 'Tierra del Fuego',
];
const JUEGOS = ['Lotería', 'Quiniela', 'Raspadita'];

const MOCK_PROVINCES = PROVINCIAS.map(name => ({
  provincia: name,
  lat: -30.0,
  lng: -65.0,
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
    provincia: 'Catamarca',
    juego:     'Lotería',
  }));
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
  nock(CORE_URL).get('/health').reply(200, { status: 'healthy' }).persist();

  // Geodata
  nock(CORE_URL).get('/geodata').reply(200, {
    status: 'ok',
    data: {
      globalTotals: { cantidad: 10000, importe: 500000, beneficio: 100000 },
      provinces: MOCK_PROVINCES,
    },
  }).persist();

  // Proyectado — dynamic response based on meses query param
  nock(CORE_URL).get('/proyectado').query(true).reply(function (uri) {
    const params  = new URLSearchParams(uri.split('?')[1] || '');
    const k       = Math.min(4, Math.max(1, parseInt(params.get('meses') || '1', 10)));
    return [200, {
      status: 'ok',
      data: {
        historico:  makeHistorico(),
        proyectado: makeProyectado(k),
        provincias: PROVINCIAS,
        juegos:     JUEGOS,
        provincia:  params.get('provincia') || 'Catamarca',
        juego:      params.get('juego')     || 'Lotería',
        meses:      k,
      },
    }];
  }).persist();
});

After(function () {
  nock.cleanAll();
});
