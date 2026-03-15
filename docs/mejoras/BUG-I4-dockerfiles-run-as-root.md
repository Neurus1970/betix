---
id: BUG-I4
area: infra
archivo: Dockerfile, core/Dockerfile, frontend/Dockerfile
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-I4 — Los Dockerfiles corren los procesos como `root`

## Descripción

Los tres Dockerfiles del proyecto (`Dockerfile` para Node.js API, `core/Dockerfile` para Flask, `frontend/Dockerfile` para nginx) no crean un usuario no-root ni usan la instrucción `USER`. Todos los procesos corren como `root` dentro del contenedor.

Esto es un riesgo de seguridad conocido: si un atacante logra ejecutar código arbitrario dentro del contenedor (por ejemplo, a través de una vulnerabilidad en la aplicación), tiene permisos de root sobre el sistema de archivos del contenedor y sobre cualquier volumen montado.

Adicionalmente, ninguno de los Dockerfiles tiene instrucción `HEALTHCHECK`, lo que significa que Docker no puede verificar si la aplicación dentro del contenedor está funcionando correctamente (solo si el proceso sigue corriendo).

## Comportamiento actual

```dockerfile
# core/Dockerfile — sin USER, sin HEALTHCHECK
FROM python:3.12-slim
WORKDIR /app
COPY core/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY core/ .
EXPOSE 5000
CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0"]
```

## Comportamiento esperado

```dockerfile
FROM python:3.12-slim
WORKDIR /app

COPY core/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY core/ .

# Crear usuario no-root y cambiar ownership
RUN addgroup --system betix && adduser --system --ingroup betix betix
RUN chown -R betix:betix /app
USER betix

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0"]
```

## Por qué importa

El principio de mínimo privilegio es uno de los pilares de la seguridad en contenedores. Un proceso que no necesita ser root no debería serlo. Esto reduce el radio de impacto de una vulnerabilidad explotada.

Además, la instrucción `HEALTHCHECK` en el Dockerfile permite que `docker run` y Docker Compose reporten el estado de salud del contenedor correctamente, incluso fuera del contexto de un `docker-compose.yml` con healthchecks definidos.

## Qué demuestra al alumno

- El principio de mínimo privilegio aplicado a contenedores.
- Las instrucciones `addgroup`, `adduser`, `chown` y `USER` en Dockerfiles.
- La diferencia entre el `HEALTHCHECK` en el Dockerfile y el `healthcheck` en `docker-compose.yml`.
- Por qué los Dockerfiles deben ser seguros por defecto, no por configuración del orquestador.
