'use strict';

const { tickets } = require('../data/mockData');

const REQUIRED_FIELDS = {
  id:        'number',
  provincia: 'string',
  juego:     'string',
  cantidad:  'number',
  ingresos:  'number',
  costo:     'number',
};

function checkDataAccess() {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    throw new Error('No se pudieron cargar los datos estadísticos');
  }

  for (const [index, ticket] of tickets.entries()) {
    for (const [field, expectedType] of Object.entries(REQUIRED_FIELDS)) {
      if (!(field in ticket)) {
        throw new Error(`Datos corruptos: campo "${field}" faltante en el registro ${index}`);
      }
      if (typeof ticket[field] !== expectedType) {
        throw new Error(
          `Datos corruptos: campo "${field}" inválido en el registro ${index} (esperado ${expectedType}, recibido ${typeof ticket[field]})`
        );
      }
    }
  }
}

module.exports = { checkDataAccess };
