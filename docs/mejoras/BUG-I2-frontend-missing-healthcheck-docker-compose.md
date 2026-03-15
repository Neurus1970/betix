---
id: BUG-I2
area: infra
archivo: docker-compose.yml
prioridad: baja
complejidad: baja
impacto_didactico: medio
parent_ticket: BETIX-47
---

# BUG-I2 — El servicio `frontend` no tiene healthcheck en `docker-compose.yml`

## Descripción

Todos los servicios en `docker-compose.yml` tienen un bloque `healthcheck` configurado:

- `db`: healthcheck con `pg_isready`
- `redis`: healthcheck con `redis-cli ping`
- `core`: healthcheck con `curl /health`
- `api`: healthcheck con `curl /healthz`

El único servicio sin healthcheck es `frontend` (nginx). Esto significa que Docker Compose marca el contenedor como `Up` en cuanto el proceso arranca, sin verificar que nginx esté sirviendo contenido correctamente.

## Comportamiento esperado

```yaml
frontend:
  # ...
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:80/"]
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 5s
```

## Por qué importa (didáctica)

El patrón de healthcheck en todos los servicios es uno de los ejemplos más claros del Principio 1 (fronteras como contratos estructurales): cada componente declara si está listo, en lugar de que el orquestador asuma que sí.

La inconsistencia —4 de 5 servicios con healthcheck— puede hacer creer a un alumno que el healthcheck es opcional o que `frontend` no lo necesita. La realidad es que nginx puede fallar al arrancar por un error de configuración, y sin healthcheck ese error es invisible para el orquestador.

## Qué demuestra al alumno

- La consistencia como principio: si 4 de 5 servicios tienen healthcheck, el 5to también debería tenerlo.
- Cómo el healthcheck de nginx difiere del de las APIs: curl a la raíz en lugar de a un endpoint `/health`.
- Por qué Docker Compose `depends_on: condition: service_healthy` requiere que el servicio dependiente tenga healthcheck.
