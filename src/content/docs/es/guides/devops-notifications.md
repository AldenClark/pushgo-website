---
title: Notificaciones DevOps y CI/CD
description: Use PushGo para notificaciones de CI/CD, despliegues, incidentes, servidores y monitoreo con Message, Event y Thing.
---

Las notificaciones DevOps son más claras cuando alertas únicas, ciclos de incidentes y estado de servicios se modelan por separado.

## Casos adecuados

- Enviar notificaciones de build, despliegue y release.
- Seguir incidentes como Event actualizable.
- Mostrar estado actual de servicio, cola, backup o host como Thing.
- Entregar alertas a clientes Apple y Android mediante Gateway público o privado.

## Cómo PushGo modela este flujo

| Necesidad | Usar | Por qué |
| :--- | :--- | :--- |
| Build terminado | Message | Una notificación visible es suficiente. |
| Despliegue en progreso | Event | El ciclo pasa de iniciado a fallido o completado. |
| Salud de servicio | Thing | El objeto tiene un estado actual que cambia. |

## Ejemplo mínimo

Use Message para final de pipeline, Event para despliegues con varios pasos y Thing para estado actual de servicios.

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

- **¿PushGo sirve para CI/CD?** Sí. Los sistemas CI/CD pueden llamar la API HTTP desde shell steps o webhooks.
- **¿Cómo representar incidentes?** Como Event, para actualizarlos y cerrarlos.
- **¿Un equipo puede autoalojar estas alertas?** Sí. Un Gateway privado controla datos, autenticación y operación.

## Seguridad y operación

- Use Channels separados y credenciales limitadas para automatización de alto riesgo.
- Prefiera MCP OAuth para asistentes de IA, de modo que los modelos no tengan contraseñas de Channel.
- Use autoalojamiento cuando ruta de datos, transporte o cumplimiento deban estar bajo su control.
- Use E2EE para campos sensibles que solo los clientes deben descifrar.

## Siguientes pasos

- [Modelos de datos](/es/guides/data-models/)
- [API de eventos](/es/reference/api-event/)
- [Autoalojamiento](/es/guides/self-hosting/)
