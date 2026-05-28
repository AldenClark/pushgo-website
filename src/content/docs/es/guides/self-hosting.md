---
title: Autoalojamiento
description: Implemente su propio PushGo Gateway desde una configuración mínima hasta operaciones de producción.
---
El autoalojamiento es para usuarios que desean controlar las rutas de datos, la política de autenticación, las bases de datos, los transportes privados y MCP/OAuth. El Gateway es un servicio Rust. Las API HTTP, WSS y MCP/OAuth comparten un escucha HTTP; QUIC y Raw TCP utilizan direcciones de escucha independientes.

## Cuando lo necesitas

- No desea que la notificación, el evento o el estado de la entidad pasen por un Gateway público.
- Necesita su propia base de datos, copias de seguridad, registros, monitoreo y política de capacidad.
- Quieres una sincronización de transporte privado de Android con menor latencia.
- Quieres MCP/OAuth en tu propio dominio.
- Necesita un token Bearer a nivel de Gateway para restringir a las personas que llaman.

Si solo desea probar PushGo, utilice el Gateway público y siga [Introducción](/es/guides/getting-started/).

## Niveles de implementación

| Nivel | Lo mejor para | Configuración principal |
| :--- | :--- | :--- |
| Mínimo | Pruebas locales, scripts de usuario único | API SQLite + HTTP |
| Base de producción | Dominio público de larga duración | Proxy inverso HTTPS + base de datos persistente + token Bearer |
| Transportes privados | Sincronización de baja latencia de Android | WSS, luego opcional QUIC / Raw TCP |
| Integración de IA | Clientes MCP y asistentes de IA | MCP/OAuth + `PUSHGO_PUBLIC_BASE_URL` |

## Implementación mínima

La configuración mínima sólo necesita una base de datos y un oyente HTTP.

```bash
mkdir -p /var/lib/pushgo

docker run -d --name pushgo-gateway \
  -p 6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='sqlite:///var/lib/pushgo/pushgo.db?mode=rwc' \
  -v /var/lib/pushgo:/var/lib/pushgo \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

Pruébalo:

```bash
curl -X POST http://127.0.0.1:6666/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Private Gateway test",
    "body": "This message came from your own Gateway."
  }'
```

La configuración mínima es útil para la validación. No lo exponga directamente a la Internet pública.

## Base de producción

Para la producción, al menos:

1. Vincule el Gateway al host local o a una red privada.
2. Coloque Nginx, Caddy o un equilibrador de carga al frente con HTTPS.
3. Configure `PUSHGO_TOKEN` para la autenticación Bearer a nivel de Gateway.
4. Utilice almacenamiento persistente e inclúyalo en las copias de seguridad.
5. Configure `PUSHGO_PUBLIC_BASE_URL` y `PUSHGO_TOKEN_SERVICE_URL` explícitamente.

```bash
docker run -d --name pushgo-gateway \
  -p 127.0.0.1:6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='postgres://user:pass@db:5432/pushgo' \
  -e PUSHGO_TOKEN='replace-with-gateway-token' \
  -e PUSHGO_PUBLIC_BASE_URL='https://gateway.example.com' \
  -e PUSHGO_TOKEN_SERVICE_URL='https://token.pushgo.dev' \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

Después de configurar `PUSHGO_TOKEN`, las peticiones de API necesitan:

```http
Authorization: Bearer replace-with-gateway-token
```

El ID de Channel y la contraseña de Channel aún pertenecen al cuerpo de la petición. Consulte [Autenticación](/es/reference/auth/) para conocer la diferencia entre las dos capas.

Cuando `PUSHGO_TOKEN` está definido, `/healthz` y `/readyz` también requieren el mismo Bearer token; las rutas de descubrimiento MCP/OAuth son la excepción cuando MCP está habilitado.

## Puntos finales de región pública

Si el Gateway necesita servicio de token, configure la región explícitamente.

| Región | Gateway | servicio de token |
| :--- | :--- | :--- |
| Mundial | `https://gateway.pushgo.dev/` | `https://token.pushgo.dev/` |
| China continental | `https://gateway.pushgo.cn/` | `https://token.pushgo.cn/` |

Un Gateway privado aún puede usar el servicio de token público o cambiar a otro servicio a medida que evoluciona su implementación.

## Proxy inverso

Las API HTTP, WSS y MCP/OAuth comparten el escucha HTTP. El proxy inverso debe admitir la actualización normal de HTTP y WebSocket.

```nginx
server {
    listen 443 ssl http2;
    server_name gateway.example.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:6666;
    }
}
```

`PUSHGO_PUBLIC_BASE_URL` debe ser la raíz HTTPS accesible externamente. De lo contrario, los metadatos del emisor MCP, los enlaces de enlace y las sugerencias del perfil del cliente pueden contener direcciones internas.

