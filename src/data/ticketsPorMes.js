'use strict';

// Meses cubiertos: Jun 2025 → Mar 2026 (10 meses)
const MONTHS = [
  '2025-06', '2025-07', '2025-08', '2025-09', '2025-10',
  '2025-11', '2025-12', '2026-01', '2026-02', '2026-03',
];

// Patrón estacional argentino: pico verano (Dic-Feb), valle invierno (Jun-Jul)
const SEASONAL = [0.82, 0.85, 0.90, 0.95, 1.00, 1.08, 1.18, 1.20, 1.15, 1.07];

// Base mensual (≈ total anual / 10) con parámetros de tendencia y boost invernal.
// winterBoost se aplica en Jun-Ago (índices 0-2); útil para provincias
// patagónicas donde el turismo de invierno eleva la actividad.
//
// Columnas: [provincia, juego, cantidad, ingresos, costo, trend, winterBoost]
const BASES = [
  ['Salta',               'Quiniela',  480, 14400, 10500,  0.012,  0.00],
  ['Salta',               'Lotería',   210, 21000,  8400,  0.008,  0.00],
  ['Salta',               'Raspadita', 570,  5700,  4800,  0.015,  0.00],

  ['Santiago del Estero', 'Quiniela',  390, 11700,  9500,  0.000,  0.00],
  ['Santiago del Estero', 'Lotería',   170, 17000,  7200,  0.005,  0.00],
  ['Santiago del Estero', 'Raspadita', 460,  4600,  3900, -0.005,  0.00],

  ['Neuquén',             'Quiniela',  520, 15600,  8800, -0.008,  0.18],
  ['Neuquén',             'Lotería',   230, 23000, 19500, -0.005,  0.20],
  ['Neuquén',             'Raspadita', 610,  6100,  3500,  0.000,  0.15],

  ['La Pampa',            'Quiniela',  380, 11400,  6200,  0.025,  0.00],
  ['La Pampa',            'Lotería',   160, 16000, 13500,  0.020,  0.00],
  ['La Pampa',            'Raspadita', 450,  4500,  1900,  0.030,  0.00],

  ['Santa Cruz',          'Quiniela',  280,  8400,  7200,  0.005,  0.12],
  ['Santa Cruz',          'Lotería',   110, 11000,  4600,  0.003,  0.10],
  ['Santa Cruz',          'Raspadita', 340,  3400,  2800,  0.000,  0.08],

  ['La Rioja',            'Quiniela',  310,  9300,  7800,  0.010,  0.00],
  ['La Rioja',            'Lotería',   130, 13000,  5200,  0.008,  0.00],
  ['La Rioja',            'Raspadita', 370,  3700,  3100,  0.005,  0.00],

  ['Catamarca',           'Quiniela',  270,  8100,  6800,  0.008,  0.00],
  ['Catamarca',           'Lotería',   110, 11000,  4400,  0.005,  0.00],
  ['Catamarca',           'Raspadita', 320,  3200,  2700,  0.010,  0.00],

  ['Tierra del Fuego',    'Quiniela',  180,  5400,  4500,  0.000,  0.30],
  ['Tierra del Fuego',    'Lotería',    70,  7000,  2900,  0.000,  0.28],
  ['Tierra del Fuego',    'Raspadita', 210,  2100,  1800,  0.000,  0.25],

  ['Corrientes',          'Quiniela',  580, 17400, 14000,  0.012,  0.00],
  ['Corrientes',          'Lotería',   240, 24000, 10500,  0.010,  0.00],
  ['Corrientes',          'Raspadita', 690,  6900,  5200,  0.008,  0.00],

  ['Río Negro',           'Quiniela',  420, 12600, 10000,  0.018,  0.05],
  ['Río Negro',           'Lotería',   180, 18000,  7600,  0.015,  0.05],
  ['Río Negro',           'Raspadita', 500,  5000,  4200,  0.020,  0.05],
];

const WINTER_INDICES = new Set([0, 1, 2]); // Jun, Jul, Ago

const ticketsPorMes = [];
let id = 1;

for (const [provincia, juego, baseCant, baseIng, baseCosto, trend, winterBoost] of BASES) {
  for (let m = 0; m < MONTHS.length; m++) {
    const seasonal = SEASONAL[m];
    const trendFactor  = 1 + trend * m;
    const winterFactor = WINTER_INDICES.has(m) ? (1 + winterBoost) : 1;
    const factor = seasonal * trendFactor * winterFactor;

    const cantidad = Math.round(baseCant  * factor);
    const ingresos = Math.round(baseIng   * factor);
    const costo    = Math.round(baseCosto * factor);

    ticketsPorMes.push({ id: id++, provincia, juego, mes: MONTHS[m], cantidad, ingresos, costo });
  }
}

module.exports = { ticketsPorMes, MONTHS };
