const express = require('express');
const router = express.Router();
const { reporteProvincias } = require('../controllers/reportesController');

router.get('/provincias', reporteProvincias);

module.exports = router;
