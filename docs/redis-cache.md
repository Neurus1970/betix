# Caché Redis en Betix

## Resumen

La capa de caché está implementada **solo en el servicio Node.js/Express** (`src/`). El servicio Python/Flask (`core/`) no cachea — siempre computa sus respuestas.

El caché es **opcional**: si `REDIS_URL` no está definida, todo el sistema funciona en modo _pass-through_ sin ningún error.

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `src/config.js` | Lee `REDIS_URL` y `CACHE_TTL` del entorno |
| `src/cache.js` | Cliente Redis + funciones `get` / `set` |
| `src/middleware/cacheMiddleware.js` | Middleware Express que intercepta requests/responses |
| `src/routes/geodata.js` | Aplica el middleware en `GET /api/datos/geodata` |
| `src/routes/proyectado.js` | Aplica el middleware en `GET /api/datos/proyectado` |
| `src/routes/mapaBurbujas.js` | Aplica el middleware en `GET /api/datos/mapa-burbujas` |
| `docker-compose.yml` | Define el servicio `redis:7-alpine` y pasa `REDIS_URL` al contenedor `api` |
| `k8s/redis-deployment.yaml` | Deployment de Redis en Kubernetes (namespace `betix`) |
| `k8s/redis-service.yaml` | Service K8s que expone Redis en el puerto 6379 |
| `tests/cache.test.js` | Tests unitarios del módulo y del middleware |

---

## Flujo completo de una request

```
Cliente HTTP
    │
    ▼
Express (src/app.js)
    │  monta /api/datos con los routers
    │
    ▼
cacheMiddleware (src/middleware/cacheMiddleware.js)
    │
    ├─ ¿REDIS_URL no definida? ──► next() directamente (pass-through)
    │
    ├─ Construye clave: "betix:<path>:<query_params_ordenados>"
    │   Ej: "betix:/api/datos/geodata:juego=Quiniela"
    │
    ├─ cache.get(key) ──► Redis GET
    │       │
    │       ├─ HIT ──► res.json(cached)  — el controller nunca se ejecuta
    │       │
    │       └─ MISS
    │               │
    │               ▼
    │         Monkey-patch de res.json:
    │         antes de devolver la respuesta al cliente,
    │         guarda el dato en Redis (cache.set)
    │               │
    │               ▼
    │         next()  →  Controller  →  llama a core (Python/Flask)
    │                                        │
    │                                        ▼
    │                                  Respuesta fresca
    │                                        │
    │                                        ▼
    │                               res.json(data)
    │                               [interceptado → Redis SET con TTL]
    │                                        │
    ▼                                        ▼
Cliente recibe JSON                   clave guardada en Redis
```

---

## Detalles de cada módulo

### `src/config.js` — Variables de entorno

```js
const REDIS_URL  = process.env.REDIS_URL  || null;   // null = caché desactivado
const CACHE_TTL  = parseInt(process.env.CACHE_TTL || '60', 10);  // segundos
```

El perfil de entorno se carga según `NODE_ENV` → mapea a `.env.dev`, `.env.uat` o `.env.pro`.

### `src/cache.js` — Cliente Redis

- Usa la librería **ioredis** con `lazyConnect: true`.
- Si `REDIS_URL` es `null`, `client` queda en `null` y todas las operaciones son no-op.
- `get(key)` → devuelve el objeto parseado o `null` (nunca lanza).
- `set(key, value, ttl)` → serializa a JSON y hace `SET key value EX ttl` (nunca lanza).
- Exporta `isEnabled` (booleano) para que el middleware haga el _fast path_ sin crear Promises.

### `src/middleware/cacheMiddleware.js` — Interceptor

**Fast path** (sin Redis): `if (!cache.isEnabled) return next()` — síncrono, sin overhead.

**Construcción de clave** (con Redis):
```js
const sortedQuery = Object.keys(req.query).sort().map(k => `${k}=${req.query[k]}`).join('&');
const key = `betix:${req.path}:${sortedQuery}`;
```
Los query params se ordenan para que `?a=1&b=2` y `?b=2&a=1` sean la misma clave.

**HIT**: responde directamente con `res.json(cached)`. El controller no se ejecuta.

**MISS**: monkey-patch de `res.json` — cuando el controller finalmente llame a `res.json(data)`, primero se persiste en Redis y luego se envía al cliente.

**Degradación**: cualquier error de Redis en `get` o `set` es capturado y loggeado; la request sigue su curso normal.

### Rutas que usan caché

Los tres endpoints de datos aplican el middleware como segundo argumento:

```js
// src/routes/geodata.js
router.get('/geodata', cacheMiddleware, getDatos);

// src/routes/proyectado.js
router.get('/proyectado', cacheMiddleware, getProyectado);

// src/routes/mapaBurbujas.js
router.get('/mapa-burbujas', cacheMiddleware, getDatos);
```

El endpoint `/health` **no** usa caché.

---

## Configuración por entorno

### Local (docker-compose)

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  api:
    environment:
      REDIS_URL: "redis://redis:6379"
      CACHE_TTL: "60"
    depends_on:
      redis:
        condition: service_healthy
```

El servicio `api` espera a que Redis responda `PING` antes de arrancar.

### Kubernetes (`betix` namespace)

**`k8s/redis-deployment.yaml`** — un Pod con `redis:7-alpine`, liveness y readiness probe via `redis-cli ping`.

**`k8s/redis-service.yaml`** — Service ClusterIP que expone el puerto `6379` dentro del cluster. El `api-deployment` apunta a `redis://redis:6379`.

---

## Comportamiento cuando Redis no está disponible

| Escenario | Resultado |
|---|---|
| `REDIS_URL` no definida | `cache.isEnabled = false`, middleware hace `next()` directamente |
| Redis caído después de arrancar | `ioredis` emite evento `error` (loggeado). `get`/`set` fallan silenciosamente → requests se sirven directo desde `core` |
| Redis lento | El `.catch` del middleware llama a `next()` — el request no queda colgado |

El sistema **nunca falla por culpa de Redis**: si la caché no está disponible, la aplicación responde normalmente con datos frescos.

---

## Tests

`tests/cache.test.js` cubre dos grupos:

1. **Módulo cache sin Redis** (`REDIS_URL` no definida en tests):
   - `cache.get` devuelve `null`
   - `cache.set` resuelve sin error

2. **Middleware en modo pass-through**:
   - La request llega al controller correctamente
   - Los errores del `core` (502) siguen propagándose
   - Los query params se reenvían al `core` sin modificar
   - El body de la respuesta no se altera

Para ejecutarlos: `npm test` o `npx jest tests/cache.test.js`.
