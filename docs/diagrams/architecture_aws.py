"""
Betix — Arquitectura AWS (EKS + ECR + VPC)

Genera: docs/diagrams/betix_aws.png
Uso:    python3 docs/diagrams/architecture_aws.py
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.client import User
from diagrams.aws.network import VPC, PublicSubnet, PrivateSubnet, NATGateway, InternetGateway, ELB
from diagrams.aws.compute import EKS, ECR
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
        with Cluster("VPC betix-dev  10.0.0.0/16"):
            igw = InternetGateway("Internet\nGateway")
            alb = ELB("ALB\n(Ingress)")

            with Cluster("Subnets Públicas\n(AZ-1 / AZ-2)"):
                nat = NATGateway("NAT\nGateway")

            with Cluster("Subnets Privadas\n(AZ-1 / AZ-2)"):
                with Cluster("EKS Cluster  betix-dev"):
                    eks = EKS("Control Plane")

                    with Cluster("Node Group  t3.small"):
                        ing  = Ingress("Ingress\nbetix.local")

                        with Cluster("frontend"):
                            fe = Deployment("nginx")

                        with Cluster("api"):
                            api = Deployment("Node.js\nproxy")

                        with Cluster("core"):
                            core = Deployment("Flask\ncore")

        with Cluster("ECR"):
            ecr_core     = ECR("betix-core")
            ecr_api      = ECR("betix-api")
            ecr_frontend = ECR("betix-frontend")

    user  >> Edge(label="HTTPS") >> igw >> alb >> ing
    ing   >> fe
    ing   >> api  >> core
    nat   >> Edge(label="pull images", style="dashed") >> ecr_core
    nat   >> Edge(style="dashed") >> ecr_api
    nat   >> Edge(style="dashed") >> ecr_frontend
