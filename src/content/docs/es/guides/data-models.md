---
title: Modelos de datos
description: Decida cuándo utilizar Mensaje, Evento o Cosa y comprenda los límites de sus campos.
---
Los tres modelos de datos de PushGo tienen una semántica empresarial diferente. Elegir el modelo correcto hace que sea más fácil razonar sobre la presentación del cliente, el historial, la fusión de estados y la automatización.

## Matriz de decisiones

| Lo que necesitas expresar | Uso | Por qué |
| :--- | :--- | :--- |
| "Algo pasó; avísame una vez" | Message | Ningún estado persistente; cada mensaje es independiente. |
| "Algo empezó, cambia con el tiempo y finalmente termina" | Event | Un `event_id` se puede actualizar varias veces y luego cerrar. |
| "Este dispositivo, servicio, sala o tarea tiene el estado actual" | Thing | Un `thing_id` se puede actualizar con el tiempo. |
| "Se produjo una alerta sobre una entidad específica" | Thing + Message | Thing identifica la entidad; Message registra la alerta. |
| "Una entidad concreta está pasando por un proceso" | Thing + Event | Thing identifica el objeto; Event registra el ciclo de vida. |

## Message: Alerta única

Message es el modelo de notificación más simple. Úselo para contenido que no necesita fusionarse ni cerrarse posteriormente.

### Buen ajuste

- El uso del disco superó un umbral.
- Copia de seguridad completada.
- El precio bajó.
- Una cámara detecta movimiento e incluye una instantánea.

### Ajustes deficientes

- El ciclo de vida de compilación, publicación y finalización de una implementación.
- El último estado de un servidor, sensor o sala.
- Un valor del panel que debe sobrescribirse con el tiempo.

### Grupos de campos

| Grupo | Campos |
| :--- | :--- |
| Autenticación y enrutamiento | `channel_id`, `password`, `op_id`, `thing_id` |
| Mostrar | `title`, `body`, `severity`, `url`, `images`, `tags` |
| Tiempo y seguridad | `occurred_at`, `ttl`, `ciphertext` |
| Extensiones | `metadata` |

### Ejemplo mínimo

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Backup completed",
  "body": "The daily NAS backup has finished.",
  "severity": "normal"
}
```

## Event: Ciclo de vida actualizable

Event representa un proceso. Al crearlo se devuelve un `event_id`; las actualizaciones posteriores y el cierre final utilizan ese identificador.

### Buen ajuste

- Implementación de CI/CD: iniciada, construida, publicada, exitosa o fallida.
- Gestión de incidencias: detectadas, investigadas, recuperadas.
- Estado puerta/ventana: abierta y luego cerrada.
- Tareas de larga duración: transcodificación, sincronización, entrenamiento de modelos.

### Ciclo de vida

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   ends the event
```

### Grupos de campos

| Grupo | Campos |
| :--- | :--- |
| Autenticación y enrutamiento | `channel_id`, `password`, `op_id`, `thing_id` |
| Ciclo de vida | `event_id`, `event_time`, `started_at`, `ended_at` |
| Mostrar | `title`, `description`, `status`, `message`, `severity`, `tags`, `images` |
| Extensiones | `attrs`, `metadata`, `ciphertext` |

### Consejos de modelado

- Utilice valores cortos de `status` como `running`, `degraded`, `success` o `failed`.
- Utilice `message` para la actualización actual, como "imagen enviada".
- `event_time` es cuando ocurrió esta actualización.
- `started_at` es la hora de inicio general del evento y pertenece al momento de la creación.
- `ended_at` es la hora de finalización general del evento y pertenece al cierre.

## Thing: Estado de entidad persistente

Thing representa un objeto de larga duración. Su valor proviene de actualizar el mismo objeto en lugar de crear notificaciones no relacionadas.

### Buen ajuste

- NAS doméstico, servidor o servicio de red.
- Habitación, sensor, cámara o cerradura.
- Activo o tarea de larga duración.
- Cualquier cosa que deba mostrar el estado actual.

### Ciclo de vida

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

### Grupos de campos

| Grupo | Campos |
| :--- | :--- |
| Autenticación y enrutamiento | `channel_id`, `password`, `op_id` |
| Identidad y visualización | `thing_id`, `title`, `description`, `tags`, `primary_image`, `images` |
| Hora | `created_at`, `observed_at`, `deleted_at` |
| Sistemas externos | `external_ids`, `location_type`, `location_value` |
| Estado | `attrs`, `metadata`, `ciphertext` |

### Consejos de modelado

- Utilice `title` para el nombre legible por humanos, como "Home NAS".
- Utilice `attrs` para cambiar valores como CPU, temperatura o estado en línea.
- Utilice `metadata` para datos auxiliares que normalmente no se muestran.
- Utilice `external_ids` para conectarse a ID de sistemas como Home Assistant.

## Combinando modelos

| Combinación | Patrón |
| :--- | :--- |
| Thing + Message | Se produjo una alerta de "disco casi lleno" en la entidad "Home NAS". |
| Thing + Event | La entidad "base de datos de producción" está experimentando un evento de retraso en la replicación. |
| Event + Message | Event registra el ciclo de vida; Message envía una fuerte alerta en un punto crítico. |

Si no está seguro, comience con Message. Cuando un script envía repetidamente "iniciado/actualizado/finalizado" o "valor actual cambiado", actualice a Event o Thing.