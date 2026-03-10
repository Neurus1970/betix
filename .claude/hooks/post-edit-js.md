# Hook: Post-Edit JavaScript

**Trigger:** After editing any file under `src/` or `tests/`

**Action:** Run ESLint to catch style violations immediately.

```bash
npm run lint
```

**Why:** ESLint enforces single quotes, semicolons, no `console` calls, and no unused vars. Catching violations at edit time avoids CI failures.

**If lint fails:** Fix the reported issues before committing. Common violations:
- `console.log` → replace with `logger.info()` / `logger.error()`
- Missing semicolons
- Unused variables
