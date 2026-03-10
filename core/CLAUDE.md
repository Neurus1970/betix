# core/ — Python Flask Microservice

## Purpose

This is where **all business logic lives**. The Node.js layer (`src/`) is a thin proxy — it delegates everything here.

## Entry Point

```bash
python3 -m core.main   # always run as a package, not python core/main.py
```

## Structure

```
core/
├── main.py          # Flask app, route definitions
├── services/        # Business logic (one file per domain)
├── data/            # In-memory mock data (mirrors src/data/ — keep in sync)
└── tests/           # pytest test suite
```

## Rules

- **No class-based views** — plain Flask functions only.
- **PEP 8** — 4-space indent, snake_case everywhere.
- **No mocking of internal modules** in tests — test real logic.
- **Package-relative imports only** — e.g., `from core.services.x import y`.

## SMA Projection Logic

`services/proyecciones_service.py`:
- Window: 3-month rolling average
- Error bands: `std × (1 + 0.15 × month_index)` — grows monotonically
- Applied independently to: `cantidad`, `ingresos`, `costo`, `beneficio`

Do not change the error band formula without updating tests and the Node.js mirror in `src/services/proyeccionesService.js`.

## Tests

```bash
python3 -m pytest core/tests/ -v
python3 -m pytest core/tests/test_<module>.py -v   # single file
```
