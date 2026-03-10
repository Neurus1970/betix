# terraform/ — AWS Infrastructure

## WARNING: Real Infrastructure

Changes here affect live AWS resources. **Always confirm with the user before making any edits.**

## What This Manages

| File | Resource |
|------|----------|
| `vpc.tf` | VPC, subnets, routing |
| `eks.tf` | EKS cluster (Kubernetes) |
| `ecr.tf` | ECR repositories (Docker images) |
| `variables.tf` | Input variables |
| `outputs.tf` | Output values |

## Required Workflow

```bash
terraform init      # only needed once or after provider changes
terraform plan      # ALWAYS review before apply
terraform apply     # only after explicit user approval of the plan
```

## Rules

- **Never run `terraform apply` autonomously.** Always show the plan first and wait for approval.
- **Never destroy resources** without explicit instruction — data loss is irreversible.
- Changes to `eks.tf` can cause cluster downtime.
- Changes to `ecr.tf` can break the Docker build pipeline (`build.yml`).

## State

Terraform state is remote. Do not manually edit or delete state files.
