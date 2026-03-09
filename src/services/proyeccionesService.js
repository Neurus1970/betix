'use strict';

const { ticketsPorMes } = require('../data/ticketsPorMes');

const SMA_WINDOW = 3; // ventana por defecto para la media móvil simple

// ── Helpers estadísticos ──────────────────────────────────────────────────────

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function addMonth(fechaYYYYMM) {
  const [y, m] = fechaYYYYMM.split('-').map(Number);
  const d = new Date(y, m - 1 + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Proyecciones ──────────────────────────────────────────────────────────────

/**
 * Calcula proyecciones por SMA rolling para una provincia/juego.
 *
 * @param {object} params
 * @param {string} params.provincia
 * @param {string} params.juego
 * @param {number} params.k   meses a proyectar (1–4)
 * @param {number} [params.n] ventana SMA (default: 3)
 * @returns {{ historico: object[], proyectado: object[] }}
 */
function calcularProyecciones({ provincia, juego, k, n = SMA_WINDOW }) {
  const historico = ticketsPorMes
    .filter(t => t.provincia === provincia && t.juego === juego)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(t => ({ ...t, beneficio: t.ingresos - t.costo }));

  if (historico.length < n) {
    throw new Error(
      `Datos insuficientes para proyectar (se necesitan ${n} meses, hay ${historico.length})`
    );
  }

  const metricas = ['cantidad', 'ingresos', 'costo', 'beneficio'];

  // Series de trabajo para rolling SMA (se extienden con cada proyectado)
  const series = Object.fromEntries(
    metricas.map(met => [met, historico.map(h => h[met])])
  );

  // SD base calculada sobre el histórico (últimos n meses): garantiza crecimiento monotónico del error
  const baseSDs = Object.fromEntries(
    metricas.map(met => [met, stdDev(historico.map(h => h[met]).slice(-n))])
  );

  let lastFecha = historico[historico.length - 1].fecha;
  const proyectado = [];

  for (let i = 0; i < k; i++) {
    const fecha = addMonth(lastFecha);
    const entry = { fecha };

    for (const met of metricas) {
      const window = series[met].slice(-n);
      const valor  = Math.round(mean(window));
      // Error crece desde la SD histórica base, garantizando monotonía
      const error  = Math.round(baseSDs[met] * (1 + i * 0.15));

      entry[met]             = valor;
      entry[`error_${met}`]  = error;

      series[met] = [...series[met], valor]; // rolling: incluir proyectado para SMA
    }

    proyectado.push(entry);
    lastFecha = fecha;
  }

  return { historico, proyectado };
}

// ── Listas de referencia (ordenadas alfabéticamente) ─────────────────────────

function getProvincias() {
  return [...new Set(ticketsPorMes.map(t => t.provincia))].sort();
}

function getJuegos() {
  return [...new Set(ticketsPorMes.map(t => t.juego))].sort();
}

module.exports = { calcularProyecciones, getProvincias, getJuegos, mean, stdDev };
