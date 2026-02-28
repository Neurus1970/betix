const path = require('path');
const { getMapaEstadisticas } = require('../services/mapaService');

function getDatos(req, res) {
  const datos = getMapaEstadisticas();
  res.json({ status: 'success', data: datos });
}

function getPagina(req, res) {
  res.sendFile(path.join(__dirname, '..', 'public', 'mapa.html'));
}

module.exports = { getDatos, getPagina };
