'use strict';

const Redis  = require('ioredis');
const logger = require('./logger');
const { REDIS_URL } = require('./config');

let client = null;

if (REDIS_URL) {
  client = new Redis(REDIS_URL, { lazyConnect: true, enableReadyCheck: true });

  client.on('connect',  () => logger.info('Redis conectado'));
  client.on('error',    (err) => logger.error(`Redis error: ${err.message}`));
  client.on('close',    () => logger.info('Redis desconectado'));

  client.connect().catch((err) => {
    logger.error(`Redis no disponible al iniciar: ${err.message}`);
  });
}

async function get(key) {
  if (!client) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error(`Cache get error [${key}]: ${err.message}`);
    return null;
  }
}

async function set(key, value, ttl) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.error(`Cache set error [${key}]: ${err.message}`);
  }
}

const isEnabled = !!REDIS_URL;

module.exports = { get, set, isEnabled };
