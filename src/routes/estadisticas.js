const express = require('express');
const router = express.Router();
const { ticketsPorProvincia, ticketsPorJuego, resumenGeneral } = require('../controllers/estadisticasController');

router.get('/provincia', ticketsPorProvincia);
router.get('/juego', ticketsPorJuego);
router.get('/resumen', resumenGeneral);

module.exports = router;
