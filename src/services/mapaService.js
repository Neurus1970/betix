const { tickets } = require('../data/mockData');

const PROVINCE_COORDS = {
  'Buenos Aires': { lat: -36.6769, lng: -60.5588 },
  'CABA':         { lat: -34.6037, lng: -58.3816 },
  'Entre Ríos':   { lat: -31.7328, lng: -60.5238 },
  'Corrientes':   { lat: -27.4806, lng: -58.8341 },
  'Chaco':        { lat: -27.4513, lng: -59.0730 },
  'Misiones':     { lat: -27.3668, lng: -55.8963 },
  'Formosa':      { lat: -26.1849, lng: -58.1730 },
  'La Pampa':     { lat: -36.6148, lng: -64.2839 },
  'San Luis':     { lat: -33.2950, lng: -66.3356 },
};

function getMapaEstadisticas() {
  const grouped = {};
  for (const t of tickets) {
    if (!grouped[t.provincia]) {
      grouped[t.provincia] = { provincia: t.provincia, cantidad: 0, importe: 0, costo: 0 };
    }
    grouped[t.provincia].cantidad += t.cantidad;
    grouped[t.provincia].importe += t.ingresos;
    grouped[t.provincia].costo   += t.costo;
  }

  return Object.values(grouped)
    .map(p => ({
      provincia: p.provincia,
      cantidad:  p.cantidad,
      importe:   p.importe,
      beneficio: p.importe - p.costo,
      lat: PROVINCE_COORDS[p.provincia]?.lat ?? null,
      lng: PROVINCE_COORDS[p.provincia]?.lng ?? null,
    }))
    .filter(p => p.lat !== null);
}

module.exports = { getMapaEstadisticas, PROVINCE_COORDS };
