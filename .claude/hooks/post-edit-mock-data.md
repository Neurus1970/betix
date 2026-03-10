# Hook: Post-Edit Mock Data

**Trigger:** After editing any file under `src/data/` or `core/data/`

**Action:** Verify the sibling copy was also updated.

| If you edited... | Also check... |
|-----------------|--------------|
| `src/data/mockData.js` | `core/data/mock_data.py` |
| `src/data/ticketsPorMes.js` | `core/data/tickets_por_mes.py` |
| `core/data/mock_data.py` | `src/data/mockData.js` |
| `core/data/tickets_por_mes.py` | `src/data/ticketsPorMes.js` |

**Why:** Both layers serve the same data. Divergence causes test failures and inconsistent API responses.

**Checklist:**
- [ ] Both copies reflect the same change
- [ ] `beneficio` = `ingresos - costo` in all time-series records
- [ ] `make test` passes on both `test-api` and `test-core`
