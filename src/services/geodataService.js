const { tickets } = require('../data/mockData');
const { PROVINCE_COORDS } = require('./mapaService');

function getGeodata() {
  const byProv = {};
  for (const t of tickets) {
    if (!byProv[t.provincia]) {
      byProv[t.provincia] = { cantidad: 0, importe: 0, costo: 0, games: [] };
    }
    byProv[t.provincia].cantidad += t.cantidad;
    byProv[t.provincia].importe  += t.ingresos;
    byProv[t.provincia].costo    += t.costo;
    byProv[t.provincia].games.push({
      juego:     t.juego,
      cantidad:  t.cantidad,
      importe:   t.ingresos,
      beneficio: t.ingresos - t.costo,
    });
  }

  let globalCantidad  = 0;
  let globalImporte   = 0;
  let globalBeneficio = 0;

  const provinces = Object.entries(byProv)
    .filter(([prov]) => PROVINCE_COORDS[prov])
    .map(([prov, d]) => {
      const beneficio = d.importe - d.costo;
      globalCantidad  += d.cantidad;
      globalImporte   += d.importe;
      globalBeneficio += beneficio;
      return {
        provincia: prov,
        lat: PROVINCE_COORDS[prov].lat,
        lng: PROVINCE_COORDS[prov].lng,
        totals: { cantidad: d.cantidad, importe: d.importe, beneficio },
        games: d.games,
      };
    });

  return {
    globalTotals: {
      cantidad:  globalCantidad,
      importe:   globalImporte,
      beneficio: globalBeneficio,
    },
    provinces,
  };
}

module.exports = { getGeodata };
