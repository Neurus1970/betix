terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Descomenta para usar backend remoto con S3 + DynamoDB (recomendado para equipos)
  # backend "s3" {
  #   bucket         = "betix-terraform-state"
  #   key            = "betix/terraform.tfstate"
  #   region         = var.aws_region
  #   dynamodb_table = "betix-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "betix"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Data sources ───────────────────────────────────────────────────────────────

data "aws_availability_zones" "available" {
  state = "available"
}
