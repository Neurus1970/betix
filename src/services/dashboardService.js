const { tickets } = require('../data/mockData');

function getDashboardData() {
  return tickets.map(t => ({
    provincia: t.provincia,
    juego:     t.juego,
    cantidad:  t.cantidad,
    importe:   t.ingresos,
    beneficio: t.ingresos - t.costo,
  }));
}

module.exports = { getDashboardData };
