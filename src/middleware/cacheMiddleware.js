'use strict';

const cache  = require('../cache');
const logger = require('../logger');
const { CACHE_TTL } = require('../config');

/**
 * Express middleware que sirve respuestas desde Redis cuando estén disponibles.
 * Si Redis no está configurado o falla, pasa la petición al siguiente handler.
 *
 * La clave de caché incluye el path y los query params ordenados,
 * de modo que /api/datos/geodata?juego=Quiniela y ?juego=Lotería son entradas separadas.
 */
function cacheMiddleware(req, res, next) {
  // Fast path: sin Redis configurado, delegar síncronamente sin overhead de Promise.
  // Esto también preserva el timing correcto de los error handlers de node-fetch en tests.
  if (!cache.isEnabled) return next();

  const sortedQuery = Object.keys(req.query)
    .sort()
    .map(k => `${k}=${req.query[k]}`)
    .join('&');

  const key = `betix:${req.path}:${sortedQuery}`;

  cache.get(key).then((cached) => {
    if (cached) {
      logger.info(`Cache HIT [${key}]`);
      return res.json(cached);
    }

    logger.info(`Cache MISS [${key}]`);
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data, CACHE_TTL);
      return originalJson(data);
    };

    next();
  }).catch((err) => {
    logger.error(`Cache middleware error: ${err.message}`);
    next();
  });
}

module.exports = cacheMiddleware;
