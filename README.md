# Betix API

[![Unit Tests](https://img.shields.io/github/actions/workflow/status/Neurus1970/betix/ci.yml?branch=main&label=unit%20tests&logo=jest)](https://github.com/Neurus1970/betix/actions/workflows/ci.yml)
[![Functional Tests](https://img.shields.io/github/actions/workflow/status/Neurus1970/betix/ci.yml?branch=main&label=functional%20tests&logo=cucumber)](https://github.com/Neurus1970/betix/actions/workflows/ci.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Neurus1970_betix&metric=coverage)](https://sonarcloud.io/dashboard?id=Neurus1970_betix)

API de estadísticas de tickets de lotería por provincia y juego, con dashboard interactivo D3.js.

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/healthz` | Verifica que el servicio está activo y que los datos estadísticos son accesibles y estructuralmente válidos. Devuelve `{"status":"healthy"}` (200) o `{"error":"..."}` (500). |
| GET | `/api/datos/geodata` | Combina en una sola respuesta los totales globales del negocio, los datos georreferenciados por provincia (coordenadas + métricas agregadas) y el detalle de cada juego dentro de cada provincia. Fuente única de datos para el dashboard. |

## Página Frontend

| Ruta | Descripción |
|------|-------------|
| `/dashboard-interactivo` | Mapa coroplético + gráfico de torta side-by-side con D3.js. Hover en provincia filtra la torta; click en segmento resalta la provincia. Filtros por juego y métrica (cantidad, importe, beneficio). |

## Desarrollo local

```bash
npm install
npm run dev       # servidor con nodemon en puerto 3000
```

El perfil activo se controla con `NODE_ENV`. Hay un archivo por entorno incluido en el repo:

| `NODE_ENV` | Archivo | Log level | Salida |
|------------|---------|-----------|--------|
| `dev` (default) | `.env.dev` | `debug` | consola |
| `uat` | `.env.uat` | `info` | consola + archivo |
| `pro` | `.env.pro` | `warn` | archivo |

```bash
# Desarrollo local (default)
npm run dev

# UAT
NODE_ENV=uat npm run dev

# Producción
NODE_ENV=pro npm start
```

Todas las variables usan el prefijo `BETIX_`. Ver `.env.example` para la referencia completa.

## Tests

```bash

npm test                # Jest + Cucumber
npm run test:functional # Solo Cucumber en modo verbose
npm run test:ci         # Solo Jest con cobertura (para CI)
npm run lint            # ESLint
```

## Pipeline CI/CD

Cada Pull Request hacia `main` ejecuta automáticamente:
1. **Lint** — Verificación de estilo de código (ESLint)
2. **Tests** — Jest con cobertura + reporte JUnit
3. **SonarCloud** — Análisis de calidad y security hotspots
4. **AI Review** — Revisión automática y documentación generada por Claude

Al crear un branch con código de ticket (ej. `feature/BETIX-7-...`) el ticket Jira pasa a **In Progress** automáticamente. Al hacer merge de la PR pasa a **Done**.
