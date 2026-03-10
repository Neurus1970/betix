# Caché

El middleware de caché (`src/middleware/cacheMiddleware.js`) se interpone antes de cada request al core Python. La decisión de ir por caché o no pasa por tres puntos, en orden de ejecución:

---

## 1. ¿Está Redis habilitado?

`src/cache.js:41` + `src/middleware/cacheMiddleware.js:17`

```js
// cache.js:41 — se evalúa una sola vez al arrancar
const isEnabled = !!REDIS_URL;
```

```js
// cacheMiddleware.js:17 — primera línea del middleware
if (!cache.isEnabled) return next();
```

Si `REDIS_URL` no está definida, el middleware termina acá. La request va directo al controller sin ningún overhead de Promise.

---

## 2. ¿Hay datos en Redis para esta clave?

`src/middleware/cacheMiddleware.js:26-30`

```js
cache.get(key).then((cached) => {
  if (cached) {                        // ← HIT
    logger.info(`Cache HIT [${key}]`);
    return res.json(cached);           // responde desde Redis, controller no se ejecuta
  }
  // ...                               // ← MISS → sigue al controller
```

La clave incluye el path y los query params ordenados alfabéticamente, por lo que `/api/datos/geodata?juego=Quiniela` y `?juego=Lotería` son entradas separadas. En caso de HIT el core Python nunca se invoca; en caso de MISS se continúa al controller y la respuesta queda guardada en Redis al finalizar.

---

## 3. ¿El cliente Redis está activo en runtime?

`src/cache.js:22` y `src/cache.js:33`

```js
// get — cache.js:22
async function get(key) {
  if (!client) return null;   // ← Redis se cayó después de arrancar → null = MISS forzado
  ...
}

// set — cache.js:33
async function set(key, value, ttl) {
  if (!client) return;        // ← no guarda, pero tampoco rompe nada
  ...
}
```

Este tercer punto cubre el caso donde Redis arrancó bien (`isEnabled = true`) pero se desconectó en runtime. `get` devuelve `null`, el middleware lo trata como MISS y la request sigue normalmente hacia el core sin interrumpir el servicio.
