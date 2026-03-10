# Skill: Modify Mock Data

Mock data lives exclusively in `core/data/` — the single source of truth. The Node.js layer has no local copy; it proxies all data from the Python core.

## Files to Edit

| File | Purpose |
|------|---------|
| `core/data/mock_data.py` | Static snapshot — 30 records (10 provinces × 3 games) |
| `core/data/tickets_por_mes.py` | Time-series — 360 records (10 provinces × 3 games × 12 months) |

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

Do not add new provinces or games without updating both files and the coordinate map in `core/services/geodata_service.py`.

## Checklist

- [ ] Edit `core/data/mock_data.py` (static records)
- [ ] Edit `core/data/tickets_por_mes.py` (time-series records, same change)
- [ ] Verify `beneficio = ingresos - costo` in all modified time-series rows
- [ ] Run `make test` to confirm both `test-core` and `test-api` pass
