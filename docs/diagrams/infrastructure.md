# Diagramas de Infraestructura — Betix

Diagramas expresados en **Mermaid**, versionados junto al código. Se renderizan automáticamente en GitHub.

---

## Local — docker-compose

Representa los contenedores corriendo en la máquina del developer: **nginx** sirve los estáticos y proxea `/api/*` hacia el **API Node.js**, que delega la lógica al **core Flask**. Redis actúa como caché entre el proxy y el core. PostgreSQL persiste los datos del schema `betix`.

```mermaid
flowchart LR
    Browser["Browser\n:8080"]

    subgraph dc["docker-compose"]
        subgraph fe["frontend  :80"]
            nginx["nginx\n(estáticos)"]
        end
        subgraph api["api  :3000"]
            nodejs["Node.js\n(thin proxy)"]
        end
        subgraph cache["redis  :6379"]
            redis["Redis\n(caché TTL 60s)"]
        end
        subgraph core["core  :5000"]
            flask["Flask\n(lógica de negocio)"]
        end
        subgraph db["db  :5432"]
            pg["PostgreSQL 16\n(betix schema)"]
        end
    end

    Browser -->|"HTTP :8080"| nginx
    nginx -->|"/api/*  proxy_pass"| nodejs
    nodejs -. "cache get/set" .-> redis
    nodejs -->|"HTTP :5000 (cache miss)"| flask
    flask -->|"SQL queries"| pg
```

---

## Kubernetes — minikube

El mismo stack desplegado en un cluster Kubernetes local. Un **Ingress** enruta el tráfico por path hacia los **Services**, cada uno respaldado por un **Deployment** independiente dentro del namespace `betix`.

```mermaid
flowchart LR
    Browser["Browser\nbetix.local"]

    subgraph ns["Namespace: betix"]
        Ingress["Ingress\nbetix.local"]

        subgraph fe["frontend"]
            fe_svc["Service :80"]
            fe_dep["nginx (estáticos)"]
            fe_svc --> fe_dep
        end

        subgraph api["api"]
            api_svc["Service :3000"]
            api_dep["Node.js (thin proxy)"]
            api_svc --> api_dep
        end

        subgraph core["core"]
            core_svc["Service :5000"]
            core_dep["Flask (lógica)"]
            core_svc --> core_dep
        end

        subgraph redis["redis"]
            redis_svc["Service :6379"]
            redis_dep["Redis (caché)"]
            redis_svc --> redis_dep
        end

        subgraph db["db"]
            db_svc["Service :5432"]
            db_dep["PostgreSQL 16\n(betix schema)"]
            db_svc --> db_dep
        end
    end

    Browser -->|"HTTP"| Ingress
    Ingress -->|"/"| fe_svc
    Ingress -->|"/api/*  /healthz"| api_svc
    api_dep -. "cache get/set" .-> redis_svc
    api_dep -->|"HTTP interno (cache miss)"| core_svc
    core_dep -->|"SQL queries"| db_svc
```

---

## AWS — EKS + ECR + RDS + VPC

Despliegue productivo en AWS: **VPC** con subnets públicas (ALB + NAT Gateway) y privadas (EKS + RDS). Las imágenes se almacenan en tres repositorios **ECR** independientes con política de retención de las últimas 10 versiones.

```mermaid
flowchart LR
    User["Browser\n(Internet)"]

    subgraph aws["AWS us-east-1"]
        subgraph iam["IAM Roles"]
            iam_cluster["betix-eks-cluster\nEKSClusterPolicy"]
            iam_nodes["betix-eks-nodes\nWorkerNode + CNI + ECRReadOnly"]
        end

        subgraph vpc["VPC betix-dev  10.0.0.0/16"]
            IGW["Internet Gateway"]
            ALB["ALB (Ingress)"]

            subgraph public["Subnets Públicas  AZ-1 10.0.0.0/24  /  AZ-2 10.0.1.0/24"]
                NAT["NAT Gateway + EIP"]
            end

            subgraph private["Subnets Privadas  AZ-1 10.0.10.0/24  /  AZ-2 10.0.11.0/24"]
                subgraph eks["EKS  betix-dev  k8s 1.31"]
                    subgraph ng["Node Group  t3.small  desired=2  min=1  max=3"]
                        Ing["Ingress"]
                        fe["nginx"]
                        api["Node.js proxy"]
                        core["Flask core"]
                        redis_k["Redis (caché)"]
                    end
                end
                RDS["RDS PostgreSQL 16\ndb.t3.micro\nbetix schema"]
            end
        end

        subgraph ecr["ECR  lifecycle: keep 10 images"]
            ecr_core["betix-core"]
            ecr_api["betix-api"]
            ecr_frontend["betix-frontend"]
        end
    end

    User -->|"HTTPS"| IGW --> ALB --> Ing
    Ing --> fe
    Ing --> api
    api -. "cache get/set" .-> redis_k
    api -->|"cache miss"| core
    core -->|"SQL queries"| RDS
    NAT -. "pull images" .-> ecr_core
    NAT -.-> ecr_api
    NAT -.-> ecr_frontend
    iam_cluster -.-> eks
    iam_nodes -.-> ng
```
