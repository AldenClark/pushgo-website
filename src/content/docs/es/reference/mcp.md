---
title: Protocolo de Contexto de Modelo (MCP)
description: Integre PushGo en los flujos de trabajo del asistente de IA con MCP y OAuth2.
---
PushGo Gateway puede actuar como un servidor MCP HTTP para que los asistentes de IA con capacidad MCP puedan enviar Message, administrar Event y actualizar Thing dentro de los alcances del canal autorizado. Se recomienda la autorización OAuth2 para que los usuarios vinculen canales en un navegador en lugar de dar contraseñas de canal a un modelo.

## Casos adecuados

- Permita que un asistente de IA envíe una notificación PushGo después de que se complete una tarea.
- Permita que un asistente de IA sincronice el trabajo de larga duración como Event.
- Permita que un asistente de IA actualice el Thing de un servicio, dispositivo o tarea.
- Proporcionar acceso a canales específicos a clientes MCP de terceros.

MCP no debe reemplazar la confirmación del usuario. Los flujos de trabajo de alto impacto aún deben mantener la confirmación en el cliente o en la capa de orquestación.

## Endpoint

```text
https://your-gateway-domain/mcp
```

Si un Gateway público habilita MCP/OAuth, utilice el endpoint `/mcp` de esa región. Las implementaciones autoalojadas deben configurar un `PUSHGO_PUBLIC_BASE_URL` accesible externamente.

## Habilitar MCP en un Gateway privado

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Configuraciones comunes:

| Variable de entorno | Predeterminado | Descripción |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Habilita el registro dinámico de clientes. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | ninguno | Clientes OAuth predefinidos en formato `client_id:client_secret`; separe varios clientes con salto de línea o punto y coma. |

Si el cliente no admite DCR, utilice `PUSHGO_MCP_PREDEFINED_CLIENTS`.

## Modos de autorización

| Modo | Contraseña Channel | Lo mejor para | Riesgo |
| :--- | :--- | :--- | :--- |
| Autorización OAuth2 | No se transmite en llamadas de herramienta | Asistentes de IA, clientes externos, producción | Limitado por alcances y subvenciones de canal. |
| Modo heredado | Se transmite en cada llamada de herramienta | Scripts personales, entornos confiables | La persona que llama tiene directamente las contraseñas del canal. |

Prefiera la autorización OAuth2 en producción.

## Flujo de enlace de usuario

1. El cliente MCP se conecta a `/mcp`.
2. El cliente obtiene una identidad de cliente OAuth2 a través de OAuth o DCR.
3. El asistente llama a `pushgo.channel.bind.start`.
4. El usuario abre el `bind_url` devuelto.
5. El usuario ingresa el ID de Channel y la contraseña y confirma el alcance de la autorización.
6. El asistente consulta `pushgo.channel.bind.status`.
7. Después de la autorización, el asistente puede llamar a herramientas dentro del alcance del canal vinculado.

Las sesiones de vinculación y las vidas de tokens las gestiona el perfil de ejecución actual del Gateway; en v1.2.9 no son opciones públicas CLI/env.

## Herramientas

### Message

| Herramienta | Propósito |
| :--- | :--- |
| `pushgo.message.send` | Envía un Message único. Admite `title`, `body`, `url`, `images`, `severity`, `ttl`, `metadata`, `thing_id` y campos relacionados. |

### Event

| Herramienta | Propósito |
| :--- | :--- |
| `pushgo.event.create` | Crea un evento de ciclo de vida y devuelve `event_id`. |
| `pushgo.event.update` | Actualiza un evento existente. |
| `pushgo.event.close` | Cierra un evento existente. |

### Thing

| Herramienta | Propósito |
| :--- | :--- |
| `pushgo.thing.create` | Crea una entidad persistente y devuelve `thing_id`. |
| `pushgo.thing.update` | Actualiza los atributos de la entidad. |
| `pushgo.thing.archive` | Archiva una entidad. |
| `pushgo.thing.delete` | Elimina o retira una entidad. |

### Channel

| Herramienta o recurso | Propósito |
| :--- | :--- |
| `pushgo.channel.bind.start` | Crea una sesión de vinculación o revocación y devuelve `bind_url`. |
| `pushgo.channel.bind.status` | Comprueba el estado de la sesión de enlace. |
| `pushgo.channel.list` | Enumera los canales actualmente autorizados. |
| `pushgo.channel.unbind` | Revoca la autorización del canal. |
| `pushgo://channels` | Lista de recursos de canales autorizados. |
| `pushgo://channels/{channel_id}` | Información básica para un canal. |

## Notas de configuración del cliente

- El punto final MCP es `https://your-gateway-domain/mcp`.
- Los proxies inversos deben pasar correctamente `Host` y `X-Forwarded-Proto`.
- Las implementaciones autoalojadas deben configurar `PUSHGO_PUBLIC_BASE_URL` en una URL raíz de HTTPS accesible externamente.
- Si los metadatos del emisor OAuth o los enlaces de enlace contienen direcciones internas, verifique primero `PUSHGO_PUBLIC_BASE_URL`.
- Si un cliente no admite DCR, utilice clientes predefinidos.

## Operaciones

- Se mantienen las subvenciones MCP; no trate la base de datos o el directorio de almacenamiento como caché desechable.
- En v1.2.9, las vidas de tokens y sesiones de vinculación son ajustes internos del perfil; elija el perfil de ejecución adecuado en lugar de definir variables TTL.
- Rotar periódicamente los secretos de cliente predefinidos.
- Utilice canales separados para la automatización de alto riesgo en lugar de autorizar todo en un solo canal.
- Utilice registros estructurados y estadísticas de Gateway para la depuración operativa.

## Solución de problemas

| Síntoma | Comprobación |
| :--- | :--- |
| El cliente no puede descubrir los metadatos de OAuth | `PUSHGO_PUBLIC_BASE_URL` debe ser una URL externa de HTTPS; El proxy inverso debe reenviar rutas conocidas. |
| El enlace de vinculación no abre | DNS público, certificado HTTPS, ruta del proxy inverso, `PUSHGO_PUBLIC_BASE_URL` y si la sesión de vinculación expiró. |
| DCR falla | Soporte de cliente DCR y `PUSHGO_MCP_DCR_ENABLED`. |
| Llamada de herramienta solicita `password` | Es posible que esté en modo Legacy o que la autorización OAuth esté incompleta. |
| Autorizado, pero no aparecen canales | Finalización de la sesión de vinculación, alcances y si se revocó la autorización del Channel. |