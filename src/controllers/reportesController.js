const { getReportePorProvincia } = require('../services/reportesService');

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function esFechaValida(str) {
  if (!FECHA_REGEX.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d);
}

function reporteProvincias(req, res) {
  const { fechaInicio, fechaFin, tipoJuego } = req.query;

  if (fechaInicio && !esFechaValida(fechaInicio)) {
    return res.status(400).json({ status: 'error', message: 'fechaInicio inválida. Use formato YYYY-MM-DD.' });
  }
  if (fechaFin && !esFechaValida(fechaFin)) {
    return res.status(400).json({ status: 'error', message: 'fechaFin inválida. Use formato YYYY-MM-DD.' });
  }
  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    return res.status(400).json({ status: 'error', message: 'fechaInicio no puede ser posterior a fechaFin.' });
  }

  const resultado = getReportePorProvincia({ fechaInicio, fechaFin, tipoJuego });

  if (resultado.message) {
    return res.json({ status: 'success', data: resultado.data, message: resultado.message });
  }

  return res.json({ status: 'success', data: resultado.data });
}

module.exports = { reporteProvincias };
