# ── ECR Repositories (uno por componente) ─────────────────────────────────────

locals {
  ecr_repos = ["betix-core", "betix-api", "betix-frontend"]
}

resource "aws_ecr_repository" "betix" {
  for_each = toset(local.ecr_repos)

  name                 = each.key
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = each.key }
}

# ── Lifecycle policy: conservar las últimas 10 imágenes ───────────────────────

resource "aws_ecr_lifecycle_policy" "betix" {
  for_each   = aws_ecr_repository.betix
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Mantener las últimas 10 imágenes"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
