"""
Betix — Arquitectura local (docker-compose)

Genera: docs/diagrams/betix_local.png
Uso:    python3 docs/diagrams/architecture_local.py
"""

from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.client import User
from diagrams.onprem.network import Nginx
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.database import PostgreSQL
from diagrams.programming.language import NodeJS, Python

graph_attr = {
    "fontsize": "14",
    "bgcolor": "white",
    "pad": "0.5",
}

with Diagram(
    "Betix · Arquitectura Local (docker-compose)",
    filename="docs/diagrams/betix_local",
    show=False,
    graph_attr=graph_attr,
    direction="LR",
):
    browser = User("Browser\n:8080")

    with Cluster("docker-compose"):
        with Cluster("frontend  :80"):
            nginx = Nginx("nginx\n(estáticos)")

        with Cluster("api  :3000"):
            api = NodeJS("Node.js\n(thin proxy)")

        with Cluster("redis  :6379"):
            redis = Redis("Redis\n(caché TTL 60s)")

        with Cluster("core  :5000"):
            core = Python("Flask\n(lógica de negocio)")

        with Cluster("db  :5432"):
            db = PostgreSQL("PostgreSQL 16\n(betix schema)")

    browser >> Edge(label="HTTP :8080") >> nginx
    nginx >> Edge(label="/api/*  proxy_pass") >> api
    api >> Edge(label="cache get/set", style="dashed") >> redis
    api >> Edge(label="HTTP :5000 (cache miss)") >> core
    core >> Edge(label="SQL queries") >> db
