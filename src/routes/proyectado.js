'use strict';

const express         = require('express');
const { getProyectado } = require('../controllers/proyectadoController');
const cacheMiddleware = require('../middleware/cacheMiddleware');

const router = express.Router();

router.get('/proyectado', cacheMiddleware, getProyectado);

module.exports = router;
