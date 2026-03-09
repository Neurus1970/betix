'use strict';

const request = require('supertest');
const app     = require('../src/app');
const {
  calcularProyecciones,
  getProvincias,
  getJuegos,
  mean,
  stdDev,
} = require('../src/services/proyeccionesService');

// ── Página HTML ───────────────────────────────────────────────────────────────

describe('GET /proyectado', () => {
  it('debe retornar status 200 y Content-Type html', async () => {
    const res = await request(app).get('/proyectado');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('debe incluir los selectores de filtros', async () => {
    const res = await request(app).get('/proyectado');
    expect(res.text).toContain('id="sel-provincia"');
    expect(res.text).toContain('id="sel-juego"');
    expect(res.text).toContain('id="sel-meses"');
    expect(res.text).toContain('id="sel-metrica"');
  });

  it('debe incluir el SVG del gráfico', async () => {
    const res = await request(app).get('/proyectado');
    expect(res.text).toContain('id="chart-svg"');
  });

  it('debe incluir la tabla de datos', async () => {
    const res = await request(app).get('/proyectado');
    expect(res.text).toContain('id="table-proyectado"');
  });

  it('debe usar D3.js', async () => {
    const res = await request(app).get('/proyectado');
    expect(res.text).toContain('d3js.org');
  });

  it('debe consumir el endpoint /api/datos/proyectado', async () => {
    const res = await request(app).get('/proyectado');
    expect(res.text).toContain('/api/datos/proyectado');
  });
});

// ── API endpoint ──────────────────────────────────────────────────────────────

describe('GET /api/datos/proyectado', () => {
  it('debe retornar status 200 con estructura correcta', async () => {
    const res = await request(app).get('/api/datos/proyectado');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toHaveProperty('historico');
    expect(res.body.data).toHaveProperty('proyectado');
    expect(res.body.data).toHaveProperty('provincias');
    expect(res.body.data).toHaveProperty('juegos');
  });

  it('debe retornar 12 registros históricos por defecto', async () => {
    const res = await request(app).get('/api/datos/proyectado');
    expect(res.body.data.historico).toHaveLength(12);
  });

  it('debe retornar 1 mes proyectado por defecto (meses=1)', async () => {
    const res = await request(app).get('/api/datos/proyectado');
    expect(res.body.data.proyectado).toHaveLength(1);
  });

  it('debe retornar 4 meses proyectados cuando meses=4', async () => {
    const res = await request(app).get('/api/datos/proyectado?meses=4');
    expect(res.body.data.proyectado).toHaveLength(4);
  });

  it('debe filtrar por provincia', async () => {
    const res = await request(app).get('/api/datos/proyectado?provincia=Corrientes&juego=Quiniela');
    expect(res.body.data.provincia).toBe('Corrientes');
    expect(res.body.data.juego).toBe('Quiniela');
  });

  it('los registros históricos deben tener los campos requeridos', async () => {
    const res  = await request(app).get('/api/datos/proyectado');
    const item = res.body.data.historico[0];
    expect(item).toHaveProperty('fecha');
    expect(item).toHaveProperty('cantidad');
    expect(item).toHaveProperty('ingresos');
    expect(item).toHaveProperty('costo');
    expect(item).toHaveProperty('beneficio');
  });

  it('los registros proyectados deben tener error_* y fecha futura', async () => {
    const res  = await request(app).get('/api/datos/proyectado');
    const item = res.body.data.proyectado[0];
    expect(item).toHaveProperty('fecha');
    expect(item).toHaveProperty('cantidad');
    expect(item).toHaveProperty('error_cantidad');
    expect(item).toHaveProperty('ingresos');
    expect(item).toHaveProperty('error_ingresos');
    expect(item).toHaveProperty('beneficio');
    expect(item).toHaveProperty('error_beneficio');
    // La fecha proyectada debe ser posterior al último histórico (feb 2026)
    expect(item.fecha >= '2026-03').toBe(true);
  });

  it('beneficio = ingresos - costo en el histórico', async () => {
    const res = await request(app).get('/api/datos/proyectado');
    for (const row of res.body.data.historico) {
      expect(row.beneficio).toBe(row.ingresos - row.costo);
    }
  });

  it('la lista de provincias está ordenada alfabéticamente', async () => {
    const res  = await request(app).get('/api/datos/proyectado');
    const list = res.body.data.provincias;
    expect(list).toEqual([...list].sort());
  });

  it('clampea meses fuera de rango: meses=10 → 4 proyectados', async () => {
    const res = await request(app).get('/api/datos/proyectado?meses=10');
    expect(res.body.data.proyectado).toHaveLength(4);
  });
});

// ── Servicio: unidades ────────────────────────────────────────────────────────

describe('proyeccionesService', () => {
  describe('mean()', () => {
    it('calcula la media correctamente', () => {
      expect(mean([2, 4, 6])).toBe(4);
      expect(mean([10])).toBe(10);
    });
  });

  describe('stdDev()', () => {
    it('devuelve 0 para una serie constante', () => {
      expect(stdDev([5, 5, 5])).toBe(0);
    });

    it('calcula desviación estándar correctamente', () => {
      expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 0);
    });
  });

  describe('getProvincias()', () => {
    it('devuelve 10 provincias ordenadas', () => {
      const list = getProvincias();
      expect(list).toHaveLength(10);
      expect(list).toEqual([...list].sort());
    });
  });

  describe('getJuegos()', () => {
    it('devuelve 3 juegos ordenados', () => {
      const list = getJuegos();
      expect(list).toHaveLength(3);
      expect(list).toEqual([...list].sort());
    });
  });

  describe('calcularProyecciones()', () => {
    it('retorna historico con 12 registros y proyectado con k registros', () => {
      const { historico, proyectado } = calcularProyecciones({
        provincia: 'Catamarca', juego: 'Lotería', k: 2,
      });
      expect(historico).toHaveLength(12);
      expect(proyectado).toHaveLength(2);
    });

    it('las fechas proyectadas son consecutivas y futuras', () => {
      const { historico, proyectado } = calcularProyecciones({
        provincia: 'Neuquén', juego: 'Quiniela', k: 3,
      });
      const lastHist = historico[historico.length - 1].fecha;
      expect(proyectado[0].fecha > lastHist).toBe(true);
      expect(proyectado[1].fecha > proyectado[0].fecha).toBe(true);
      expect(proyectado[2].fecha > proyectado[1].fecha).toBe(true);
    });

    it('la incertidumbre crece con cada mes proyectado', () => {
      const { proyectado } = calcularProyecciones({
        provincia: 'Corrientes', juego: 'Lotería', k: 4,
      });
      // error del mes 4 ≥ error del mes 1 (crece con i * 0.15)
      expect(proyectado[3].error_cantidad).toBeGreaterThanOrEqual(proyectado[0].error_cantidad);
    });

    it('lanza error si la provincia no tiene datos suficientes', () => {
      expect(() =>
        calcularProyecciones({ provincia: 'Inexistente', juego: 'Quiniela', k: 1, n: 3 })
      ).toThrow();
    });
  });
});
