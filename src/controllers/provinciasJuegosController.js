'use strict';

const fetch = require('node-fetch');
const { CORE_URL } = require('../config');

async function getProvinciasJuegos(req, res) {
  try {
    const query = new URLSearchParams(req.query).toString();
    const url = query
      ? `${CORE_URL}/provincias_juegos?${query}`
      : `${CORE_URL}/provincias_juegos`;
    const upstream = await fetch(url);
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ status: 'error', message: 'Core service unavailable' });
  }
}

async function createProvinciaJuego(req, res) {
  try {
    const upstream = await fetch(`${CORE_URL}/provincias_juegos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ status: 'error', message: 'Core service unavailable' });
  }
}

async function deleteProvinciaJuego(req, res) {
  try {
    const { provincia_id, juego_id } = req.params;
    const upstream = await fetch(
      `${CORE_URL}/provincias_juegos/${provincia_id}/${juego_id}`,
      { method: 'DELETE' }
    );
    if (upstream.status === 204) {
      return res.status(204).send();
    }
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ status: 'error', message: 'Core service unavailable' });
  }
}

module.exports = { getProvinciasJuegos, createProvinciaJuego, deleteProvinciaJuego };
