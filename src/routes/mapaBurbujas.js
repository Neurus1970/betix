'use strict';

const express         = require('express');
const { getDatos }    = require('../controllers/mapaBurbujasController');
const cacheMiddleware = require('../middleware/cacheMiddleware');

const router = express.Router();

router.get('/mapa-burbujas', cacheMiddleware, getDatos);

module.exports = router;
