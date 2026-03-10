# Skill: Modify Mock Data

Mock data exists in **two separate copies** that must always stay in sync.

## Files to Edit (always both)

| Layer | Static data | Time-series data |
|-------|------------|-----------------|
| Node.js | `src/data/mockData.js` | `src/data/ticketsPorMes.js` |
| Python | `core/data/mock_data.py` | `core/data/tickets_por_mes.py` |

## Data Shapes

### Static (`mockData` / `mock_data`)
30 records — 10 provinces × 3 games:
```
{ id, provincia, juego, cantidad, ingresos, costo }
```

### Time-series (`ticketsPorMes` / `tickets_por_mes`)
360 records — 10 provinces × 3 games × 12 months (2025-03 to 2026-02):
```
{ fecha: "YYYY-MM", provincia, juego, cantidad, ingresos, costo, beneficio }
```
`beneficio = ingresos - costo` — always derive it, never hardcode independently.

## Checklist

- [ ] Edit `src/data/` file(s)
- [ ] Mirror the exact same change in `core/data/` file(s)
- [ ] Run `make test` to confirm both layers still pass
- [ ] Verify derived field `beneficio` is consistent

## Provinces and Games

Valid values (do not add new ones without updating both layers):

**Provinces (10):** Buenos Aires, Córdoba, Santa Fe, Mendoza, Tucumán, Entre Ríos, Salta, Misiones, Chaco, Corrientes

**Games (3):** Lotería, Quiniela, Raspadita
