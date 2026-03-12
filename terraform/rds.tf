# ── RDS PostgreSQL — base de datos de Betix ───────────────────────────────────
#
# Despliega una instancia RDS PostgreSQL 16 en las subnets privadas de la VPC.
# La contraseña se pasa como variable sensible; nunca se hardcodea aquí.
# El security group solo permite acceso desde el node group EKS.

# ── Subnet group ─────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "betix" {
  name       = "betix-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "betix-${var.environment}-db-subnet-group"
  }
}

# ── Security group ────────────────────────────────────────────────────────────

resource "aws_security_group" "rds" {
  name        = "betix-${var.environment}-rds"
  description = "Acceso a RDS PostgreSQL desde el node group EKS"
  vpc_id      = aws_vpc.betix.id

  ingress {
    description     = "PostgreSQL desde nodos EKS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "betix-${var.environment}-rds-sg"
  }
}

# ── Instancia RDS ─────────────────────────────────────────────────────────────

resource "aws_db_instance" "betix" {
  identifier        = "betix-${var.environment}"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage

  db_name  = "betix"
  username = "betix"
  password = var.rds_password

  db_subnet_group_name   = aws_db_subnet_group.betix.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = var.environment == "pro" ? true : false
  publicly_accessible    = false
  skip_final_snapshot    = var.environment != "pro"
  deletion_protection    = var.environment == "pro"

  backup_retention_period = var.environment == "pro" ? 7 : 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  tags = {
    Name = "betix-${var.environment}-postgres"
  }
}
