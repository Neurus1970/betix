'use strict';

const { ticketsPorMes, MONTHS } = require('../data/ticketsPorMes');

/**
 * Agrega los datos mensuales por provincia.
 * @param {string} juego - 'Todos' o nombre de juego específico
 * @returns {{ meses: string[], series: Array }} series con métricas por mes
 */
function getTemporalData(juego = 'Todos') {
  const filtered = juego === 'Todos'
    ? ticketsPorMes
    : ticketsPorMes.filter(t => t.juego === juego);

  const provincias = [...new Set(filtered.map(t => t.provincia))].sort();

  const series = provincias.map(prov => {
    const provData = filtered.filter(t => t.provincia === prov);

    const cantidad  = MONTHS.map(mes => provData.filter(t => t.mes === mes).reduce((s, t) => s + t.cantidad, 0));
    const ingresos  = MONTHS.map(mes => provData.filter(t => t.mes === mes).reduce((s, t) => s + t.ingresos, 0));
    const costo     = MONTHS.map(mes => provData.filter(t => t.mes === mes).reduce((s, t) => s + t.costo,    0));
    const beneficio = ingresos.map((v, i) => v - costo[i]);

    return { provincia: prov, cantidad, ingresos, costo, beneficio };
  });

  return { meses: MONTHS, series };
}

module.exports = { getTemporalData };
