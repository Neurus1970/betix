'use strict';

const {
  calcularProyecciones,
  getProvincias,
  getJuegos,
} = require('../services/proyeccionesService');

function getProyectado(req, res) {
  const provincias = getProvincias();
  const juegos     = getJuegos();

  const provincia = req.query.provincia || provincias[0];
  const juego     = req.query.juego     || juegos[0];
  const k         = Math.min(4, Math.max(1, parseInt(req.query.meses, 10) || 1));

  try {
    const { historico, proyectado } = calcularProyecciones({ provincia, juego, k });
    res.json({
      status: 'ok',
      data: { historico, proyectado, provincias, juegos, provincia, juego, meses: k },
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
}

module.exports = { getProyectado };
