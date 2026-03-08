'use strict';

const { tickets } = require('../data/mockData');

const PROVINCE_COORDS = {
  'Salta':               { lat: -24.7859, lng: -65.4117 },
  'Santiago del Estero': { lat: -27.7951, lng: -64.2615 },
  'Neuquén':             { lat: -38.9516, lng: -68.0591 },
  'La Pampa':            { lat: -36.6148, lng: -64.2839 },
  'Santa Cruz':          { lat: -51.6230, lng: -69.2168 },
  'La Rioja':            { lat: -29.4131, lng: -66.8558 },
  'Catamarca':           { lat: -28.4696, lng: -65.7852 },
  'Tierra del Fuego':    { lat: -54.8019, lng: -68.3030 },
  'Corrientes':          { lat: -27.4806, lng: -58.8341 },
  'Río Negro':           { lat: -40.8135, lng: -63.0000 },
};

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