## Transportes Privados Android

Los transportes privados están habilitados con `PUSHGO_PRIVATE_TRANSPORTS`. Comience con `wss`; Reutiliza HTTPS y es la opción menos compleja.

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Agregue QUIC / Raw TCP cuando necesite una latencia más baja o opere en una red controlada.

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

| Configuración | Descripción |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`, `true`, `none` o lista explícita como `wss` o `quic,tcp,wss`. |
| `PUSHGO_PRIVATE_QUIC_BIND` | Dirección UDP local en la que escucha el Gateway. |
| `PUSHGO_PRIVATE_QUIC_PORT` | Puerto QUIC anunciado a los clientes. |
| `PUSHGO_PRIVATE_TCP_BIND` | Dirección TCP local en la que escucha el Gateway. |
| `PUSHGO_PRIVATE_TCP_PORT` | Puerto Raw TCP anunciado a los clientes. |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | Requerido para QUIC; También se requiere para Raw TCP a menos que se descargue TLS. |
| `PUSHGO_PRIVATE_TCP_TLS_OFFLOAD` | Si la infraestructura de borde maneja Raw TCP TLS. |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Si el punto de entrada Raw TCP espera el protocolo PROXY v1. |

PushGo QUIC utiliza un ALPN personalizado (`pushgo-quic`) y no puede simplemente compartir el mismo punto de entrada UDP/443 con HTTP/3. Utilice un puerto UDP independiente o confirme que su proxy perimetral pueda enrutarse por protocolo correctamente.

## MCP / OAuth

Habilite MCP con:

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Configuraciones comunes:

| Variable de entorno | Predeterminado | Descripción |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Habilita el registro dinámico de clientes. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | ninguno | Clientes OAuth predefinidos en formato `client_id:client_secret`; separe varios clientes con salto de línea o punto y coma. |

Consulte la [Referencia MCP](/es/reference/mcp/) para conocer las herramientas y el flujo de autorización.

## Configuración principal

| CLI/var entorno | Predeterminado | Descripción |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | API HTTP, WSS y escucha MCP/OAuth. |
| `--db-url` / `PUSHGO_DB_URL` | requerido | URL de la base de datos; admite SQLite, PostgreSQL y MySQL. |
| `--runtime-profile` / `PUSHGO_RUNTIME_PROFILE` | `small` | Perfil de tamaño runtime: `small` para despliegues privados/ligeros, `public` para alta carga. |
| `--token` / `PUSHGO_TOKEN` | ninguno | Token Bearer a nivel de Gateway. Vacío significa deshabilitado. |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `https://token.pushgo.dev` | URL del servicio de token. Establecer explícitamente en producción. |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | ninguno | URL raíz externa de HTTPS. |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | Modo Sandbox, incluido el punto final de Sandbox APNs. |
| `--observability-profile` / `PUSHGO_OBSERVABILITY_PROFILE` | `prod_min` | Perfil de observabilidad: `prod_min`, `ops`, `incident`, `debug`. |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | Nivel de registro de seguimiento nativo. |

## Operaciones

- Incluir la base de datos en las copias de seguridad; Los canales, los dispositivos, las concesiones MCP y el estado de la entidad dependen del almacenamiento persistente.
- SQLite es adecuado para implementaciones personales o ligeras; prefiera PostgreSQL para uso multiusuario o de alta concurrencia.
- Para cargas elevadas, inspeccione las colas de despacho y los trabajadores antes de asumir un problema con el proveedor o la base de datos.
- Utilice `PUSHGO_OBSERVABILITY_PROFILE=ops` para solucionar problemas de producción; elevar temporalmente a `incident` o `debug` para una investigación más profunda.
- Para problemas de transporte privado de Android, comience con `/gateway/profile` y puertos accesibles externamente.

Configuraciones relacionadas con la capacidad:

Capacidad runtime:

Desde Gateway v1.2.9, la capacidad runtime pertenece al perfil. Use `PUSHGO_RUNTIME_PROFILE=small` para despliegues privados o ligeros y `PUSHGO_RUNTIME_PROFILE=public` para despliegues públicos de alta carga. Los ajustes finos de colas, despacho, proveedores, pools DB y SQLite son valores internos del perfil, no variables de entorno públicas.

## Actualizar y revertir

- Haga una copia de seguridad de la base de datos y de la configuración del tiempo de ejecución antes de actualizar.
- Mantenga rastreables la imagen/binario de Gateway, las variables de entorno y la configuración de proxy inverso.
- Validar `/message`, `/event/create` y `/thing/create` con un canal de prueba.
- Si los transportes privados están habilitados, verifique que los clientes de Android puedan recuperar el `/gateway/profile` actualizado.
- Si MCP está habilitado, verifique que `/.well-known/*`, `/oauth/*` y `/mcp` sigan usando la dirección externa HTTPS.