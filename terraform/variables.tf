variable "aws_region" {
  description = "Región AWS donde se despliega la infraestructura"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Entorno de despliegue"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "uat", "pro"], var.environment)
    error_message = "El entorno debe ser dev, uat o pro."
  }
}

variable "vpc_cidr" {
  description = "CIDR block de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "eks_cluster_version" {
  description = "Versión de Kubernetes para el clúster EKS"
  type        = string
  default     = "1.31"
}

variable "eks_node_instance_type" {
  description = "Tipo de instancia EC2 para los nodos EKS"
  type        = string
  default     = "t3.small"
}

variable "eks_node_desired" {
  description = "Número deseado de nodos EKS"
  type        = number
  default     = 2
}

variable "eks_node_min" {
  description = "Número mínimo de nodos EKS"
  type        = number
  default     = 1
}

variable "eks_node_max" {
  description = "Número máximo de nodos EKS"
  type        = number
  default     = 3
}

variable "rds_instance_class" {
  description = "Clase de instancia RDS PostgreSQL"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "Almacenamiento asignado a RDS en GB"
  type        = number
  default     = 20
}

variable "rds_password" {
  description = "Contraseña del usuario betix en RDS (sensible — no usar default en producción)"
  type        = string
  sensitive   = true
}

# ── Variables de componente FinOps ─────────────────────────────────────────────
# El tag "component" diferencia los sub-componentes dentro del producto "betix".
# Los demás tags FinOps se leen desde finops/tagging-taxonomy.yaml.

variable "component" {
  description = "Sub-componente del producto (core | api | frontend | shared)"
  type        = string
  default     = "shared"

  validation {
    condition     = contains(["core", "api", "frontend", "shared"], var.component)
    error_message = "El componente debe ser core, api, frontend o shared."
  }
}
