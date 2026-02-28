const { getGeodata } = require('../services/geodataService');

function getDatos(req, res) {
  res.json({ status: 'ok', data: getGeodata() });
}

module.exports = { getDatos };
