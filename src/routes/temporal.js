'use strict';

const express = require('express');
const { temporal } = require('../controllers/temporalController');

const router = express.Router();

router.get('/temporal', temporal);

module.exports = router;
