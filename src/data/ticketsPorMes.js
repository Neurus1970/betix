'use strict';

const { tickets } = require('./mockData');

// 12 meses completos: mar 2025 – feb 2026 (proyecciones desde mar 2026)
const MESES = [
  '2025-03', '2025-04', '2025-05', '2025-06',
  '2025-07', '2025-08', '2025-09', '2025-10',
  '2025-11', '2025-12', '2026-01', '2026-02',
];

// Factores estacionales para el mercado de apuestas argentino
const FACTORES_ESTACIONALES = [
  0.96, // mar-25: fin de verano
  0.94, // abr-25: otoño
  0.97, // may-25
  1.02, // jun-25: invierno
  1.06, // jul-25: vacaciones invernales
  1.09, // ago-25
  1.08, // sep-25: primavera
  1.11, // oct-25
  1.14, // nov-25
  1.17, // dic-25: fiestas
  0.89, // ene-26: vacaciones verano (baja)
  0.93, // feb-26
];

// Ruido determinístico ±5% por combinación provincia/juego para variación realista
function variacion(ticketIdx, mesIdx) {
  const seed = (ticketIdx * 7 + mesIdx * 13) % 11 - 5; // rango [-5, +5]
  return 1 + seed / 100;
}

const ticketsPorMes = [];

tickets.forEach((t, tidx) => {
  MESES.forEach((fecha, midx) => {
    const factor = FACTORES_ESTACIONALES[midx] * variacion(tidx, midx);
    ticketsPorMes.push({
      provincia: t.provincia,
      juego:     t.juego,
      fecha,
      cantidad:  Math.round(t.cantidad * factor),
      ingresos:  Math.round(t.ingresos * factor),
      costo:     Math.round(t.costo    * factor),
    });
  });
});

module.exports = { ticketsPorMes, MESES };
