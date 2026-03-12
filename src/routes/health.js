'use strict';

const express = require('express');
const fetch   = require('node-fetch');
const logger  = require('../logger');
const { CORE_URL } = require('../config');
const cache = require('../cache');

const router = express.Router();

router.get('/healthz', async (_req, res) => {
  const timestamp = new Date().toISOString();
  const deps = {};
  let allHealthy = true;

  // Check betix-core
  try {
    const upstream = await fetch(`${CORE_URL}/healthz`);
    const body = await upstream.json();
    if (upstream.ok) {
      deps['betix-core'] = { status: 'healthy' };
    } else {
      deps['betix-core'] = {
        status: 'unhealthy',
        httpStatus: upstream.status,
        ...(body.dependencies ? { dependencies: body.dependencies } : { error: body.error }),
      };
      allHealthy = false;
    }
  } catch (err) {
    deps['betix-core'] = { status: 'unhealthy', error: `Connection failed: ${err.message}` };
    allHealthy = false;
  }

  // Check Redis
  if (cache.isEnabled) {
    const redisDep = await cache.ping();
    deps['redis'] = redisDep;
    if (redisDep.status === 'unhealthy') allHealthy = false;
  } else {
    deps['redis'] = { status: 'disabled' };
  }

  const status = allHealthy ? 'healthy' : 'unhealthy';
  logger.info(`Health check: ${status}`);
  res.status(allHealthy ? 200 : 503).json({
    status,
    component: 'betix-api',
    timestamp,
    dependencies: deps,
  });
});

module.exports = router;
