const { tickets } = require('../data/mockData');

function getFechaDefault30DiasAtras() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 30);
  return fecha.toISOString().split('T')[0];
}

function getFechaHoy() {
  return new Date().toISOString().split('T')[0];
}

function calcularRentabilidad(ingresos, costos) {
  if (ingresos === 0) return 0;
  return Number(((ingresos - costos) / ingresos * 100).toFixed(2));
}

function getTopJuego(juegosCantidad) {
  return Object.entries(juegosCantidad).reduce((top, [juego, cantidad]) =>
    cantidad > top.cantidad ? { juego, cantidad } : top,
  { juego: null, cantidad: 0 }).juego;
}

function getReportePorProvincia({ fechaInicio, fechaFin, tipoJuego } = {}) {
  const desde = fechaInicio || getFechaDefault30DiasAtras();
  const hasta = fechaFin || getFechaHoy();

  const filtrados = tickets.filter(t => {
    if (t.fecha < desde || t.fecha > hasta) return false;
    if (tipoJuego && t.juego.toLowerCase() !== tipoJuego.toLowerCase()) return false;
    return true;
  });

  if (filtrados.length === 0) {
    return { data: [], message: 'No data found for the given filters' };
  }

  const grouped = {};
  for (const t of filtrados) {
    if (!grouped[t.provincia]) {
      grouped[t.provincia] = { provincia: t.provincia, ticketsVendidos: 0, ingresos: 0, costos: 0, _juegosCantidad: {} };
    }
    grouped[t.provincia].ticketsVendidos += t.cantidad;
    grouped[t.provincia].ingresos += t.ingresos;
    grouped[t.provincia].costos += t.costo;
    grouped[t.provincia]._juegosCantidad[t.juego] = (grouped[t.provincia]._juegosCantidad[t.juego] || 0) + t.cantidad;
  }

  const data = Object.values(grouped)
    .map(({ _juegosCantidad, ...p }) => ({
      ...p,
      rentabilidad: calcularRentabilidad(p.ingresos, p.costos),
      topJuego: getTopJuego(_juegosCantidad)
    }))
    .sort((a, b) => b.ingresos - a.ingresos);

  return { data };
}

module.exports = { getReportePorProvincia, getFechaDefault30DiasAtras, getFechaHoy };
