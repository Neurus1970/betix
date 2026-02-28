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
