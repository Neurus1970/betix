---
id: BUG-F5
area: frontend
archivo: frontend/nginx.conf
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-F5 — `nginx.conf` sin headers de seguridad, sin compresión y sin `server_tokens off`

## Descripción

La configuración de nginx sirve los archivos estáticos correctamente, pero no tiene configuradas varias prácticas estándar de seguridad y performance:

### Seguridad

1. **`server_tokens off`** está ausente: nginx incluye su número de versión en los headers de respuesta y en las páginas de error. Esto expone información del servidor a potenciales atacantes.

2. **Headers de seguridad HTTP** ausentes:
   - `X-Content-Type-Options: nosniff` — previene MIME sniffing
   - `X-Frame-Options: SAMEORIGIN` — previene clickjacking
   - `Content-Security-Policy` — controla qué recursos puede cargar la página
   - `Referrer-Policy: strict-origin-when-cross-origin`

### Performance

3. **Sin compresión gzip/brotli**: los archivos JS y CSS se sirven sin comprimir. Para archivos de ~470 líneas de CSS y ~940 líneas de JS, la compresión puede reducir el tamaño en un 60-70%.

4. **Sin `Cache-Control` para assets estáticos**: el browser re-descarga los archivos en cada visita porque nginx no envía headers de caché.

## Configuración esperada

```nginx
server {
    listen 80;
    server_tokens off;  # No exponer versión de nginx

    # Compresión
    gzip on;
    gzip_types text/css application/javascript application/json;
    gzip_min_length 1024;

    # Headers de seguridad
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'" always;

    location /static/ {
        # Cache para assets con hash en el nombre
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        # Sin cache para HTML (puede cambiar en cada deploy)
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        # ...
    }
}
```

## Por qué importa

nginx es el punto de entrada a toda la plataforma. Las configuraciones de seguridad HTTP son la primera línea de defensa contra ataques comunes (XSS, clickjacking, MIME confusion). Son fáciles de agregar y tienen impacto inmediato.

## Qué demuestra al alumno

- La diferencia entre "nginx que sirve archivos" y "nginx configurado para producción".
- Cada header de seguridad: qué ataque previene y cómo.
- Compresión gzip: qué es, cómo se configura y cómo verificar que funciona (`curl -H 'Accept-Encoding: gzip'`).
- `Cache-Control`: la diferencia entre assets estáticos versionados (cacheable por un año) y HTML (no cacheable).
