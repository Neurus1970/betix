'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const nock = require('nock');
const assert = require('assert');

const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_LISTA = [
  { provincia_id: 1, juego_id: 1, provincia: 'Salta', juego: 'Quiniela' },
  { provincia_id: 1, juego_id: 2, provincia: 'Salta', juego: 'Lotería' },
  { provincia_id: 2, juego_id: 1, provincia: 'Neuquén', juego: 'Quiniela' },
];

const MOCK_FILTRADA = [
  { provincia_id: 1, juego_id: 1, provincia: 'Salta', juego: 'Quiniela' },
  { provincia_id: 1, juego_id: 2, provincia: 'Salta', juego: 'Lotería' },
];

const MOCK_CREADA = { provincia_id: 3, juego_id: 2, provincia: 'Corrientes', juego: 'Lotería' };

// ── Givens — configuración de nock ────────────────────────────────────────────

Given('el core devuelve la lista de provincias_juegos', function () {
  nock(CORE_URL)
    .get('/provincias_juegos')
    .reply(200, MOCK_LISTA);
});

Given('el core devuelve asignaciones para la provincia 1', function () {
  nock(CORE_URL)
    .get('/provincias_juegos')
    .query({ provincia_id: '1' })
    .reply(200, MOCK_FILTRADA);
});

Given('el core acepta la nueva asignación', function () {
  nock(CORE_URL)
    .post('/provincias_juegos', { provincia_id: 3, juego_id: 2 })
    .reply(201, MOCK_CREADA);
});

Given('el core rechaza la asignación por duplicada', function () {
  nock(CORE_URL)
    .post('/provincias_juegos', { provincia_id: 1, juego_id: 1 })
    .reply(409, { status: 'error', message: 'Asignación duplicada' });
});

Given('el core elimina la asignación correctamente', function () {
  nock(CORE_URL)
    .delete('/provincias_juegos/1/1')
    .reply(204);
});

Given('el core no encuentra la asignación a eliminar', function () {
  nock(CORE_URL)
    .delete('/provincias_juegos/9999/9999')
    .reply(404, { status: 'error', message: 'Asignación no encontrada' });
});

// ── Whens — requests HTTP ─────────────────────────────────────────────────────

When('se hace GET a {string}', async function (path) {
  this.response = await this.agent.get(path);
});

When('se hace POST a {string} con body provincia_id={int} juego_id={int}',
  async function (path, provinciaId, juegoId) {
    this.response = await this.agent
      .post(path)
      .send({ provincia_id: provinciaId, juego_id: juegoId })
      .set('Content-Type', 'application/json');
  }
);

When('se hace DELETE a {string}', async function (path) {
  this.response = await this.agent.delete(path);
});

// ── Thens — aserciones ────────────────────────────────────────────────────────

Then('la respuesta tiene status {int}', function (expected) {
  assert.strictEqual(this.response.status, expected);
});

Then('la respuesta contiene una lista de asignaciones', function () {
  assert.ok(Array.isArray(this.response.body), 'La respuesta no es un array');
  assert.ok(this.response.body.length > 0, 'La lista de asignaciones está vacía');
});

Then('todas las asignaciones pertenecen a la provincia 1', function () {
  const lista = this.response.body;
  assert.ok(Array.isArray(lista), 'La respuesta no es un array');
  for (const item of lista) {
    assert.strictEqual(
      item.provincia_id,
      1,
      `Se encontró una asignación con provincia_id=${item.provincia_id}, se esperaba 1`
    );
  }
});

Then('la respuesta contiene los datos de la asignación creada', function () {
  const body = this.response.body;
  assert.ok(
    Object.prototype.hasOwnProperty.call(body, 'provincia_id'),
    'Falta el campo provincia_id en la respuesta'
  );
  assert.ok(
    Object.prototype.hasOwnProperty.call(body, 'juego_id'),
    'Falta el campo juego_id en la respuesta'
  );
});
