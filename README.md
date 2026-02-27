# Betix API

API de estadísticas de tickets de lotería por provincia y juego.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/api/estadisticas/provincia` | Tickets, ingresos y rentabilidad por provincia |
| GET | `/api/estadisticas/juego` | Tickets, ingresos y rentabilidad por juego |
| GET | `/api/estadisticas/resumen` | Resumen general consolidado |

## Ejemplo de respuesta `/api/estadisticas/provincia`

```json
{
  "status": "ok",
  "data": [
    {
      "provincia": "Buenos Aires",
      "totalTickets": 45600,
      "totalIngresos": 1507000,
      "totalCosto": 1030000,
      "rentabilidad": 31.65
    }
  ]
}
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

## Pipeline CI/CD

Cada Pull Request hacia `main` ejecuta automáticamente:
1. **Lint** - Verificación de estilo de código (ESLint)
2. **Tests** - Suite completa con Jest + reporte de cobertura
3. **SonarCloud** - Análisis de calidad y security hotspots
4. **AI Review** - Revisión automática y documentación generada por Claude
