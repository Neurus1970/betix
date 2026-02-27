const { tickets } = require('../data/mockData');

function getTicketsPorProvincia() {
  const grouped = {};
  for (const ticket of tickets) {
    if (!grouped[ticket.provincia]) {
      grouped[ticket.provincia] = { provincia: ticket.provincia, totalTickets: 0, totalIngresos: 0, totalCosto: 0 };
    }
    grouped[ticket.provincia].totalTickets += ticket.cantidad;
    grouped[ticket.provincia].totalIngresos += ticket.ingresos;
    grouped[ticket.provincia].totalCosto += ticket.costo;
  }
  return Object.values(grouped).map(p => ({
    ...p,
    rentabilidad: Number(((p.totalIngresos - p.totalCosto) / p.totalIngresos * 100).toFixed(2))
  }));
}

function getTicketsPorJuego() {
  const grouped = {};
  for (const ticket of tickets) {
    if (!grouped[ticket.juego]) {
      grouped[ticket.juego] = { juego: ticket.juego, totalTickets: 0, totalIngresos: 0, totalCosto: 0 };
    }
    grouped[ticket.juego].totalTickets += ticket.cantidad;
    grouped[ticket.juego].totalIngresos += ticket.ingresos;
    grouped[ticket.juego].totalCosto += ticket.costo;
  }
  return Object.values(grouped).map(j => ({
    ...j,
    rentabilidad: Number(((j.totalIngresos - j.totalCosto) / j.totalIngresos * 100).toFixed(2))
  }));
}

function getResumenGeneral() {
  const totalTickets = tickets.reduce((sum, t) => sum + t.cantidad, 0);
  const totalIngresos = tickets.reduce((sum, t) => sum + t.ingresos, 0);
  const totalCosto = tickets.reduce((sum, t) => sum + t.costo, 0);
  const rentabilidad = Number(((totalIngresos - totalCosto) / totalIngresos * 100).toFixed(2));
  return { totalTickets, totalIngresos, totalCosto, rentabilidad };
}

module.exports = { getTicketsPorProvincia, getTicketsPorJuego, getResumenGeneral };
