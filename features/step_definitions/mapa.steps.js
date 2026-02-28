'use strict';

const { Then } = require('@cucumber/cucumber');
const assert = require('assert');

// ── HTML ──────────────────────────────────────────────────────────────────────

Then('el Content-Type es {string}', function (expected) {
  assert.ok(
    this.response.headers['content-type'].includes(expected),
    `Content-Type "${this.response.headers['content-type']}" no contiene "${expected}"`
  );
});

Then('el HTML contiene {string}', function (text) {
  assert.ok(
    this.response.text.includes(text),
    `El HTML no contiene: ${text}`
  );
});

// ── Coordenadas y valores numéricos ──────────────────────────────────────────

Then('la latitud de cada provincia está entre {int} y {int}', function (min, max) {
  for (const p of this.response.body.data) {
    assert.ok(
      p.lat > min && p.lat < max,
      `Latitud fuera de rango [${min}, ${max}]: ${p.lat} (${p.provincia})`
    );
  }
});

Then('la longitud de cada provincia está entre {int} y {int}', function (min, max) {
  for (const p of this.response.body.data) {
    assert.ok(
      p.lng > min && p.lng < max,
      `Longitud fuera de rango [${min}, ${max}]: ${p.lng} (${p.provincia})`
    );
  }
});

Then('cada elemento de {string} tiene {string} mayor que {int}', function (arrayField, numField, min) {
  for (const item of this.response.body[arrayField]) {
    assert.ok(
      item[numField] > min,
      `"${numField}" debería ser > ${min}, pero es ${item[numField]} en ${item.provincia}`
    );
  }
});

Then('ningún elemento de {string} tiene {string} nulo', function (arrayField, field) {
  for (const item of this.response.body[arrayField]) {
    assert.notStrictEqual(item[field], null, `"${field}" es nulo en provincia: ${item.provincia}`);
  }
});
