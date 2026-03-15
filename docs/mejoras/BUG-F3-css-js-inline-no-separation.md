---
id: BUG-F3
area: frontend
archivo: src/public/dashboard.html, src/public/backoffice.html
prioridad: baja
complejidad: alta
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-F3 — CSS y JS inline en archivos HTML de ~1600 líneas: sin separación de responsabilidades

## Descripción

`dashboard.html` tiene ~1604 líneas de contenido, de las cuales aproximadamente:
- ~470 líneas son CSS (dentro de `<style>`)
- ~940 líneas son JavaScript (dentro de `<script>`)
- ~194 líneas son HTML real

`backoffice.html` sigue el mismo patrón.

Todo en un solo archivo hace que:
- El HTML, CSS y JS no puedan testearse, minificarse ni cachearse independientemente.
- Los cambios en estilos o comportamiento requieren abrir un archivo de 1600 líneas.
- Las design tokens (variables CSS) están duplicadas entre los dos archivos.
- nginx no puede configurar headers de caché diferentes para HTML (dinámico) vs CSS/JS (estáticos, cacheable por más tiempo).

## Comportamiento esperado

```
src/public/
├── dashboard.html          # Solo HTML, ~200 líneas
├── backoffice.html         # Solo HTML, ~200 líneas
├── css/
│   ├── variables.css       # Design tokens compartidos (colores, fuentes, espaciado)
│   ├── dashboard.css       # Estilos específicos del dashboard
│   └── backoffice.css      # Estilos específicos del backoffice
└── js/
    ├── dashboard.js        # Lógica del dashboard (D3, fetch, filtros)
    └── backoffice.js       # Lógica del backoffice
```

Con referencias en el HTML:
```html
<link rel="stylesheet" href="/css/variables.css">
<link rel="stylesheet" href="/css/dashboard.css">
<script src="/js/dashboard.js" defer></script>
```

## Por qué importa (principio fundacional)

> *"Las fronteras entre componentes son contratos estructurales."* — Principio 1

HTML, CSS y JS tienen responsabilidades distintas (estructura, presentación, comportamiento). Mezclarlos en un solo archivo es la violación más básica de separación de responsabilidades en el frontend.

## Consideración didáctica

Esta es la mejora de mayor complejidad de implementación entre las de frontend: requiere mover ~1400 líneas de código, verificar que nginx sirve los archivos estáticos correctamente, y actualizar las referencias. Pero es también la que mayor impacto tiene sobre la mantenibilidad y la que más conceptos enseña en paralelo (separación, nginx, caché HTTP).

## Qué demuestra al alumno

- El principio de separación de responsabilidades (HTML/CSS/JS).
- Cómo nginx sirve archivos estáticos y por qué la estructura de directorios importa.
- Design tokens como único punto de definición de variables de estilo compartidas.
- Headers `Cache-Control` diferenciados: HTML con `no-cache`, CSS/JS con `max-age=31536000, immutable`.
