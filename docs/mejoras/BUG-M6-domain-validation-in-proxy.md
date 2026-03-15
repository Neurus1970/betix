---
id: BUG-M6
area: microservicios
archivo: src/controllers/provinciasJuegosController.js
prioridad: baja
complejidad: baja
impacto_didactico: medio
parent_ticket: BETIX-47
---

# BUG-M6 — Validación de dominio en el proxy Node.js: el chequeo de entero vive en el lugar equivocado

## Descripción

`provinciasJuegosController.js` valida que `provinciaId` sea un entero antes de reenviar la request a `core`. Esta es una validación de dominio —saber qué valores son válidos para `provinciaId` es conocimiento del negocio— y según el Principio 1, toda lógica de negocio debe vivir en `core/`.

El proxy puede validar que el parámetro *existe* y que *tiene el tipo básico correcto* (es un string, no está vacío), pero decidir si es un entero válido o si corresponde a una provincia real es responsabilidad de `core`.

## Comportamiento actual

```js
// src/controllers/provinciasJuegosController.js
const provinciaId = parseInt(req.params.id, 10);
if (isNaN(provinciaId)) {
  return res.status(400).json({ error: 'provinciaId debe ser un número entero' });
}
```

## Comportamiento esperado

La validación de dominio debe ocurrir en Flask. Node.js solo verifica presencia del parámetro:

```js
// Node.js: solo verifica que el param existe
const { id } = req.params;
if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });

// Reenvía a core — core valida si es un ID válido
const upstream = await fetch(`${CORE_URL}/provincias/${id}/juegos`);
```

Y en Flask:

```python
@app.route('/provincias/<provincia_id>/juegos')
def get_provincia_juegos(provincia_id):
    try:
        pid = int(provincia_id)
    except ValueError:
        return {'error': 'provinciaId debe ser un número entero'}, 400
```

## Por qué importa

La diferencia es sutil pero importante para el principio: si mañana la regla de validación cambia (por ejemplo, se acepta un código alfanumérico como `"SAL"` en lugar de un entero), Node.js no debería tener que cambiar. Solo `core` debería actualizarse.

## Qué demuestra al alumno

- La diferencia entre validación de transporte (¿el parámetro llegó?) y validación de dominio (¿el valor es válido para el negocio?).
- Cómo el principio de fronteras como contratos estructurales aplica incluso a pequeñas validaciones.
- Cómo mantener el proxy genuinamente "thin".
