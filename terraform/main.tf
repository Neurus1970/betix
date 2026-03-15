terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend remoto (S3 + DynamoDB) — activar antes de trabajar en equipo con AWS real.
  # backend "s3" {
  #   bucket         = "betix-terraform-state"
  #   key            = "betix/terraform.tfstate"
  #   region         = var.aws_region
  #   dynamodb_table = "betix-terraform-locks"
  #   encrypt        = true
  # }
}

# ── Leer taxonomía FinOps — fuente única de verdad ────────────────────────────
# Consume finops/tagging-taxonomy.yaml para tags obligatorios y montos de budget.
# Para regenerar ese archivo: ./scripts/init-repo.sh --finops-* (ver el YAML para más detalles)
locals {
  finops = yamldecode(file("${path.root}/../finops/tagging-taxonomy.yaml"))

  # Extraer valores de tags de la estructura required_tags del YAML
  _tags_map = { for t in local.finops.required_tags : t.key => t.value if t.value != null }

  # Los 5 tags obligatorios FinOps — aplicados a TODOS los recursos vía default_tags
  finops_tags = {
    product       = local._tags_map["product"]
    environment   = var.environment
    owner         = local._tags_map["owner"]
    "cost-center" = local._tags_map["cost-center"]
    created-by    = local._tags_map["created-by"]
  }

  # Valores de budget para el entorno actual
  budget_monthly_usd = local.finops.budgets[var.environment].monthly_usd
  budget_annual_usd  = local.finops.budgets[var.environment].annual_usd
  budget_weekly_usd  = local.finops.budgets[var.environment].weekly_usd
  finops_email       = local.finops.alerts.channels.email
  alert_thresholds   = local.finops.alerts.thresholds
}

provider "aws" {
  region = var.aws_region

  # default_tags aplica los 5 tags FinOps obligatorios a TODOS los recursos AWS.
  # No es necesario repetirlos en cada resource block — se heredan automáticamente.
  default_tags {
    tags = local.finops_tags
  }
}

# ── Data sources ───────────────────────────────────────────────────────────────

data "aws_availability_zones" "available" {
  state = "available"
}
