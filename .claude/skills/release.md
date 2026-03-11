# Skill: Release a New Version

Betix usa **Release Please** para versionado semántico automatizado. Las releases se generan automáticamente al hacer merge a `main`.

## Flujo normal (automatizado)

```
feature/BETIX-XX  →  develop   (PR normal, CI igual que siempre)
                         ↓
         develop  →  main       (PR de release)
                         ↓
    Release Please abre PR automático:
    "chore: release betix-api 1.2.0"
                         ↓
    Revisar CHANGELOG y mergear
                         ↓
    GitHub Release + tags creados automáticamente
```

Release Please detecta qué servicios cambiar según los paths de los commits:
- Cambios en `src/` → bumps `betix-api`
- Cambios en `core/` → bumps `betix-core`
- Cambios en `frontend/` → bumps `betix-frontend`

## Qué tipo de commit genera qué bump

| Tipo | Bump |
|------|------|
| `feat:` | minor (0.X.0) |
| `fix:` | patch (0.0.X) |
| `refactor:`, `docs:`, `chore:` | ninguno (aparece en CHANGELOG) |
| `BREAKING CHANGE:` en el body | major (X.0.0) |

## Bump manual de emergencia

Solo usar si Release Please no está disponible o hay un problema bloqueante:

```bash
make bump-api      v=X.Y.Z   # actualiza src/VERSION y package.json
make bump-core     v=X.Y.Z   # actualiza core/VERSION
make bump-frontend v=X.Y.Z   # actualiza frontend/VERSION
```

> ⚠️ Después de un bump manual, actualizar `.release-please-manifest.json` con los mismos valores para que Release Please no intente re-bumpear.

## Tags de bootstrap (solo primera vez)

Si se reinicia el estado del manifest, crear los tags base en `main` antes del primer run:

```bash
git tag betix-core-v1.1.0 origin/main
git tag betix-api-v1.1.0 origin/main
git tag betix-frontend-v1.0.0 origin/main
git push origin betix-core-v1.1.0 betix-api-v1.1.0 betix-frontend-v1.0.0
```
