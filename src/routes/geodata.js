'use strict';

const express         = require('express');
const { getDatos }    = require('../controllers/geodataController');
const cacheMiddleware = require('../middleware/cacheMiddleware');

const router = express.Router();

router.get('/geodata', cacheMiddleware, getDatos);

module.exports = router;
