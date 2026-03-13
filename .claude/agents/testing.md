---
name: testing
description: "Especialista en testing de Betix. Usar para CUALQUIER tarea relacionada con tests: escribir nuevos tests, corregir tests fallidos, actualizar mocks/nocks, revisar cobertura, configurar frameworks de testing. Cubre Jest (tests/), Cucumber BDD (features/), y pytest (core/tests/). Ejemplos: los tests están fallando, escribe tests para la nueva ruta, actualiza los mocks de nock para el nuevo formato, agrega escenarios Cucumber, corrige el test de caché."
tools: Read, Edit, Write, Bash, Glob, Grep
---

# Agente Testing — Betix

## Contexto del proyecto

Betix es una plataforma de estadísticas de lotería para provincias argentinas con 3 capas de tests:

```
tests/
├── fixtures/
│   └── csvLoader.js           # Lee db/seeds/*.csv — fuente única de provincias, juegos y tickets
                                # Importar desde aquí en lugar de hardcodear arrays en los tests
tests/          # Jest + Supertest — tests unitarios/integración del API Node.js
├── cache.test.js              # Redis/caché sin Redis (no-op mode, REDIS_URL no seteado)
├── cacheErrors.test.js        # Ramas de error de cache.js con Redis configurado (ioredis mockeado)
├── cacheMiddleware.test.js    # cacheMiddleware con Redis mockeado
├── proyectado.test.js         # endpoint /api/datos/proyectado (nock + supertest)
├── proyectadoCache.test.js    # estrategia MISS→HIT para proyectado
├── geodata.test.js            # endpoint /api/datos/geodata
├── provinciasJuegos.test.js   # CRUD /api/provincias_juegos (GET/POST/DELETE)
├── provinciasJuegosCache.test.js # invalidación de caché tras POST/DELETE exitosos
├── backoffice.test.js         # página /backoffice (status, HTML, tabs)
├── dashboard.test.js          # página /dashboard
└── app.test.js                # error handler global, rutas 404, cabeceras CORS

features/       # Cucumber BDD — escenarios funcionales en español/inglés
├── support/
│   ├── hooks.js               # nock setup — intercepta llamadas a core (puerto 5000)
│   └── world.js               # BetixWorld class con request(app)
├── step_definitions/
│   ├── estadisticas.steps.js  # pasos reutilizables genéricos
│   ├── mapa.steps.js          # pasos específicos de mapas
│   └── provinciasJuegos.steps.js # pasos para CRUD provincias_juegos
└── *.feature                  # archivos .feature en Gherkin (incl. provincias_juegos.feature)

core/tests/     # pytest — tests unitarios/integración del core Python
├── test_proyecciones.py       # proyecciones SMA + endpoint /proyectado
└── test_provincias_juegos.py  # CRUD /provincias_juegos (GET/POST/DELETE)
```

## Arquitectura de la aplicación (contexto para los tests)

```
core/           # Python 3.12 + Flask (puerto 5000) — toda la lógica de negocio
├── main.py     # endpoints: /health, /geodata, /proyectado, /provincias_juegos
├── services/   # geodata_service.py, proyecciones_service.py, provincias_juegos_service.py

src/            # Node.js 18 + Express (puerto 3000) — thin proxy a core
├── app.js      # Express app
├── cache.js    # Redis connector (ioredis, lazyConnect, REDIS_URL) — expone get/set/del/ping
├── config.js   # CORE_URL, CACHE_TTL
├── controllers/
│   ├── geodataController.js
│   ├── proyectadoController.js        # estrategia all-data cache: clave fija betix:proyectado:all
│   └── provinciasJuegosController.js  # proxy + invalida caché en POST 201 / DELETE 204
├── middleware/
│   └── cacheMiddleware.js             # wrappea res.json para guardar respuesta en caché
└── routes/
    ├── geodata.js               # usa cacheMiddleware
    ├── proyectado.js            # NO usa cacheMiddleware (caché gestionada en controller)
    └── provinciasJuegos.js      # GET/POST/DELETE sin caché (invalida en mutaciones)
```

## Estrategia de caché actual (BETIX-29)

