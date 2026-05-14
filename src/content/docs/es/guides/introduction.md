---
title: Introducción
description: Qué es PushGo, para quién es y por dónde empezar.
---
**PushGo** es un sistema de sincronización de estado y notificación de código abierto para automatización personal, monitoreo de servidores/NAS, DevOps, IoT y flujos de trabajo de asistentes de IA. Consta de clientes, una API Gateway y HTTP. Puede utilizar el Gateway público directamente o implementar el suyo propio.

## Qué protege PushGo

Muchas herramientas de notificación solo envían mensajes de texto a un teléfono. Esto es suficiente para alertas simples, pero se vuelve complicado cuando se necesita el progreso de las tareas, los ciclos de vida de los incidentes, el estado del dispositivo o las acciones del asistente de IA.

PushGo separa los datos en tres modelos:

| Modelo | Propósito | Ejemplos |
| :--- | :--- | :--- |
| Message | Alerta única | Copia de seguridad completada, disco casi lleno, precio bajado |
| Event | Proceso que puede actualizarse y cerrarse | Despliegue, gestión de incidencias, puerta abierta a cerrada |
| Thing | Estado de entidad persistente | NAS, sensores, habitaciones, servicios de red |

El resultado es que las alertas, los procesos y el estado ya no están comprimidos en el mismo campo de texto. Los clientes y la automatización pueden razonar sobre ellos de forma más fiable.

## Componentes del sistema

```text
Script / Service / AI assistant
        |
        v
PushGo Gateway
        |
        +-- APNs -> Apple clients
        +-- FCM  -> Android clients
        +-- Private transport -> Android low-latency sync
```

El Gateway maneja la autenticación, la aceptación de API, el almacenamiento de estado y el envío. Los clientes reciben, muestran, descifran y administran suscripciones a canales.

## ¿Para quién es?

- Usuarios personales: scripts, webhooks, monitores de precios y tareas de larga duración.
- Usuarios de servidores domésticos y NAS: disco, respaldo, UPS y monitoreo del estado del servicio.
- Usuarios de DevOps: implementaciones, builds, incidentes y estado del servicio.
- Usuarios de IoT/Home Assistant: salas, sensores y eventos de seguridad.
- Self-hosters: controla datos, autenticación, transportes privados y MCP/OAuth por tu cuenta Gateway.

## Por dónde empezar

| Gol | Leer |
| :--- | :--- |
| Recibe tu primera notificación | [Primeros pasos](/es/guides/getting-started/) |
| Entender cómo funciona el sistema | [Conceptos básicos](/es/guides/concepts/) |
| Elija el modelo de datos correcto | [Modelos de datos](/es/guides/data-models/) |
| Ver patrones de integración reales | [Casos de uso](/es/guides/use-cases/) |
| Migrar desde ntfy, Bark o ServerChan | [Guía de migración](/es/guides/migration/) |
| Implemente su propio Gateway | [Autoalojamiento](/es/guides/self-hosting/) |
| Integrar asistentes de IA | [Referencia MCP](/es/reference/mcp/) |

Si aún no tiene un canal, comience con Introducción. Si ya tiene un script para integrar, lea Modelos de datos y la API Message.