# Hook: Pre-Edit Infrastructure

**Trigger:** Before editing any file under `terraform/` or `k8s/`

**Action:** STOP and confirm with the user before proceeding.

---

**WARNING: You are about to modify infrastructure.**

- `terraform/` → AWS resources (EKS cluster, ECR, VPC). Changes may incur costs or cause downtime.
- `k8s/` → Kubernetes manifests in the `betix` namespace. Misconfigurations can take down running services.

**Required before editing:**

1. Confirm the user has explicitly approved this change.
2. Understand which resources will be affected.
3. For Terraform: never run `terraform apply` without a prior `terraform plan` review.
4. For K8s: check current state first with `make k8s-status`.

**Never:**
- Run `terraform apply` autonomously
- Run `kubectl delete` on production resources
- Modify `namespace.yaml` without explicit instruction
