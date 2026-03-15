# terraform/budgets.tf
# ─────────────────────────────────────────────────────────────────────────────
# AWS Budgets — presupuesto anual, mensual y trimestral para el producto betix.
# Los montos se leen desde finops/tagging-taxonomy.yaml vía locals en main.tf.
# Para modificar los montos: editar finops/tagging-taxonomy.yaml y reaplicar.
# ─────────────────────────────────────────────────────────────────────────────

# ── SNS topic para notificaciones de budget ───────────────────────────────────

resource "aws_sns_topic" "finops_alerts" {
  name              = "betix-finops-alerts-${var.environment}"
  kms_master_key_id = "alias/aws/sns"  # AWS managed key — cifrado en reposo sin costo adicional

  tags = {
    Name = "betix-finops-alerts-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "finops_email" {
  topic_arn = aws_sns_topic.finops_alerts.arn
  protocol  = "email"
  endpoint  = local.finops_email
}

# ── Budget mensual ─────────────────────────────────────────────────────────────

resource "aws_budgets_budget" "betix_monthly" {
  name         = "betix-${var.environment}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(local.budget_monthly_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # Filtrar por tag product=betix para aislar costos del producto
  cost_filter {
    name   = "TagKeyValue"
    values = ["product$betix"]
  }

  # Alerta al 70% del presupuesto mensual
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 70
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }

  # Alerta al 80%
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }

  # Alerta al 90%
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }
}

# ── Budget anual ───────────────────────────────────────────────────────────────

resource "aws_budgets_budget" "betix_annual" {
  name         = "betix-${var.environment}-annual"
  budget_type  = "COST"
  limit_amount = tostring(local.budget_annual_usd)
  limit_unit   = "USD"
  time_unit    = "ANNUALLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["product$betix"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 70
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }
}

# ── Budget trimestral ──────────────────────────────────────────────────────────

resource "aws_budgets_budget" "betix_quarterly" {
  name         = "betix-${var.environment}-quarterly"
  budget_type  = "COST"
  limit_amount = tostring(local.budget_quarterly_usd)
  limit_unit   = "USD"
  time_unit    = "QUARTERLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["product$betix"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 70
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.finops_alerts.arn]
    subscriber_email_addresses = [local.finops_email]
  }
}
