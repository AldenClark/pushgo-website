---
title: Migrar desde ntfy, Bark o ServerChan
description: Migre scripts ntfy, Bark, ServerChan o webhook a PushGo con endpoints compatibles y modelos nativos.
---

PushGo puede recibir workflows existentes mientras migra rutas importantes a Message, Event y Thing.

## Casos adecuados

- Mantener scripts simples durante la evaluación.
- Migrar una ruta de alerta por vez.
- Reemplazar texto plano por ciclos o estado estructurado cuando aporte valor.
- Combinar E2EE y autoalojamiento para flujos sensibles.

## Cómo PushGo modela este flujo

| Necesidad | Usar | Por qué |
| :--- | :--- | :--- |
| Alerta simple migrada | Message | La notificación antigua queda como mensaje puntual. |
| Workflow con cambios de estado | Event | Las actualizaciones repetidas pertenecen a un ciclo. |
| Objeto duradero monitoreado | Thing | La misma entidad puede actualizarse con el tiempo. |

## Ejemplo mínimo

Empiece con endpoints compatibles para scripts de bajo riesgo y migre flujos más ricos a `/message`, `/event/*` o `/thing/*`.

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

- **¿Debo reescribir todo de inmediato?** No. Use compatibilidad y migre primero los flujos de más valor.
- **¿Cuándo no basta el texto plano?** Cuando importan progreso, cierre, estado actual, imágenes, metadatos o seguridad.
- **¿Es una comparación directa?** No. La migración es una decisión de modelado.

## Seguridad y operación

- Use Channels separados y credenciales limitadas para automatización de alto riesgo.
- Prefiera MCP OAuth para asistentes de IA, de modo que los modelos no tengan contraseñas de Channel.
- Use autoalojamiento cuando ruta de datos, transporte o cumplimiento deban estar bajo su control.
- Use E2EE para campos sensibles que solo los clientes deben descifrar.

## Siguientes pasos

- [Guía de migración](/es/guides/migration/)
- [API de mensajes](/es/reference/api-message/)
- [Modelos de datos](/es/guides/data-models/)
