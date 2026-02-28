const express = require('express');
const { getDatos } = require('../controllers/geodataController');

const router = express.Router();

router.get('/geodata', getDatos);

module.exports = router;
