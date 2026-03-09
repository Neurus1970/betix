'use strict';

const fetch = require('node-fetch');
const { CORE_URL } = require('../config');

async function getDatos(_req, res) {
  try {
    const upstream = await fetch(`${CORE_URL}/geodata`);
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ status: 'error', message: 'Core service unavailable' });
  }
}

module.exports = { getDatos };
