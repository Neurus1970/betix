'use strict';

const express = require('express');
const fetch   = require('node-fetch');
const logger  = require('../logger');
const { CORE_URL } = require('../config');

const router = express.Router();

router.get('/healthz', async (_req, res) => {
  try {
    const upstream = await fetch(`${CORE_URL}/healthz`);
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    logger.error('Health check fallido', { error: err.message });
    res.status(500).json({ status: 'unhealthy', message: 'Core service unavailable' });
  }
});

module.exports = router;
