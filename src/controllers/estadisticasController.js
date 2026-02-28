const { getTicketsPorProvincia, getTicketsPorJuego, getResumenGeneral } = require('../services/estadisticasService');

function extraerFiltros(query) {
  const { fechaDesde, fechaHasta, juego } = query;
  return { fechaDesde, fechaHasta, juego };
}

function ticketsPorProvincia(req, res) {
  const filtros = extraerFiltros(req.query);
  const data = getTicketsPorProvincia(filtros);
  res.json({ status: 'ok', filtros, data });
}

function ticketsPorJuego(req, res) {
  const filtros = extraerFiltros(req.query);
  const data = getTicketsPorJuego(filtros);
  res.json({ status: 'ok', filtros, data });
}

function resumenGeneral(req, res) {
  const filtros = extraerFiltros(req.query);
  const data = getResumenGeneral(filtros);
  res.json({ status: 'ok', filtros, data });
}

module.exports = { ticketsPorProvincia, ticketsPorJuego, resumenGeneral };
