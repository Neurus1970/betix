'use strict';

const express           = require('express');
const { getProyectado } = require('../controllers/proyectadoController');

const router = express.Router();

// La caché está gestionada directamente en el controller (estrategia all-data).
router.get('/proyectado', getProyectado);

module.exports = router;
