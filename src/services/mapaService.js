const { tickets } = require('../data/mockData');

const PROVINCE_COORDS = {
  'Buenos Aires': { lat: -36.6769, lng: -60.5588 },
  'Córdoba':      { lat: -31.4135, lng: -64.1811 },
  'Santa Fe':     { lat: -30.7069, lng: -60.9498 },
  'Mendoza':      { lat: -32.8908, lng: -68.8272 },
  'Tucumán':      { lat: -26.8241, lng: -65.2226 },
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
