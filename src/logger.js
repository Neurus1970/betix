'use strict';

// config.js debe cargarse antes que cualquier otro módulo para que
// las variables de entorno del perfil activo estén disponibles
require('./config');

const { createLogger, format, transports } = require('winston');

const level   = process.env.BETIX_LOG_LEVEL  || 'info';
const output  = process.env.BETIX_LOG_OUTPUT || 'console';
const logFile = process.env.BETIX_LOG_FILE   || 'logs/betix.log';

// Colores ANSI (funcionan en casi todos los terminales modernos)
const colors = {
  green: '\x1b[32m',
  red:   '\x1b[31m',
  reset: '\x1b[0m'
};

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

const customFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  let msg = message;

  // Reemplazamos HIT y MISS solo si aparecen en el mensaje
  msg = msg.replace(/\bHIT\b/g,  `${colors.green}HIT${colors.reset}`);
  msg = msg.replace(/\bMISS\b/g, `${colors.red}MISS${colors.reset}`);

  // Construimos la línea completa
  const ts = timestamp ? `${timestamp} ` : '';
  const levelPadded = level.padEnd(7); // para que queden alineados

  let metaStr = '';
  if (Object.keys(meta).length > 0) {
    metaStr = ' ' + JSON.stringify(meta, null, 2);
  }

  return `${ts}${levelPadded}: ${msg}${metaStr}`;
});

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp(),
    format.colorize(),                  // colores bonitos en consola
    customFormat
  ),
  transports: logTransports,
});

module.exports = logger;
