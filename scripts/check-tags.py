#!/usr/bin/env python3
"""
check-tags.py — Valida que todos los recursos en un plan de Terraform
                tengan los tags FinOps obligatorios definidos en tagging-taxonomy.yaml.

Uso:
    python3 scripts/check-tags.py <tfplan.json> <tagging-taxonomy.yaml>

Exit codes:
    0 — todos los recursos tienen los tags obligatorios
    1 — hay recursos sin tags obligatorios (falla el CI)
"""
import json
import sys
import yaml


def load_required_tag_keys(taxonomy_path: str) -> list[str]:
    """Lee las claves de tags obligatorios desde el YAML de taxonomía."""
    with open(taxonomy_path) as f:
        taxonomy = yaml.safe_load(f)
    return [t["key"] for t in taxonomy["required_tags"]]


def get_resource_tags(resource_change: dict) -> dict:
    """Extrae los tags de un resource_change del plan JSON."""
    after = resource_change.get("change", {}).get("after", {}) or {}
    # Los tags pueden estar en "tags" o en "tags_all" (incluye default_tags del provider)
    return after.get("tags_all") or after.get("tags") or {}


def validate_plan(plan_path: str, taxonomy_path: str) -> bool:
    """
    Valida que todos los recursos con acción create/update tengan los tags obligatorios.
    Retorna True si todo es válido, False si hay violaciones.
    """
    required_keys = load_required_tag_keys(taxonomy_path)
    print(f"Tags obligatorios: {required_keys}")

    with open(plan_path) as f:
        plan = json.load(f)

    resource_changes = plan.get("resource_changes", [])
    violations = []

    for resource in resource_changes:
        # Solo validar recursos que se van a crear o actualizar
        actions = resource.get("change", {}).get("actions", [])
        if not any(a in actions for a in ["create", "update"]):
            continue

        # Ignorar recursos de datos (data sources) y recursos sin tags (ej: IAM policies)
        resource_type = resource.get("type", "")
        if resource_type.startswith("data.") or resource_type in {
            "aws_iam_role_policy_attachment",
            "aws_iam_policy_attachment",
            "aws_route_table_association",
            "aws_subnet",
        }:
            continue

        tags = get_resource_tags(resource)
        missing = [key for key in required_keys if key not in tags]

        if missing:
            violations.append({
                "resource": resource.get("address", "unknown"),
                "type": resource_type,
                "missing_tags": missing,
            })

    if violations:
        print(f"\n[FALLO] {len(violations)} recurso(s) sin tags obligatorios:\n")
        for v in violations:
            print(f"  Recurso: {v['resource']}")
            print(f"  Tipo:    {v['type']}")
            print(f"  Faltan:  {', '.join(v['missing_tags'])}")
            print()
        print("Agregar los tags faltantes en finops/tagging-taxonomy.yaml o en el resource block.")
        return False

    print(f"\n[OK] todos los {len(resource_changes)} cambios tienen los tags obligatorios.")
    return True


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Uso: {sys.argv[0]} <tfplan.json> <tagging-taxonomy.yaml>")
        sys.exit(1)

    plan_path     = sys.argv[1]
    taxonomy_path = sys.argv[2]

    success = validate_plan(plan_path, taxonomy_path)
    sys.exit(0 if success else 1)
