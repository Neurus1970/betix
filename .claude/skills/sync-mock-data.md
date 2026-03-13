# Skill: Modify Mock Data

Mock data has **two copies** — always edit both. The Node.js layer (`src/data/`) and the Python core (`core/data/`) must stay in sync.

## Files to Edit

| File | Purpose |
|------|---------|
| `core/data/mock_data.py` | Static snapshot — 28 records (10 provinces × 3 games, Raspadita ausente en Neuquén y La Pampa) |
| `core/data/tickets_por_mes.py` | Time-series — 336 records (28 combos × 12 months) |
| `src/data/` | Copia JS del mock data — debe mantenerse en sync con `core/data/` |

## Data Shapes

### Static (`TICKETS` in `mock_data.py`)
```python
{"id": int, "provincia": str, "juego": str, "cantidad": int, "ingresos": int, "costo": int}
```

### Time-series (`TICKETS_POR_MES` in `tickets_por_mes.py`)
```python
{"fecha": "YYYY-MM", "provincia": str, "juego": str, "cantidad": int, "ingresos": int, "costo": int, "beneficio": int}
```
`beneficio = ingresos - costo` — always derive it, never hardcode independently.

## Valid Values

**Provinces (10 — Tecno Acción):**
Salta, Santiago del Estero, Neuquén, La Pampa, Santa Cruz, La Rioja, Catamarca, Tierra del Fuego, Corrientes, Río Negro

**Games (3):** Quiniela, Lotería, Raspadita

**Combinaciones activas (28):** Raspadita NO está asignada a Neuquén ni a La Pampa.

Do not add new provinces or games without updating both files and the coordinate map in `core/services/geodata_service.py`.

## Checklist

- [ ] Edit `core/data/mock_data.py` (static records)
- [ ] Edit `core/data/tickets_por_mes.py` (time-series records, same change)
- [ ] Edit `src/data/` (JS copy — must mirror core/data/)
- [ ] Verify `beneficio = ingresos - costo` in all modified time-series rows
- [ ] Run `make test` to confirm both `test-core` and `test-api` pass
