const { getTicketsPorProvincia, getTicketsPorJuego, getResumenGeneral } = require('../services/estadisticasService');

function ticketsPorProvincia(req, res) {
  const data = getTicketsPorProvincia();
  res.json({ status: 'ok', data });
}

function ticketsPorJuego(req, res) {
  const data = getTicketsPorJuego();
  res.json({ status: 'ok', data });
}

function resumenGeneral(req, res) {
  const data = getResumenGeneral();
  res.json({ status: 'ok', data });
}

module.exports = { ticketsPorProvincia, ticketsPorJuego, resumenGeneral };
