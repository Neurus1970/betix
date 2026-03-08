'use strict';

const request = require('supertest');
const app = require('../src/app');
const { checkDataAccess } = require('../src/services/healthService');
const mockData = require('../src/data/mockData');

describe('GET /healthz', () => {
  it('debe retornar status healthy', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('debe retornar 500 si hay un campo faltante', () => {
    const original = { ...mockData.tickets[0] };
    delete mockData.tickets[0].provincia;
    expect(() => checkDataAccess()).toThrow('Datos corruptos: campo "provincia" faltante');
    Object.assign(mockData.tickets[0], original);
  });

  it('debe retornar 500 si un campo tiene tipo incorrecto', () => {
    const original = mockData.tickets[0].ingresos;
    mockData.tickets[0].ingresos = 'invalido';
    expect(() => checkDataAccess()).toThrow('Datos corruptos: campo "ingresos" inválido');
    mockData.tickets[0].ingresos = original;
  });
});
