const { getMapaEstadisticas } = require('./mapaService');
const { getDashboardData } = require('./dashboardService');

function getGeodata() {
  return {
    geo:    getMapaEstadisticas(),
    detail: getDashboardData(),
  };
}

module.exports = { getGeodata };
