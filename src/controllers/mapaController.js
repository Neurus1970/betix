const path = require('path');

function getDatos(req, res) {
  res.status(410).json({
    status: 'gone',
    message: 'Este endpoint está deprecado. Use GET /api/datos/geodata (campo data.geo)',
  });
}

function getPagina(req, res) {
  res.sendFile(path.join(__dirname, '..', 'public', 'mapa.html'));
}

module.exports = { getDatos, getPagina };
