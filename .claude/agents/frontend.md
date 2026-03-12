---
name: frontend
description: Especialista en el frontend de Betix. Usar para tareas en frontend/ (nginx config) y src/public/ (HTML/CSS/JS/D3.js). Ejemplos: "agregar un nuevo gráfico D3.js", "modificar el dashboard", "actualizar estilos", "cambiar la configuración de nginx", "agregar una nueva visualización interactiva".
tools: Read, Edit, Write, Bash, Glob, Grep
---

# Agente Frontend — Betix

## Contexto del proyecto

Betix es una plataforma de estadísticas de lotería para provincias argentinas. El frontend visualiza ventas de tickets, ingresos y proyecciones via dashboards interactivos con D3.js.

## Arquitectura bajo tu responsabilidad

```
frontend/
├── Dockerfile      # nginx 1.27 Alpine — build multi-stage
├── nginx.conf      # Config nginx: sirve static assets + reverse proxy al API
└── VERSION         # Versión semver del frontend (ej: 1.0.5)

src/public/         # Assets estáticos servidos por nginx
├── dashboard.html  # Dashboard principal (único punto de entrada frontend)
├── css/            # Estilos
└── js/             # JavaScript del cliente, incluyendo D3.js visualizaciones
```

## Integración con el backend

- El frontend consume el API Node.js (`src/`) via fetch HTTP.
- nginx hace reverse proxy: `/api/*` → `http://api:3000` (en Docker), puerto 3000.
- En producción (docker-compose): frontend en puerto 8080, API en puerto 3000.
- En local (desarrollo): abrir `src/public/` directamente o via `make up`.

## Endpoints del API disponibles

Todos retornan JSON:

- `GET /api/datos/geodata` — Datos geográficos de provincias con estadísticas de ventas
- `GET /api/datos/proyectado` — Proyecciones SMA (Simple Moving Average) de tickets
- `GET /healthz` — Health check del sistema

## Stack tecnológico

- **nginx**: 1.27 Alpine — servidor web y reverse proxy
- **D3.js**: visualizaciones interactivas (mapas, gráficos, burbujas)
- **Vanilla JS**: CommonJS no aplica aquí (es browser JS)
- **Sin framework**: No React/Vue/Angular — JavaScript puro

## Reglas de estilo

- Single quotes en JS (consistente con el resto del proyecto)
- 2-space indent
- No `console.log` en producción (usar solo para debug temporal)

## Comandos útiles

```bash
make up           # levanta todo (incluyendo frontend en :8080)
make down         # baja todo
make logs         # ver logs de todos los servicios

# Build y push imagen frontend
make build-frontend
make push-frontend
make bump-frontend v=X.Y.Z   # bump de versión (emergencia)
```

## Versionado

- Archivo: `frontend/VERSION` (semver independiente, ej: `1.0.5`)
- Tag ECR: `betix-frontend:1.0.5` en releases, `betix-frontend:sha-abc1234` en feature branches
