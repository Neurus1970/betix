"""
Betix — Arquitectura Kubernetes (minikube)

Genera: docs/diagrams/betix_k8s.png
Uso:    python3 docs/diagrams/architecture_k8s.py
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.client import User
from diagrams.k8s.network import Ingress, Service
from diagrams.k8s.compute import Deployment

graph_attr = {
    "fontsize": "13",
    "bgcolor": "white",
    "pad": "0.6",
}

with Diagram(
    "Betix · Kubernetes (minikube)",
    filename="docs/diagrams/betix_k8s",
    show=False,
    graph_attr=graph_attr,
    direction="LR",
):
    browser = User("Browser\nbetix.local")

    with Cluster("Namespace: betix"):
        ingress = Ingress("ingress\nbetix.local")

        with Cluster("frontend"):
            fe_svc  = Service("svc :80")
            fe_dep  = Deployment("nginx\n(estáticos)")
            fe_svc >> fe_dep

        with Cluster("api"):
            api_svc = Service("svc :3000")
            api_dep = Deployment("Node.js\n(thin proxy)")
            api_svc >> api_dep

        with Cluster("core"):
            core_svc = Service("svc :5000")
            core_dep = Deployment("Flask\n(lógica)")
            core_svc >> core_dep

    browser >> Edge(label="HTTP") >> ingress
    ingress >> Edge(label="/") >> fe_svc
    ingress >> Edge(label="/api/*\n/healthz") >> api_svc
    api_dep >> Edge(label="HTTP interno") >> core_svc
