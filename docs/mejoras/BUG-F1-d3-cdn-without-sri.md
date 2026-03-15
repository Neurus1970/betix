---
id: BUG-F1
area: frontend
archivo: src/public/dashboard.html
prioridad: alta
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-F1 — D3.js cargado desde CDN sin Subresource Integrity (SRI)

## Descripción

`dashboard.html` carga D3.js desde un CDN externo (jsDelivr) sin Subresource Integrity:

```html
<!-- Líneas 7-15 de dashboard.html — hay un TODO en el archivo que reconoce el problema -->
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
```

Sin SRI, si el CDN es comprometido y sirve una versión maliciosa de D3.js, el browser la ejecutará sin ninguna verificación. SRI permite al browser verificar que el archivo descargado coincide exactamente con el hash esperado antes de ejecutarlo.

El propio archivo tiene un comentario `<!-- TODO: agregar SRI hash -->` que confirma que el problema es conocido.

## Comportamiento esperado

```html
<script
  src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"
  integrity="sha384-<hash-base64>"
  crossorigin="anonymous">
</script>
```

El hash se genera con:
```bash
curl -s https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

O usando el generador online: [srihash.org](https://www.srihash.org/)

## Por qué importa

Un dashboard que carga datos de lotería desde una API interna y luego ejecuta JavaScript de un CDN externo sin verificación tiene una superficie de ataque innecesaria. Si el CDN es comprometido (supply chain attack), el código malicioso tiene acceso a todo lo que el usuario autenticado puede ver.

## Consideración adicional

La versión `d3@7` (sin número de versión específico) descarga la última versión disponible en el CDN. Esto significa que el comportamiento puede cambiar sin que el código del proyecto cambie. La combinación de CDN sin versión fija + sin SRI es el escenario de mayor riesgo.

## Qué demuestra al alumno

- Qué es un ataque de supply chain y cómo SRI mitiga el riesgo en dependencias de CDN.
- Cómo generar el hash SRI para una versión específica de una librería.
- La diferencia entre `d3@7` (última minor/patch de la major 7) y `d3@7.9.0` (versión exacta fija).
- Por qué fijar versiones exactas en dependencias de CDN es una práctica de seguridad.
