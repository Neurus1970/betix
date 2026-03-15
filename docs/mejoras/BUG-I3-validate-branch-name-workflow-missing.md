---
id: BUG-I3
area: infra
archivo: .github/workflows/validate-branch-name.yml (ARCHIVO INEXISTENTE)
prioridad: critica
complejidad: baja
impacto_didactico: muy alto
parent_ticket: BETIX-47
---

# BUG-I3 — El workflow `validate-branch-name.yml` está documentado pero no existe

## Descripción

El Capítulo 7 del curso de onboarding (`docs/onboarding/modulos/7.md`) documenta un mecanismo de enforcement de nombres de rama en dos niveles:

1. **Hook local**: `.claude/hooks/scripts/pre-bash.sh` — bloquea la creación de ramas con nombre inválido cuando Claude ejecuta el comando.
2. **GitHub Actions**: `validate-branch-name.yml` — valida el nombre de la rama en cada PR. Si no cumple el patrón, el check falla y el PR no puede mergearse.

El hook local existe y funciona. El workflow de GitHub Actions **no existe**. La tabla de recursos del Capítulo 7 lista el archivo como un recurso del repositorio, pero el archivo no está en `.github/workflows/`.

## Impacto

- La documentación describe un enforcement de dos niveles, pero solo el primer nivel existe.
- Un alumno puede crear una rama con nombre inválido, pushearla, abrir un PR y mergearlo sin que ningún check de CI falle.
- El Principio 3 queda ejemplificado a medias: la plataforma dice que enforcea la calidad automáticamente, pero el enforcement más visible (el check de GitHub) no existe.

## Patrón esperado del workflow

```yaml
# .github/workflows/validate-branch-name.yml
name: Validate branch name

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Check branch name
        run: |
          BRANCH="${{ github.head_ref }}"
          PATTERN="^(feature|fix|refactor|hotfix)/BETIX-[0-9]+-[a-z0-9-]+$"
          if [[ ! "$BRANCH" =~ $PATTERN ]]; then
            echo "❌ Nombre de rama inválido: $BRANCH"
            echo "Formato requerido: <prefix>/BETIX-XX-descripcion-kebab-case"
            echo "Prefijos válidos: feature/, fix/, refactor/, hotfix/"
            exit 1
          fi
          echo "✅ Nombre de rama válido: $BRANCH"
```

## Por qué es crítico

Este es el ejemplo más directo de contradicción entre lo que el curso enseña y lo que la plataforma hace. El Capítulo 7 muestra un diagrama que describe este workflow como el "guardián final" del naming. Un alumno que entiende el sistema y revisa el repositorio descubrirá que el guardián no existe.

## Qué demuestra al alumno

- Cómo crear un workflow de GitHub Actions que valida condiciones de PR.
- El uso de `github.head_ref` para acceder al nombre de la rama en un PR.
- Regex en bash con `[[ $VAR =~ $PATTERN ]]`.
- La importancia de cerrar la brecha entre lo que se documenta y lo que existe: la documentación que no coincide con el código es mentira.
