---
title: Notificaciones NAS, IoT y Home Assistant
description: Use PushGo para alertas NAS, dispositivos IoT, automatizaciones Home Assistant y estados duraderos.
---

La automatización del hogar y el monitoreo de dispositivos suelen requerir más que una alerta única. PushGo envía notificaciones, sigue eventos y mantiene estado actual.

## Casos adecuados

- Enviar alertas de disco, backup y servicios NAS.
- Conectar Home Assistant por HTTP o webhook.
- Modelar dispositivos, sensores, backups o servicios multimedia como Thing.
- Usar Gateway privado cuando los datos del hogar deben mantenerse bajo control.

## Cómo PushGo modela este flujo

| Necesidad | Usar | Por qué |
| :--- | :--- | :--- |
| Imagen o alerta de disco | Message | El contenido es una alerta única. |
| Progreso de backup o escaneo | Event | El progreso se actualiza hasta terminar. |
| Estado de sensor o dispositivo | Thing | El último estado importa más que cada alerta histórica. |

## Ejemplo mínimo

Un script NAS puede llamar `/message` para alertas de disco; un backup puede crear un Event y actualizarlo hasta éxito o fallo.

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

- **¿PushGo puede recibir webhooks de Home Assistant?** Sí. Home Assistant puede llamar PushGo mediante webhook o acción REST.
- **¿Cómo evitar notificaciones obsoletas?** Use Thing para mostrar el estado actual del mismo objeto.
- **¿Puede ejecutarse en privado?** Sí. Autoaloje Gateway para controlar ruta de datos o políticas de transporte.

## Seguridad y operación

- Use Channels separados y credenciales limitadas para automatización de alto riesgo.
- Prefiera MCP OAuth para asistentes de IA, de modo que los modelos no tengan contraseñas de Channel.
- Use autoalojamiento cuando ruta de datos, transporte o cumplimiento deban estar bajo su control.
- Use E2EE para campos sensibles que solo los clientes deben descifrar.

## Siguientes pasos

- [Casos de uso](/es/guides/use-cases/)
- [API de Thing](/es/reference/api-thing/)
- [Autoalojamiento](/es/guides/self-hosting/)
