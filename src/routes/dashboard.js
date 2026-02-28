const express = require('express');
const { getDatos } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/datos', getDatos);

module.exports = router;
