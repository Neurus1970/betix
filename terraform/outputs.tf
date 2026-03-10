output "eks_cluster_name" {
  description = "Nombre del clúster EKS"
  value       = aws_eks_cluster.betix.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint del API server de EKS"
  value       = aws_eks_cluster.betix.endpoint
}

output "eks_cluster_version" {
  description = "Versión de Kubernetes del clúster"
  value       = aws_eks_cluster.betix.version
}

output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.betix.id
}

output "ecr_urls" {
  description = "URLs de los repositorios ECR"
  value       = { for k, v in aws_ecr_repository.betix : k => v.repository_url }
}

output "kubeconfig_command" {
  description = "Comando para configurar kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.betix.name}"
}
