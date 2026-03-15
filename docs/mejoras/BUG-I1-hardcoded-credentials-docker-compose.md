---
id: BUG-I1
area: infra
archivo: docker-compose.yml
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-I1 — Credenciales hardcodeadas en `docker-compose.yml` sin explicación ni alternativa

## Descripción

`docker-compose.yml` define las credenciales de PostgreSQL directamente en el archivo:

```yaml
environment:
  POSTGRES_DB:       betix
  POSTGRES_USER:     betix
  POSTGRES_PASSWORD: betix
```

El archivo está versionado en el repositorio. Las credenciales de desarrollo son triviales (`betix/betix`) y esto es intencional para el entorno local, pero el archivo no tiene ningún comentario que explique:

1. **Por qué** está hardcodeado (entorno local educativo, no producción).
2. **Cómo** se manejan las credenciales en producción (variables de entorno en el pipeline / secrets de Kubernetes).
3. **Qué** patrón usar si alguien quiere sobreescribir los valores localmente (archivo `.env`).

Un developer sin experiencia puede replicar este patrón en un proyecto real.

## Comportamiento esperado

Comentarios en el archivo que contextualicen la decisión:

```yaml
environment:
  # DESARROLLO LOCAL ÚNICAMENTE — credenciales triviales intencionales
  # En producción: usar secrets de Kubernetes (k8s/postgres-secret.yaml)
  # o variables de entorno inyectadas por el pipeline de CI/CD.
  # Para sobrescribir localmente: crear archivo .env en la raíz del proyecto.
  POSTGRES_DB:       ${BETIX_DB_NAME:-betix}
  POSTGRES_USER:     ${BETIX_DB_USER:-betix}
  POSTGRES_PASSWORD: ${BETIX_DB_PASS:-betix}
```

Y un archivo `.env.example` en la raíz:

```bash
# .env.example — copiar a .env para sobrescribir valores locales
# NUNCA commitear .env (está en .gitignore)
BETIX_DB_NAME=betix
BETIX_DB_USER=betix
BETIX_DB_PASS=betix
```

## Por qué importa

El curso enseña "La plataforma se clona". Un developer que clona el repo y ve credenciales hardcodeadas sin contexto aprende que ese es el patrón correcto. El `.env.example` + la sintaxis `${VAR:-default}` de Docker Compose es la forma estándar de manejar esta situación.

## Qué demuestra al alumno

- El patrón `${VAR:-default}` en Docker Compose: configurable por variable de entorno, con fallback seguro para desarrollo.
- La diferencia entre configuración de desarrollo y de producción.
- Por qué `.env` está en `.gitignore` pero `.env.example` no.
- Cómo los secrets de Kubernetes reemplazan las variables de entorno en producción.
