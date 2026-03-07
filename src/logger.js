'use strict';

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

function loadProperties(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const props = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      props[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim();
    }
    return props;
  } catch {
    return {};
  }
}

const props = loadProperties(path.join(__dirname, '..', 'betix.properties'));

const level    = process.env.BETIX_LOG_LEVEL  || props['BETIX.log.level']  || 'info';
const output   = process.env.BETIX_LOG_OUTPUT || props['BETIX.log.output'] || 'console';
const logFile  = process.env.BETIX_LOG_FILE   || props['BETIX.log.file']   || 'logs/betix.log';

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
