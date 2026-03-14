'use strict';

const fs   = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname, '../../db/seeds');

/**
 * Lee un CSV y retorna un array de objetos usando la primera fila como cabecera.
 * Soporta CSVs simples (sin comillas que contengan comas).
 * @param {string} filename - nombre del archivo CSV dentro de db/seeds/
 * @returns {Array<Object>}
 */
function readCsv(filename) {
  const filePath = path.join(SEEDS_DIR, filename);
  const content  = fs.readFileSync(filePath, 'utf8');
  const lines    = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] !== undefined ? values[i] : '';
    });
    return obj;
  });
}

/**
 * Lista de nombres de provincias leídos de db/seeds/_provincias.csv.
 * @type {string[]}
 */
const provincias = readCsv('_provincias.csv').map(row => row.nombre);

/**
 * Lista de nombres de juegos leídos de db/seeds/_juegos.csv.
 * @type {string[]}
 */
const juegos = readCsv('_juegos.csv').map(row => row.nombre);

/**
 * Registros de tickets mensuales leídos de db/seeds/_tickets_mensuales.csv.
 * Cada objeto tiene: provincia_nombre, juego_nombre, fecha, cantidad, ingresos, costo
 * (cantidad, ingresos y costo se convierten a número).
 * @type {Array<{provincia_nombre: string, juego_nombre: string, fecha: string, cantidad: number, ingresos: number, costo: number}>}
 */
const ticketsMensuales = readCsv('_tickets_mensuales.csv').map(row => ({
  provincia_nombre: row.provincia_nombre,
  juego_nombre:     row.juego_nombre,
  fecha:            row.fecha,
  cantidad:         Number(row.cantidad),
  ingresos:         Number(row.ingresos),
  costo:            Number(row.costo),
}));

/**
 * Datos de provincias con coordenadas leídos de db/seeds/_provincias.csv.
 * Cada objeto tiene: nombre, lat, lng (lat y lng como números).
 * @type {Array<{nombre: string, lat: number, lng: number}>}
 */
const provinciasConCoordenadas = readCsv('_provincias.csv').map(row => ({
  nombre: row.nombre,
  lat:    Number(row.lat),
  lng:    Number(row.lng),
}));

module.exports = { provincias, juegos, ticketsMensuales, provinciasConCoordenadas };
