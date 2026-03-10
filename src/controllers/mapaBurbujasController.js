'use strict';

const fetch = require('node-fetch');
const { CORE_URL } = require('../config');

async function getDatos(req, res) {
  try {
    const params = new URLSearchParams();
    if (req.query.juego)       params.append('juego',       req.query.juego);
    if (req.query.fecha_desde) params.append('fecha_desde', req.query.fecha_desde);
    if (req.query.fecha_hasta) params.append('fecha_hasta', req.query.fecha_hasta);

    const qs = params.toString();
    const upstream = await fetch(`${CORE_URL}/mapa-burbujas${qs ? `?${qs}` : ''}`);
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ status: 'error', message: 'Core service unavailable' });
  }
}

module.exports = { getDatos };
