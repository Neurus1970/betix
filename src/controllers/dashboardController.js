function getDatos(req, res) {
  res.status(410).json({
    status: 'gone',
    message: 'Este endpoint está deprecado. Use GET /api/datos/geodata (campo data.detail)',
  });
}

module.exports = { getDatos };
