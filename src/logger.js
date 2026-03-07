'use strict';

// config.js debe cargarse antes que cualquier otro módulo para que
// las variables de entorno del perfil activo estén disponibles
require('./config');

const { createLogger, format, transports } = require('winston');

const level   = process.env.BETIX_LOG_LEVEL  || 'info';
const output  = process.env.BETIX_LOG_OUTPUT || 'console';
const logFile = process.env.BETIX_LOG_FILE   || 'logs/betix.log';

const logTransports = [];

if (output === 'console' || output === 'both') {
  logTransports.push(new transports.Console());
}

if (output === 'file' || output === 'both') {
  logTransports.push(
    new transports.File({ filename: logFile }),
    new transports.File({ filename: logFile.replace('.log', '.error.log'), level: 'error' })
  );
}

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: logTransports,
});

module.exports = logger;
