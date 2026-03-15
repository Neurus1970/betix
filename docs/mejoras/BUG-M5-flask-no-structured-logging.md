---
id: BUG-M5
area: microservicios
archivo: core/main.py, core/services/
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-M5 — `core` Flask no tiene logging estructurado: los errores son invisibles en los logs

## Descripción

El servicio Node.js tiene logging estructurado con Winston (con niveles, timestamps y metadata en JSON). El servicio `core` Flask no tiene ningún logging: los errores solo aparecen como respuestas HTTP (códigos 4xx/5xx), pero no dejan ningún registro en los logs del contenedor.

Cuando `core` falla internamente —error de conexión a la base de datos, excepción en un service, datos inesperados—, el único rastro es la respuesta HTTP que recibe Node.js. No hay stacktrace, no hay mensaje de error, no hay timestamp en los logs de `docker compose logs core`.

## Comportamiento actual

Si un endpoint Flask lanza una excepción no capturada, Flask devuelve un 500 al cliente pero no loggea nada estructurado. En los logs del contenedor solo aparece el log de acceso HTTP de werkzeug:

```
127.0.0.1 - - [14/Mar/2026 18:22:09] "GET /proyectado HTTP/1.1" 500 -
```

No hay información sobre qué falló, en qué línea, ni con qué datos.

## Comportamiento esperado

```
2026-03-14T18:22:09 ERROR core.services.proyecciones: get_proyectado failed
  provinciaId=99, error=list index out of range
  Traceback (most recent call last):
    File "core/services/proyecciones_service.py", line 34, in get_proyectado
      ...
```

## Implementación mínima en Flask

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# En un service:
try:
    resultado = calcular_proyeccion(data)
except Exception as e:
    logger.exception(f"get_proyectado error: {e}")
    return {'error': 'Error interno'}, 500
```

## Por qué importa (principio fundacional)

> *"Si no está en los logs, no pasó."* — Capítulo 10

Node.js tiene Winston configurado y documentado en el curso. Flask, el servicio donde vive toda la lógica de negocio, no tiene ningún equivalente. El Capítulo 10 enseña observabilidad pero solo cubre un lado del sistema.

## Qué demuestra al alumno

- Cómo configurar `logging` en Python/Flask con el módulo estándar.
- La asimetría entre el logging de Node.js y Flask, y cómo resolverla.
- Cómo `logger.exception()` incluye automáticamente el stacktrace completo.
- La diferencia entre un log de acceso HTTP y un log de error de aplicación.
