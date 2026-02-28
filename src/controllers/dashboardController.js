const { getDashboardData } = require('../services/dashboardService');

function getDatos(req, res) {
  res.json({ status: 'ok', data: getDashboardData() });
}

module.exports = { getDatos };
