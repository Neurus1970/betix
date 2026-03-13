'use strict';

const express = require('express');
const {
  getProvinciasJuegos,
  createProvinciaJuego,
  deleteProvinciaJuego,
} = require('../controllers/provinciasJuegosController');

const router = express.Router();

router.get('/provincias_juegos', getProvinciasJuegos);
router.post('/provincias_juegos', createProvinciaJuego);
router.delete('/provincias_juegos/:provincia_id/:juego_id', deleteProvinciaJuego);

module.exports = router;
