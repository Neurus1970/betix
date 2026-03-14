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
