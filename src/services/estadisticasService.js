const { tickets } = require('../data/mockData');

function aplicarFiltros(data, { fechaDesde, fechaHasta, juego } = {}) {
  return data.filter(ticket => {
    if (juego && ticket.juego !== juego) return false;
    if (fechaDesde && ticket.fecha < fechaDesde) return false;
    if (fechaHasta && ticket.fecha > fechaHasta) return false;
    return true;
  });
}

function calcularRentabilidad(ingresos, costo) {
  if (ingresos === 0) return 0;
  return Number(((ingresos - costo) / ingresos * 100).toFixed(2));
}

function agruparPor(data, campo) {
  const grouped = {};
  for (const ticket of data) {
    const key = ticket[campo];
    if (!grouped[key]) {
      grouped[key] = { [campo]: key, totalTickets: 0, totalIngresos: 0, totalCosto: 0 };
    }
    grouped[key].totalTickets += ticket.cantidad;
    grouped[key].totalIngresos += ticket.ingresos;
    grouped[key].totalCosto += ticket.costo;
  }
  return Object.values(grouped).map(item => ({
    ...item,
    rentabilidad: calcularRentabilidad(item.totalIngresos, item.totalCosto)
  }));
}

function getTicketsPorProvincia(filtros = {}) {
  const data = aplicarFiltros(tickets, filtros);
  return agruparPor(data, 'provincia');
}

function getTicketsPorJuego(filtros = {}) {
  const data = aplicarFiltros(tickets, filtros);
  return agruparPor(data, 'juego');
}

function getResumenGeneral(filtros = {}) {
  const data = aplicarFiltros(tickets, filtros);
  const totalTickets = data.reduce((sum, t) => sum + t.cantidad, 0);
  const totalIngresos = data.reduce((sum, t) => sum + t.ingresos, 0);
  const totalCosto = data.reduce((sum, t) => sum + t.costo, 0);
  return { totalTickets, totalIngresos, totalCosto, rentabilidad: calcularRentabilidad(totalIngresos, totalCosto) };
}

module.exports = { getTicketsPorProvincia, getTicketsPorJuego, getResumenGeneral };
