'use strict';

const { setWorldConstructor, World } = require('@cucumber/cucumber');
const request = require('supertest');
const app = require('../../src/app');

class BetixWorld extends World {
  constructor(options) {
    super(options);
    this.agent = request(app);
    this.response = null;
  }

  async get(path) {
    this.response = await this.agent.get(path);
  }
}

setWorldConstructor(BetixWorld);
