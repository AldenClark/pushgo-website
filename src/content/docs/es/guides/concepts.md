---
title: Conceptos básicos
description: Entienda Channel, Gateway, los clientes y los tres modelos de datos de PushGo.
---
PushGo puede verse como una ruta de sincronización entre sus scripts, servicios o dispositivos y los clientes suscritos a un Channel. No se limita a convertir texto en una notificación del sistema: también conserva ciclos de vida de Event y estados de Thing para que el historial, los filtros y la automatización sigan teniendo estructura.

## Modelo mental

```text
Sender -> Gateway -> Channel -> Subscribed devices
                  |
                  +-> Message / Event / Thing
```

- **Sender**: un script, servidor, Home Assistant, pipeline de CI/CD o asistente de IA.
- **Gateway**: valida peticiones, guarda estado, elige rutas de entrega y despacha datos.
- **Channel**: espacio de comunicación al que se suscriben uno o varios dispositivos. Cada petición necesita `channel_id` y `password`.
- **Cliente**: los clientes Apple reciben notificaciones mediante APNs; los clientes Android pueden combinar FCM con transportes privados.
- **Modelo de datos**: PushGo separa alertas puntuales, procesos con ciclo de vida y estado persistente en objetos distintos.

## Channel: permisos y suscripción

Un Channel es el límite básico de PushGo. Varios dispositivos pueden suscribirse al mismo Channel, y varios remitentes pueden escribir en él si conocen sus credenciales.

| Concepto | Propósito |
| :--- | :--- |
| `channel_id` | Identifica a qué Channel se envía la petición. |
| `password` | Autoriza escrituras en ese Channel. |
| Dispositivos suscritos | Reciben el contenido aceptado para el Channel. |

La contraseña de Channel no es una contraseña de administración del Gateway. Tanto los Gateways públicos como los privados siguen usando autorización a nivel de Channel; un Gateway privado puede añadir además un token Bearer propio.

## Gateway: aceptación, estado y entrega

Cuando el Gateway recibe una petición:

1. Valida el formato, las credenciales del Channel y, si existe, el token Bearer del Gateway.
2. Crea o actualiza el estado de Message, Event o Thing.
3. Entrega el contenido a los dispositivos suscritos mediante APNs, FCM o transportes privados de Android.

La respuesta HTTP indica si el Gateway aceptó la petición. La entrega real de la notificación del sistema es asíncrona: `accepted` significa que la petición entró en la ruta de despacho, no que todos los dispositivos ya la hayan mostrado.

## Tres modelos de datos

La idea central de PushGo no es tener “muchos campos de notificación”, sino usar un modelo distinto para cada tipo de objeto.

| Modelo | Representa | Ejemplos | API principal |
| :--- | :--- | :--- | :--- |
| Message | Alerta puntual | Disco casi lleno, copia de seguridad completada, bajada de precio | `POST /message` |
| Event | Proceso con actualizaciones y cierre | Despliegue, incidente, puerta abierta hasta cerrarse | `/event/create`, `/event/update`, `/event/close` |
| Thing | Estado persistente de una entidad | NAS, sensor, habitación, servicio de red | `/thing/create`, `/thing/update`, `/thing/archive`, `/thing/delete` |

Antes de elegir, formule una pregunta sencilla: ¿quiere avisar de algo una vez, seguir un proceso o sincronizar el estado actual de un objeto?

## Rutas de entrega

PushGo no obliga a todas las plataformas a usar la misma conexión en segundo plano.

| Plataforma | Ruta principal | Notas |
| :--- | :--- | :--- |
| Plataformas Apple | APNs | Entrega gestionada por el sistema para iOS, macOS y watchOS. |
| Android | FCM + transportes privados | FCM puede despertar el dispositivo; los transportes privados reducen la latencia de sincronización. |
| Gateway autoalojado | Depende del despliegue | Puede habilitar WSS, QUIC y Raw TCP para transportes privados de Android. |

Consulte [compatibilidad de aplicaciones y plataformas](/es/guides/apps/) para ver las capacidades de cada cliente.

## Capas de seguridad

| Capa | Qué protege |
| :--- | :--- |
| Contraseña de Channel | Evita escrituras no autorizadas en un Channel. |
| Token Bearer de Gateway | Restringe quién puede llamar a una instancia privada del Gateway. |
| HTTPS/TLS | Protege credenciales y peticiones en tránsito. |
| E2EE `ciphertext` | Permite que los clientes descifren campos sensibles localmente mientras el Gateway solo retransmite texto cifrado. |
| MCP OAuth | Permite que asistentes de IA actúen dentro de Channels autorizados sin poseer directamente sus contraseñas. |

Si solo quiere enviar la primera notificación de prueba, basta con entender Channel y Message. Lea después los modelos de datos, autenticación y autoalojamiento cuando necesite estado duradero o un Gateway propio.
