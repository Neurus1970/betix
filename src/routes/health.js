'use strict';

const express = require('express');
const { checkDataAccess } = require('../services/healthService');
const logger = require('../logger');

const router = express.Router();

router.get('/healthz', (req, res) => {
  try {
    checkDataAccess();
    logger.info('Health check exitoso');
    res.json({ status: 'healthy' });
  } catch (err) {
    logger.error('Health check fallido', { error: err.message, stack: err.stack });
    res.status(500).json({ error: err.message });
  }
});

router.get('/health', (req, res) => {
  res.redirect(301, '/healthz');
});

module.exports = router;
