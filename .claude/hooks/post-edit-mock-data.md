# Hook: Post-Edit Mock Data

**Trigger:** After editing any file under `core/data/`

**Action:** Run both test suites to verify data consistency.

```bash
make test-core   # pytest — validates Python data shape and derived fields
make test-api    # Jest + Cucumber — validates proxy responses against the data
```

**Why:** `core/data/` is the single source of truth for mock data. The Node.js layer proxies the core — there is no separate JS copy. Any change here affects both layers.

**Checklist:**
- [ ] `beneficio` = `ingresos - costo` in all time-series records (never hardcode independently)
- [ ] `make test-core` passes
- [ ] `make test-api` passes
