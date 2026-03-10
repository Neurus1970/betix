'use strict';

const express = require('express');
const { getDatos } = require('../controllers/mapaBurbujasController');

const router = express.Router();

router.get('/mapa-burbujas', getDatos);

module.exports = router;
