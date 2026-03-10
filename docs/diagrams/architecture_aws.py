"""
Betix — Arquitectura AWS (EKS + ECR + VPC)

Generado desde terraform/: vpc.tf, eks.tf, ecr.tf
Genera: docs/diagrams/betix_aws.png
Uso:    python3 docs/diagrams/architecture_aws.py
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.client import User
from diagrams.onprem.inmemory import Redis
from diagrams.aws.network import VPC, PublicSubnet, PrivateSubnet, NATGateway, InternetGateway, ELB, RouteTable
from diagrams.aws.compute import EKS, ECR
from diagrams.aws.security import IAM
from diagrams.k8s.network import Ingress, Service
from diagrams.k8s.compute import Deployment

graph_attr = {
    "fontsize": "13",
    "bgcolor": "white",
    "pad": "0.8",
    "splines": "ortho",
}

with Diagram(
    "Betix · AWS (EKS + ECR + VPC)",
    filename="docs/diagrams/betix_aws",
    show=False,
    graph_attr=graph_attr,
    direction="LR",
):
    user = User("Browser\n(Internet)")

    with Cluster("AWS us-east-1"):
        with Cluster("IAM Roles"):
            iam_cluster = IAM("betix-eks-cluster\n(AmazonEKSClusterPolicy)")
            iam_nodes   = IAM("betix-eks-nodes\n(WorkerNode + CNI\n+ ECRReadOnly)")

        with Cluster("VPC betix-dev  10.0.0.0/16"):
            igw = InternetGateway("Internet\nGateway")
            alb = ELB("ALB\n(Ingress)")

            with Cluster("Subnets Públicas\n(AZ-1 10.0.0.0/24 / AZ-2 10.0.1.0/24)"):
                nat = NATGateway("NAT Gateway\n+ EIP")

            with Cluster("Subnets Privadas\n(AZ-1 10.0.10.0/24 / AZ-2 10.0.11.0/24)"):
                with Cluster("EKS Cluster  betix-dev  k8s 1.31"):
                    eks = EKS("Control Plane")

                    with Cluster("Node Group  t3.small\n(desired=2  min=1  max=3)"):
                        ing  = Ingress("Ingress\nbetix.local")

                        with Cluster("frontend"):
                            fe = Deployment("nginx")

                        with Cluster("api"):
                            api = Deployment("Node.js\nproxy")

                        with Cluster("core"):
                            core = Deployment("Flask\ncore")

                        with Cluster("redis"):
                            redis = Redis("Redis\n(caché)")

        with Cluster("ECR  (lifecycle: keep 10 images)"):
            ecr_core     = ECR("betix-core")
            ecr_api      = ECR("betix-api")
            ecr_frontend = ECR("betix-frontend")

    user  >> Edge(label="HTTPS") >> igw >> alb >> ing
    ing   >> fe
    ing   >> api
    api   >> Edge(label="cache get/set", style="dashed") >> redis
    api   >> Edge(label="cache miss") >> core
    nat   >> Edge(label="pull images", style="dashed") >> ecr_core
    nat   >> Edge(style="dashed") >> ecr_api
    nat   >> Edge(style="dashed") >> ecr_frontend
    iam_cluster >> Edge(style="dashed") >> eks
    iam_nodes   >> Edge(style="dashed") >> ing
