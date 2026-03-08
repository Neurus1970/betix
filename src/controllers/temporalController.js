'use strict';

const { getTemporalData } = require('../services/temporalService');
const logger = require('../logger');

function temporal(req, res) {
  try {
    const juego = req.query.juego || 'Todos';
    const data  = getTemporalData(juego);
    logger.info('Temporal data solicitado', { juego });
    res.json({ status: 'ok', data });
  } catch (err) {
    logger.error('Error en temporal', { error: err.message });
    res.status(500).json({ error: err.message });
  }
}

module.exports = { temporal };
