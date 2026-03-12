'use strict';

const fetch = require('node-fetch');
const cache = require('../cache');
const logger = require('../logger');
const { CORE_URL, CACHE_TTL } = require('../config');

const CACHE_KEY = 'betix:proyectado:all';

/**
 * Obtiene proyecciones estadísticas filtrando desde un dataset completo en caché.
 *
 * Estrategia de caché:
 *   - MISS: llama al core sin filtros para obtener todos los datos (all-data mode),
 *           guarda el resultado en Redis con la clave fija CACHE_KEY.
 *   - HIT:  devuelve los datos del caché y filtra en memoria según provincia/juego/meses.
 *
 * Sin cambios en la configuración del conector de Redis (src/cache.js).
 */
async function getProyectado(req, res) {
  try {
    const { provincia, juego } = req.query;
    const meses = Math.min(6, Math.max(1, parseInt(req.query.meses || '1', 10) || 1));

    let allData = await cache.get(CACHE_KEY);

    if (!allData) {
      logger.info(`Cache MISS [${CACHE_KEY}] — fetching full dataset from core`);
      const upstream = await fetch(`${CORE_URL}/proyectado`);
      const body = await upstream.json();
      if (!upstream.ok) return res.status(upstream.status).json(body);
      allData = body.data;
      cache.set(CACHE_KEY, allData, CACHE_TTL);
    } else {
      logger.info(`Cache HIT [${CACHE_KEY}]`);
    }

    const provincias    = allData.provincias || [];
    const juegos        = allData.juegos     || [];
    const todos         = allData.todos      || [];

    const selectedProv  = provincia || provincias[0];
    const selectedJuego = juego     || juegos[0];

    const combo = todos.find(d => d.provincia === selectedProv && d.juego === selectedJuego);
    if (!combo) {
      return res.status(400).json({
        status: 'error',
        message: `No hay datos para ${selectedProv} / ${selectedJuego}`,
      });
    }

    res.json({
      status: 'ok',
      data: {
        historico:  combo.historico,
        proyectado: combo.proyectado.slice(0, meses),
        provincias,
        juegos,
        provincia:  selectedProv,
        juego:      selectedJuego,
        meses,
      },
    });
  } catch (err) {
    res.status(502).json({ status: 'error', message: 'Core service unavailable' });
  }
}

module.exports = { getProyectado };
