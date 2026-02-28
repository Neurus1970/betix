'use strict';

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// ── Request ───────────────────────────────────────────────────────────────────

When('hago GET a {string}', async function (path) {
  await this.get(path);
});

// ── Status y campos de primer nivel ──────────────────────────────────────────

Then('el código de respuesta es {int}', function (expected) {
  assert.strictEqual(this.response.status, expected);
});

Then('el campo {string} es {string}', function (field, expected) {
  assert.strictEqual(this.response.body[field], expected);
});

Then('"data" tiene los campos {string}', function (camposStr) {
  const campos = camposStr.split(',');
  const data = this.response.body.data;
  for (const campo of campos) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(data, campo),
      `Campo faltante en data: ${campo}`
    );
  }
});

// ── Assertions sobre arrays ───────────────────────────────────────────────────

Then('la respuesta contiene un array en {string}', function (field) {
  assert.ok(Array.isArray(this.response.body[field]), `"${field}" no es un array`);
});

Then('el array {string} no está vacío', function (field) {
  assert.ok(this.response.body[field].length > 0, `El array "${field}" está vacío`);
});

Then('el array {string} tiene al menos {int} elementos', function (field, min) {
  const len = this.response.body[field].length;
  assert.ok(len >= min, `Se esperaban al menos ${min} elementos, se encontraron ${len}`);
});

Then('cada elemento de {string} tiene los campos {string}', function (arrayField, camposStr) {
  const campos = camposStr.split(',');
  const arr = this.response.body[arrayField];
  for (const item of arr) {
    for (const campo of campos) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(item, campo),
        `Campo "${campo}" faltante en: ${JSON.stringify(item)}`
      );
    }
  }
});

Then('el array {string} contiene un elemento con {string} igual a {string}',
  function (arrayField, key, value) {
    const arr = this.response.body[arrayField];
    const found = arr.some(item => item[key] === value);
    assert.ok(found, `Ningún elemento de "${arrayField}" tiene ${key} = "${value}"`);
  }
);

Then('la rentabilidad de cada elemento en {string} es un número entre {int} y {int}',
  function (arrayField, min, max) {
    const arr = this.response.body[arrayField];
    for (const item of arr) {
      assert.strictEqual(typeof item.rentabilidad, 'number');
      assert.ok(
        item.rentabilidad >= min && item.rentabilidad <= max,
        `Rentabilidad fuera de rango [${min}, ${max}]: ${item.rentabilidad}`
      );
    }
  }
);

Then('el campo numérico {string} es mayor que {string}', function (pathA, pathB) {
  const get = (obj, path) => path.split('.').reduce((o, k) => o && o[k], obj);
  const valA = get(this.response.body, pathA);
  const valB = get(this.response.body, pathB);
  assert.ok(valA > valB, `Se esperaba ${pathA}(${valA}) > ${pathB}(${valB})`);
});

// ── Acceso a campos anidados con dot-notation ─────────────────────────────────

Then('la respuesta contiene un array en el campo {string}', function (dotPath) {
  const get = (obj, path) => path.split('.').reduce((o, k) => o && o[k], obj);
  const val = get(this.response.body, dotPath);
  assert.ok(Array.isArray(val), `"${dotPath}" no es un array`);
});

Then('el campo {string} tiene {int} elementos', function (dotPath, expected) {
  const get = (obj, path) => path.split('.').reduce((o, k) => o && o[k], obj);
  const val = get(this.response.body, dotPath);
  assert.strictEqual(val.length, expected, `Se esperaban ${expected} en "${dotPath}", se encontraron ${val.length}`);
});

Then('cada elemento del campo {string} tiene los campos {string}', function (dotPath, camposStr) {
  const get = (obj, path) => path.split('.').reduce((o, k) => o && o[k], obj);
  const campos = camposStr.split(',');
  const arr = get(this.response.body, dotPath);
  for (const item of arr) {
    for (const campo of campos) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(item, campo),
        `Campo "${campo}" faltante en: ${JSON.stringify(item)}`
      );
    }
  }
});

Then('el campo anidado {string} tiene los campos {string}', function (dotPath, camposStr) {
  const get = (obj, path) => path.split('.').reduce((o, k) => o && o[k], obj);
  const campos = camposStr.split(',');
  const obj = get(this.response.body, dotPath);
  for (const campo of campos) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(obj, campo),
      `Campo "${campo}" faltante en ${dotPath}: ${JSON.stringify(obj)}`
    );
  }
});