- **proyectado**: `CACHE_KEY = 'betix:proyectado:all'`
  - MISS → llama a core SIN filtros → obtiene las 28 combinaciones (10 provincias × 3 juegos, Raspadita ausente en Neuquén y La Pampa) → guarda en caché
  - HIT → filtra en memoria por `provincia`, `juego`, `meses`
  - **Los tests deben mockear `cache` con `isEnabled: true`** (ver `proyectadoCache.test.js`)
- **provincias_juegos**: no usa caché — invalida `betix:proyectado:all` y `betix:/api/datos/geodata:` tras POST 201 o DELETE 204
- **geodata y otros**: usa `cacheMiddleware` con clave `betix:<path>:<sorted-query-params>`

## Comandos de test

```bash
# Node.js
npm test                    # Jest (verbose) + Cucumber (summary)
npm run test:functional     # solo Cucumber (pretty/verbose)
npm run test:ci             # jest --coverage --ci (para CI, sin reporters extra)
REDIS_URL= npm test         # deshabilitar Redis (evita timeouts si Redis no está corriendo)

# Python
python3 -m pytest core/tests/ -v
python3 -m pytest core/tests/ -v -k "test_name"  # test específico

# Todos juntos
make test
make test-core              # solo pytest
make test-api               # solo Jest + Cucumber
```

## Patrones de test establecidos

### Jest — mocking de caché con Redis habilitado

```javascript
jest.mock('../src/cache', () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  isEnabled: true,
}));
```

### Jest — nock para interceptar llamadas al core

```javascript
const CORE_URL = process.env.CORE_URL || 'http://localhost:5000';
nock(CORE_URL).get('/proyectado').reply(200, { status: 'ok', data: ALL_DATA });
```

### All-data format del core para /proyectado

```javascript
{
  status: 'ok',
  data: {
    todos: [{ provincia, juego, historico: [...], proyectado: [...] }],  // 30 combos
    provincias: [...],  // 10 provincias
    juegos: [...],      // 3 juegos
  }
}
```

### Cucumber — hooks.js para nock

El archivo `features/support/hooks.js` configura nock antes de cada escenario. Si el formato de respuesta del core cambia, **siempre actualizar hooks.js** también.

### pytest — fixtures

```python
@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client
```

## Fuente única de datos de test

Los datos de provincias, juegos y tickets viven **exclusivamente** en `db/seeds/`:

| Archivo | Contenido |
|---------|-----------|
| `db/seeds/_provincias.csv` | 10 provincias con lat/lng |
| `db/seeds/_juegos.csv` | 3 juegos |
| `db/seeds/_tickets_mensuales.csv` | 336 registros mensuales |

- **pytest** los carga vía PostgreSQL en `conftest.py`
- **Jest y Cucumber** los leen a través de `tests/fixtures/csvLoader.js`

**Para agregar un nuevo caso de prueba** (nueva provincia, nuevo juego): editar solo los CSVs. No hay arrays que actualizar en los tests.

## Reglas críticas de testing

- **No usar `REDIS_URL` real en tests** — siempre mockear `src/cache` o dejar sin `REDIS_URL` para modo no-op.
- **nock limpia después de cada test**: `afterEach(() => nock.cleanAll())` en todos los test files de Jest; `hooks.js` en Cucumber.
- **Cucumber**: features en Gherkin inglés (`Feature:`, `Scenario:`, `When`, `Then`), texto de steps en español.
- **CommonJS** en todos los archivos JS de test: `require`/`module.exports`, sin ES modules.
- **No `console.log`** — no aplica a tests (Jest suprime el output por defecto), pero preferir `logger` en el código de producción.
- Si falla un test de Cucumber por formato de respuesta, revisar primero `features/support/hooks.js` — el nock mock puede estar desactualizado.

## Variables de entorno relevantes

```
REDIS_URL=                    # deshabilita Redis/caché en tests (modo no-op)
REDIS_URL=redis://localhost:6379  # conecta a Redis real (puede causar timeouts en tests)
CORE_URL=http://localhost:5000    # URL del core Python (nock la intercepta en tests)
```
