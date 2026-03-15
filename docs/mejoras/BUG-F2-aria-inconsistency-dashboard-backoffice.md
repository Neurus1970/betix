---
id: BUG-F2
area: frontend
archivo: src/public/dashboard.html, src/public/backoffice.html
prioridad: media
complejidad: baja
impacto_didactico: medio
parent_ticket: BETIX-47
---

# BUG-F2 — Inconsistencia de accesibilidad ARIA entre `dashboard.html` y `backoffice.html`

## Descripción

`backoffice.html` implementa correctamente atributos ARIA en sus tabs y tablas:

```html
<!-- backoffice.html — implementación correcta -->
<button role="tab" aria-selected="true" aria-controls="panel-tickets">Tickets</button>
<th scope="col">Provincia</th>
```

`dashboard.html` tiene la misma estructura de tabs y tablas pero sin ningún atributo ARIA:

```html
<!-- dashboard.html — sin atributos ARIA -->
<button class="tab-btn active">Proyecciones</button>
<th>Provincia</th>  <!-- sin scope="col" -->
```

El resultado es que los elementos interactivos del dashboard son inaccesibles para usuarios que navegan con lectores de pantalla (screen readers), a pesar de que el backoffice —construido por el mismo equipo— lo hace correctamente.

## Comportamiento esperado

```html
<!-- dashboard.html — alineado con backoffice.html -->
<div role="tablist" aria-label="Secciones del dashboard">
  <button role="tab" aria-selected="true" aria-controls="panel-proyecciones" id="tab-proyecciones">
    Proyecciones
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-mapa" id="tab-mapa">
    Mapa
  </button>
</div>

<table>
  <thead>
    <tr>
      <th scope="col">Provincia</th>
      <th scope="col">Proyección</th>
    </tr>
  </thead>
</table>
```

## Por qué importa

La accesibilidad no es un feature opcional —en muchos contextos es un requisito legal. Pero más relevante para el contexto educativo: si `backoffice.html` lo hace bien y `dashboard.html` no, el mensaje implícito es que la accesibilidad es opcional y se aplica cuando uno tiene tiempo.

## Qué demuestra al alumno

- Los atributos ARIA básicos para tabs: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`.
- `scope="col"` en headers de tabla: mejora la navegación para lectores de pantalla.
- La consistencia como principio: si una página del mismo proyecto lo hace bien, todas deben hacerlo.
- Cómo usar las DevTools de Chrome/Firefox para auditar accesibilidad (Accessibility tree).
