'use strict';

const fetch = require('node-fetch');
const { CORE_URL } = require('../config');

async function getProyectado(req, res) {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const url = `${CORE_URL}/proyectado${qs ? `?${qs}` : ''}`;
    const upstream = await fetch(url);
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ status: 'error', message: 'Core service unavailable' });
  }
}

module.exports = { getProyectado };
