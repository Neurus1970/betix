# Caché Redis — Betix API

## Por qué se implementó

El core Python (Flask) recalcula las estadísticas en cada petición: agrega registros, aplica filtros, calcula proyecciones SMA. Para endpoints que no cambian entre llamadas (datos estáticos o semi-estáticos), este procesamiento se repite innecesariamente.

Redis actúa como una capa de caché delante del core: la primera llamada procesa y almacena el resultado; las siguientes lo sirven directamente desde memoria, sin tocar el core.

---

## Arquitectura de la caché

```
Cliente → Node.js API → [cache HIT] → devuelve respuesta desde Redis
                      → [cache MISS] → core Flask → almacena en Redis → devuelve respuesta
```

La caché vive en la capa **Node.js** (proxy), no en el core. Esto mantiene el principio de que toda la lógica de negocio reside en Python, mientras que Node.js gestiona cross-cutting concerns como caché, CORS y routing.

---

## Implementación

### `src/cache.js`

Módulo wrapper sobre `ioredis`. Exporta tres elementos:

| Export | Tipo | Descripción |
|--------|------|-------------|
| `get(key)` | `async fn` | Obtiene un valor de Redis. Devuelve `null` si no existe o si Redis no está configurado. |
| `set(key, value, ttl)` | `async fn` | Almacena un valor con TTL en segundos. No-op si Redis no está configurado. |
| `isEnabled` | `boolean` | `true` solo si `REDIS_URL` está definida en el entorno. |

El cliente Redis se inicializa con `lazyConnect: true`: la conexión se establece en background al arrancar el servidor, sin bloquear el inicio.

### `src/middleware/cacheMiddleware.js`

Middleware Express que se aplica a todas las rutas `/api/datos/*`.

**Flujo:**

1. Si `cache.isEnabled` es `false` → llama `next()` síncronamente (sin overhead de Promise).
2. Construye la clave de caché: `betix:<path>:<query-params-ordenados>`.
   Los query params se ordenan para que `/geodata?juego=Quiniela&prov=Salta` y `?prov=Salta&juego=Quiniela` sean la misma entrada.
3. `cache.get(key)` → si hay HIT: devuelve la respuesta cacheada directamente.
4. Si hay MISS: intercepta `res.json` para capturar la respuesta antes de enviarla, la almacena en Redis con el TTL configurado, y llama `next()`.

**Degradación elegante:** cualquier error de Redis (timeout, conexión perdida) es logueado y la petición continúa hacia el core sin interrumpir el flujo.

### Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `REDIS_URL` | `null` | URL de conexión. Si no está definida, la caché está deshabilitada. Ej: `redis://redis:6379` |
| `CACHE_TTL` | `60` | Tiempo de vida de las entradas en segundos. |

### Clave de caché

```
betix:/api/datos/geodata:juego=Quiniela&provincia=Salta
```

Formato: `betix:<path>:<query-string con params ordenados alfabéticamente>`.

---

## Infraestructura

### docker-compose (local)

Redis corre como servicio `redis:7-alpine` en el puerto `6379`. El servicio `api` depende del healthcheck de Redis antes de arrancar.

```yaml
redis:
  image: redis:7-alpine
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
```

### Kubernetes

Dos manifests en `k8s/`:

- `k8s/redis-deployment.yaml` — Deployment con imagen `redis:7-alpine`, liveness y readiness probes via `redis-cli ping`.
- `k8s/redis-service.yaml` — ClusterIP en puerto `6379`, accesible como `redis://redis:6379` dentro del namespace `betix`.

El deployment del API (`k8s/api-deployment.yaml`) recibe las variables `REDIS_URL` y `CACHE_TTL` como env vars.

---

## Tests

Los tests de Jest corren **sin Redis** (`REDIS_URL` no está definida en el entorno de test). `cache.isEnabled` es `false`, por lo que:

- El middleware llama `next()` síncronamente → comportamiento idéntico al estado sin caché.
- `cache.get` devuelve `null`, `cache.set` es no-op.

El archivo `tests/cache.test.js` verifica:

| Test | Qué verifica |
|------|-------------|
| `cache.get` devuelve null sin Redis | No hay cliente → null |
| `cache.set` no lanza error sin Redis | No-op seguro |
| Middleware pasa al controller sin caché | Pass-through correcto |
| Middleware retorna 502 si el core falla | El catch del controller maneja el error |
| Query params se reenvían al core | Sin transformación de params |
| Body de la respuesta no se modifica | El middleware no altera los datos |
