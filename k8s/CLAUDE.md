# k8s/ — Kubernetes Manifests

## Namespace: `betix`

All resources live in the `betix` namespace. Never apply to `default`.

## Structure

```
k8s/
├── namespace.yaml          # betix namespace definition
├── api-deployment.yaml     # Node.js API (src/) — port 3000
├── api-service.yaml
├── core-deployment.yaml    # Python core — port 5000
├── core-service.yaml
├── frontend-deployment.yaml # nginx — port 80
├── frontend-service.yaml
└── ingress.yaml            # path-based routing to all 3 services
```

## Commands

```bash
make k8s-apply    # apply all manifests
make k8s-status   # show pods and services — check this first
make k8s-delete   # remove all resources (destructive!)
```

## Rules

- **Check current state before editing:** `make k8s-status`
- **Never delete the namespace** without explicit instruction — it removes all resources.
- **Resource limits** must be set on all deployments — do not remove them.
- **Ingress changes** affect routing for all three services — test locally first.
- `make k8s-delete` is destructive — always confirm with the user before running.

## Image Tags

Deployments reference ECR image tags. After a release, update the image tag in the relevant `*-deployment.yaml` to match the new version.
