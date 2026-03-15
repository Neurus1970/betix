# FinOps Tagging Strategy — Betix

## Por qué importa el tagging

El tagging de recursos AWS es la base de la visibilidad de costos FinOps. Sin tags consistentes no es posible:

- Saber qué recursos pertenecen a qué producto o entorno
- Generar reportes de costo por componente (core, api, frontend)
- Configurar alertas de presupuesto basadas en etiquetas
- Distribuir costos entre centros de costo financieros

Betix sigue la práctica **Cost Allocation** de la [FinOps Foundation](https://www.finops.org/framework/capabilities/cost-allocation/): todos los recursos deben tener tags obligatorios antes de ser aprovisionados.

---

## Fuente única de verdad

El archivo `finops/tagging-taxonomy.yaml` es la única fuente de verdad para la taxonomía de tags. Tanto Terraform como los workflows de CI/CD leen este archivo, lo que garantiza que los valores sean siempre consistentes:

```
finops/tagging-taxonomy.yaml
        │
        ├── terraform/main.tf       (yamldecode — default_tags del provider)
        ├── terraform/budgets.tf    (montos de presupuesto via locals)
        └── .github/workflows/      (validación via yq + check-tags.py)
```

Este archivo **no es un secret** — es configuración de gobierno que se versiona en el repositorio igual que el código de producción.

---

## Los 5 tags obligatorios

| Tag | Descripción | Valor en Betix | Quién lo establece |
|-----|-------------|----------------|-------------------|
| `product` | Nombre del producto | `betix` | `tagging-taxonomy.yaml` |
| `environment` | Entorno de despliegue | `dev` / `uat` / `prod` | `var.environment` en Terraform |
| `owner` | Equipo responsable | `platform-team` | `tagging-taxonomy.yaml` |
| `cost-center` | Centro de costo financiero | `CC-001` | `tagging-taxonomy.yaml` |
| `created-by` | Herramienta que creó el recurso | `terraform` | `tagging-taxonomy.yaml` |

Todos los recursos AWS heredan estos tags automáticamente via `default_tags` en el provider de AWS. No es necesario repetirlos en cada `resource` block.

### Tag opcional: `component`

Para diferenciar costos entre los tres sub-componentes de Betix, se puede pasar la variable `var.component` al hacer `terraform apply`:

```bash
terraform apply -var="component=core"
terraform apply -var="component=api"
terraform apply -var="component=frontend"
```

El valor por defecto es `shared` (recursos compartidos como VPC, EKS, RDS).

---

## Cómo Terraform consume el YAML

En `terraform/main.tf`, el bloque `locals` lee el YAML y construye el mapa de tags:

```hcl
locals {
  finops = yamldecode(file("${path.root}/../finops/tagging-taxonomy.yaml"))

  _tags_map = { for t in local.finops.required_tags : t.key => t.value if t.value != null }

  finops_tags = {
    product       = local._tags_map["product"]
    environment   = var.environment
    owner         = local._tags_map["owner"]
    "cost-center" = local._tags_map["cost-center"]
    created-by    = local._tags_map["created-by"]
  }
}
```

El `provider "aws"` aplica esos tags a todos los recursos via `default_tags`:

```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.finops_tags
  }
}
```

### Modificar valores de tags

1. Editar `finops/tagging-taxonomy.yaml`
2. Ejecutar `terraform plan` para ver el impacto
3. Ejecutar `terraform apply` tras revisar y aprobar el plan
4. Abrir PR — el workflow `validate-tags.yml` validará los tags automáticamente

---

## Sistema de alertas de presupuesto

Los presupuestos se definen en `finops/tagging-taxonomy.yaml` bajo la clave `budgets`, con tres granularidades:

| Entorno | Mensual | Anual | Semanal |
|---------|---------|-------|---------|
| `dev`   | $200    | $2400 | $60     |
| `uat`   | $500    | $6000 | $150    |
| `prod`  | $2000   | $24000| $600    |

Terraform crea tres recursos `aws_budgets_budget` (mensual, anual, semanal) por entorno. Cada uno dispara alertas al 70%, 80% y 90% del límite mediante SNS + email.

Las alertas van a la dirección configurada en `alerts.channels.email` del YAML. Para agregar Slack, descomentar `slack_webhook` y configurar el secret `FINOPS_SLACK_WEBHOOK` en GitHub.

### Recursos creados en `terraform/budgets.tf`

- `aws_sns_topic.finops_alerts` — topic SNS por entorno
- `aws_sns_topic_subscription.finops_email` — suscripción email
- `aws_budgets_budget.betix_monthly` — presupuesto mensual con 3 notificaciones
- `aws_budgets_budget.betix_annual` — presupuesto anual con 3 notificaciones
- `aws_budgets_budget.betix_weekly` — presupuesto semanal con 3 notificaciones

Los budgets filtran por `TagKeyValue: product$betix`, lo que aísla los costos de Betix del resto de la cuenta AWS.

---

## Validación en CI/CD

El workflow `.github/workflows/validate-tags.yml` se ejecuta en cada PR que toca `terraform/` o `finops/`. Pasos:

1. Ejecuta `terraform plan -var="environment=dev"` y exporta el plan como JSON
2. Lee los tags requeridos desde el YAML via `yq`
3. Ejecuta `scripts/check-tags.py` para validar que todos los recursos en el plan tienen los 5 tags

El script `scripts/check-tags.py` inspecciona `tags_all` (que incluye los `default_tags` del provider) para cada recurso con acción `create` o `update`. Si algún recurso tiene tags faltantes, el CI falla con un mensaje descriptivo.

### Ejecutar la validación localmente

```bash
# Requiere: terraform, python3, pyyaml, yq
pip install pyyaml

cd terraform
terraform init -backend=false
terraform plan -var="environment=dev" -out=tfplan.binary
terraform show -json tfplan.binary > tfplan.json
cd ..

python3 scripts/check-tags.py terraform/tfplan.json finops/tagging-taxonomy.yaml
```

---

## Generar o regenerar el YAML via init-repo.sh

El script `scripts/init-repo.sh` incluye un paso (Paso 7) que genera `finops/tagging-taxonomy.yaml` con los valores pasados como flags:

```bash
./scripts/init-repo.sh \
  --repo Neurus1970/betix \
  --jira-project BETIX \
  --jira-url https://cristian-f-medrano.atlassian.net \
  --ci-checks test-core,lint-and-test \
  --finops-product betix \
  --finops-owner platform-team \
  --finops-cost-center CC-001 \
  --finops-email finops@tecnoaccion.com \
  --finops-budget-monthly-dev 200 \
  --finops-budget-monthly-uat 500 \
  --finops-budget-monthly-prod 2000
```

Si no se pasan los flags `--finops-*`, el script omite el Paso 7 y no modifica el archivo existente.

---

## Conexión con los principios fundamentales de Betix

Esta estrategia de tagging implementa el principio de **"La plataforma es el repositorio"** (`docs/principios-fundamentales.md`): la configuración de gobierno FinOps vive en el repositorio, se versiona, se revisa en PR, y se aplica automáticamente via CI/CD. No hay configuración manual en la consola de AWS que pueda divergir del estado declarado en el código.

El flujo completo es:

```
Editar tagging-taxonomy.yaml
        → PR a develop
        → validate-tags.yml valida el plan Terraform
        → merge a main
        → release.yml construye y pushea imágenes
        → terraform apply aplica los cambios de infraestructura
```
