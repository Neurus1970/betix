---
id: BUG-I5
area: infra
archivo: k8s/api-deployment.yaml, k8s/core-deployment.yaml, k8s/frontend-deployment.yaml
prioridad: alta
complejidad: baja
impacto_didactico: muy alto
parent_ticket: BETIX-47
---

# BUG-I5 — Los manifiestos de Kubernetes usan el tag `latest` en contradicción con el pipeline de versionado

## Descripción

Los tres deployments de Kubernetes referencian las imágenes con el tag `latest`:

```yaml
# k8s/api-deployment.yaml
containers:
  - name: api
    image: <account>.dkr.ecr.<region>.amazonaws.com/betix-api:latest
```

El curso enseña —en el Capítulo 8 y en `CLAUDE.md`— que el pipeline de CI genera tags SHA para branches de desarrollo y tags semver para releases:

| Tag | Cuándo se genera |
|-----|-----------------|
| `1.3.0` | release estable (merge a `main`) |
| `sha-abc1234` | builds de `develop`/`feature` |
| `latest` | apunta al último release estable |

Los manifiestos usan `latest`, lo que significa que Kubernetes no puede saber qué versión exacta está corriendo. Si se hace un rollback o se deploya una versión específica, el manifest dice `latest` pero el pod puede estar corriendo `sha-abc1234` o `1.2.0`. La trazabilidad que el curso enseña queda rota.

## Comportamiento esperado

Los manifiestos deben usar el tag correspondiente al ambiente:

```yaml
# Para producción (release)
image: <account>.dkr.ecr.<region>.amazonaws.com/betix-api:1.3.0

# Para staging (SHA del commit)
image: <account>.dkr.ecr.<region>.amazonaws.com/betix-api:sha-abc1234
```

En la práctica, los manifiestos de producción suelen tener el tag actualizado como parte del pipeline de release (Release Please, Argo CD, o un script de deploy).

## Por qué importa (principio fundacional)

> *"El tag de ECR que corre en producción es trazable hasta el SHA del commit."* — Principio 4

Un manifest con `latest` rompe la cadena de trazabilidad: no se puede saber qué commit está corriendo en producción con solo mirar el manifest.

## Consideración didáctica

Los manifiestos con `latest` son una simplificación válida para el entorno educativo de minikube. Lo que falta es un comentario explícito que documente la decisión y explique por qué en producción real se usaría un tag específico.

## Qué demuestra al alumno

- Por qué `latest` es un anti-patrón en Kubernetes de producción.
- Cómo el tag de la imagen conecta el manifest de K8s con el pipeline de CI y el SHA del commit.
- El concepto de "imagen inmutable": cada build genera un tag único e irrepetible.
- Cómo Argo CD, Flux y herramientas similares automatizan la actualización del tag en el manifest.
