from ..data.mock_data import TICKETS

REQUIRED_FIELDS = {
    "id":        int,
    "provincia": str,
    "juego":     str,
    "cantidad":  int,
    "ingresos":  int,
    "costo":     int,
}


def check_data_access() -> None:
    if not isinstance(TICKETS, list) or len(TICKETS) == 0:
        raise RuntimeError("No se pudieron cargar los datos estadísticos")

    for idx, ticket in enumerate(TICKETS):
        for field, expected_type in REQUIRED_FIELDS.items():
            if field not in ticket:
                raise RuntimeError(
                    f'Datos corruptos: campo "{field}" faltante en el registro {idx}'
                )
            if not isinstance(ticket[field], expected_type):
                raise RuntimeError(
                    f'Datos corruptos: campo "{field}" inválido en el registro {idx} '
                    f"(esperado {expected_type.__name__}, recibido {type(ticket[field]).__name__})"
                )
