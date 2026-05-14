---
title: Servidor de notificaciones open source autoalojado
description: Despliegue PushGo Gateway como servidor autoalojado con transportes privados, estado persistente, E2EE y MCP/OAuth.
---

Autoaloje PushGo cuando el camino de notificación, almacenamiento, autenticación, transportes privados y endpoint MCP/OAuth deban estar bajo su control.

## Casos adecuados

- Operar un Gateway privado para automatización personal o de equipo.
- Evitar que notificaciones, eventos y estado pasen por un Gateway público.
- Exponer su propio endpoint HTTPS `/mcp` para asistentes de IA.
- Incluir copias de seguridad, reverse proxy, logs y observabilidad.

## Cómo PushGo modela este flujo

| Necesidad | Usar | Por qué |
| :--- | :--- | :--- |
| Ruta privada | Gateway | Su infraestructura controla la API HTTP y listeners. |
| Campos sensibles | E2EE | Los clientes descifran localmente. |
| Acceso IA | MCP OAuth | Los usuarios vinculan Channels mediante su URL pública. |

## Ejemplo mínimo

Configure `PUSHGO_PUBLIC_BASE_URL` como origen HTTPS público antes de habilitar MCP/OAuth.

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Hola desde PushGo",
    "body": "La ruta de automatización funciona."
  }'
```

## Preguntas que responde esta página

- **¿PushGo puede ser un servidor autoalojado?** Sí. Gateway está diseñado para despliegues privados con almacenamiento persistente.
- **¿El autoalojamiento permite MCP?** Sí. Un Gateway privado puede exponer `/mcp` y OAuth con una base HTTPS pública.
- **¿Necesito copias de seguridad?** Sí. Channels, dispositivos, grants MCP, Events y Things dependen de almacenamiento persistente.

## Seguridad y operación

- Use Channels separados y credenciales limitadas para automatización de alto riesgo.
- Prefiera MCP OAuth para asistentes de IA, de modo que los modelos no tengan contraseñas de Channel.
- Use autoalojamiento cuando ruta de datos, transporte o cumplimiento deban estar bajo su control.
- Use E2EE para campos sensibles que solo los clientes deben descifrar.

## Siguientes pasos

- [Autoalojamiento](/es/guides/self-hosting/)
- [Cifrado de extremo a extremo](/es/reference/e2ee/)
- [Referencia MCP](/es/reference/mcp/)
