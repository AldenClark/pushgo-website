---
title: Notificaciones de agentes de IA con MCP
description: Envíe notificaciones, eventos y actualizaciones de estado desde agentes de IA y chatbots mediante PushGo MCP y OAuth.
---

Use PushGo cuando un agente de IA, chatbot o cliente MCP necesite avisar a un usuario, informar progreso de tareas largas o actualizar un objeto sin entregar contraseñas de Channel al modelo.

## Casos adecuados

- Avisar al usuario cuando termina una tarea del agente.
- Seguir el progreso como un Event actualizable.
- Actualizar un servicio, dispositivo o tarea como Thing.
- Dar acceso limitado a clientes MCP mediante OAuth.

## Cómo PushGo modela este flujo

| Necesidad | Usar | Por qué |
| :--- | :--- | :--- |
| Alerta única de finalización | Message | El usuario necesita una notificación visible. |
| Tarea larga del agente | Event | La misma tarea puede actualizarse y cerrarse. |
| Estado actual de servicio o tarea | Thing | El agente actualiza un objeto persistente. |
| Autorización del asistente | MCP OAuth | El modelo no necesita la contraseña del Channel en llamadas de herramienta. |

## Ejemplo mínimo

Un cliente MCP se conecta a `/mcp`, inicia `pushgo.channel.bind.start`, el usuario autoriza un Channel en el navegador y el asistente puede llamar `pushgo.message.send`, `pushgo.event.update` o `pushgo.thing.update` dentro de ese alcance.

```text
pushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send
```

## Preguntas que responde esta página

- **¿Puede un agente de IA enviar una notificación móvil?** Sí. Las herramientas MCP autorizadas pueden enviar Messages a través de PushGo Gateway.
- **¿Debe un chatbot guardar la contraseña del Channel?** No. En producción use MCP OAuth para que el usuario vincule el Channel en el navegador.
- **¿Cómo reporta progreso un agente?** Use Event para tareas largas porque se puede actualizar varias veces y cerrar al terminar.

## Seguridad y operación

- Use Channels separados y credenciales limitadas para automatización de alto riesgo.
- Prefiera MCP OAuth para asistentes de IA, de modo que los modelos no tengan contraseñas de Channel.
- Use autoalojamiento cuando ruta de datos, transporte o cumplimiento deban estar bajo su control.
- Use E2EE para campos sensibles que solo los clientes deben descifrar.

## Siguientes pasos

- [Referencia MCP](/es/reference/mcp/)
- [Autenticación](/es/reference/auth/)
- [Modelos de datos](/es/guides/data-models/)
