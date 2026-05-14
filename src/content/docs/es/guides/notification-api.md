---
title: API de notificaciones push para scripts y servicios
description: Use PushGo como API HTTP de notificaciones para curl, webhooks, cron, CI/CD, alertas NAS y automatización.
---

PushGo ofrece una API HTTP directa para scripts y servicios que necesitan notificaciones visibles y modelos estructurados de eventos y estado.

## Casos adecuados

- Enviar desde curl, cron, scripts shell o webhooks.
- Reportar tareas terminadas, alertas de precio, imágenes o resultados de monitoreo.
- Usar Event y Thing en lugar de acumular texto sin estructura.
- Empezar con endpoints compatibles y migrar a APIs nativas.

## Cómo PushGo modela este flujo

| Necesidad | Usar | Por qué |
| :--- | :--- | :--- |
| Alerta única | Message | Simple, transitoria y fácil de probar con curl. |
| Tarea con progreso | Event | El mismo evento puede actualizarse hasta terminar. |
| Estado actual de servicio o dispositivo | Thing | Los clientes ven el estado más reciente, no alertas obsoletas. |

## Ejemplo mínimo

El endpoint nativo `/message` acepta JSON e indica si el Gateway aceptó la solicitud para despacho.

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

- **¿Puedo enviar una notificación con curl?** Sí. Message API está diseñada para curl, scripts y clientes HTTP simples.
- **¿PushGo es solo una API móvil?** No. PushGo también modela ciclos Event y estado actual Thing.
- **¿Puedo autoalojar la API?** Sí. Puede operar su propio Gateway con autenticación, almacenamiento, transportes y MCP/OAuth.

## Seguridad y operación

- Use Channels separados y credenciales limitadas para automatización de alto riesgo.
- Prefiera MCP OAuth para asistentes de IA, de modo que los modelos no tengan contraseñas de Channel.
- Use autoalojamiento cuando ruta de datos, transporte o cumplimiento deban estar bajo su control.
- Use E2EE para campos sensibles que solo los clientes deben descifrar.

## Siguientes pasos

- [Empezar](/es/guides/getting-started/)
- [API de mensajes](/es/reference/api-message/)
- [Autoalojamiento](/es/guides/self-hosting/)
