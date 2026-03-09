'use strict';

const express = require('express');
const { getProyectado } = require('../controllers/proyectadoController');

const router = express.Router();

router.get('/proyectado', getProyectado);

module.exports = router;
