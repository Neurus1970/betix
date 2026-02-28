const express = require('express');
const { getDatos, getPagina } = require('../controllers/mapaController');

const router = express.Router();

router.get('/datos', getDatos);
router.get('/', getPagina);

module.exports = router;
