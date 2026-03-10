'use strict';

const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

const ENV = (process.env.NODE_ENV || 'dev').toLowerCase();

// Mapeo de alias para NODE_ENV estándar de Node hacia los perfiles del proyecto
const PROFILE_MAP = {
  development: 'dev',
  test:        'dev',
  uat:         'uat',
  staging:     'uat',
  production:  'pro',
  pro:         'pro',
  dev:         'dev',
};

const profile = PROFILE_MAP[ENV] || 'dev';
const envFile = path.join(__dirname, '..', `.env.${profile}`);

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile, quiet: true });
} else {
  // Fallback a .env si no existe el archivo del perfil
  dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });
}

const CORE_URL   = process.env.CORE_URL   || 'http://localhost:5000';
const REDIS_URL  = process.env.REDIS_URL  || null;
const CACHE_TTL  = parseInt(process.env.CACHE_TTL || '60', 10);

module.exports = { profile, CORE_URL, REDIS_URL, CACHE_TTL };
