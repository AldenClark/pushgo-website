---
title: Guía de migración
description: Migre los scripts ntfy, Bark, ServerChan o webhook existentes a PushGo.
---
Migrar a PushGo no requiere reescribir todos los scripts a la vez. Comience con puntos finales de compatibilidad para que los scripts existentes sigan funcionando y luego actualice los flujos de trabajo importantes a las API nativas Message, Event o Thing.

## Ruta recomendada

1. **Cambiar el punto final**: dirija su petición ntfy, Bark o ServerChan al punto final de compatibilidad PushGo.
2. **Reemplace la clave**: use `<channel_id>:<password>` como clave de compatibilidad.
3. **Normalizar campos**: asigne prioridad, nivel, grupo, icono y campos similares a `severity`, `tags`, `images` o `metadata`.
4. **Modelos de actualización**: mantenga alertas únicas como Message; actualizar los ciclos de vida a Event; actualice el estado persistente a Thing.

## Endpoints de compatibilidad

| Fuente | Método | Ruta PushGo | Ubicación clave |
| :--- | :--- | :--- | :--- |
| ntfy | `POST` / `PUT` | `/ntfy/{topic}` | `{topic}` = `<channel_id>:<password>` |
| ServerChan | `GET` / `POST` | `/serverchan/{sendkey}` | `{sendkey}` = `<channel_id>:<password>` |
| Bark v1 | `GET` | `/bark/{device_key}/{body}` | `{device_key}` = `<channel_id>:<password>` |
| Bark v2 | `POST` | `/bark/push` | Campo JSON `device_key` |

Los puntos finales de compatibilidad reducen el costo de la migración. No expresan el modelo de datos PushGo completo. Utilice API nativas cuando necesite los ciclos de vida de `thing_id`, Event o el estado completo de Thing.

## De ntfy

Petición anterior:

```bash
curl -d "NAS backup completed" https://ntfy.example.com/my-topic
```

Endpoint de compatibilidad de PushGo:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -H "Priority: 3" \
  -d "NAS backup completed"
```

Nativo Message:

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The NAS backup task has finished.",
    "severity": "normal",
    "tags": ["nas", "backup"]
  }'
```

## De Bark

Bark normalmente coloca la clave del dispositivo en la ruta. Reemplace esa clave con `<channel_id>:<password>`.

```bash
curl "https://gateway.pushgo.dev/bark/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD/Server%20alert?title=CPU%20High&level=timeSensitive"
```

Si ya utiliza peticiones JSON, prefiera migrar directamente al Message nativo. Las API nativas expresan `images`, `tags`, `metadata`, `thing_id` y E2EE con mayor claridad.

## De ServerChan

```bash
curl -X POST https://gateway.pushgo.dev/serverchan/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -d "title=Deployment completed" \
  -d "desp=Production deployment succeeded"
```

ServerChan es principalmente un modelo de alerta única. Si su secuencia de comandos envía "iniciado", "en ejecución" y "terminado", actualice directamente a Event.

## Cuándo actualizar a Event

Si la misma tarea envía actualizaciones de varias etapas, Event es más adecuado.

| Comportamiento del script antiguo | Expresión Event |
| :--- | :--- |
| Enviar "implementación iniciada" | `/event/create` |
| Enviar "compilación completada" o "publicación" | `/event/update` |
| Enviar "implementación exitosa/fallida" | `/event/close` |

Esto permite a los clientes mostrar una línea de tiempo coherente en lugar de mensajes no relacionados.

## Cuándo actualizar a Thing

Si su script informa repetidamente el estado actual del mismo objeto, use Thing.

| Comportamiento del script antiguo | Expresión Thing |
| :--- | :--- |
| Enviar CPU/memoria cada minuto | `/thing/update` con `attrs` |
| Enviar temperatura ambiente repetidamente | Una habitación o sensor por `thing_id` |
| Servicio de alertas en línea/fuera de línea | Thing para el servicio, Message o Event para incidencias |

## Límites de compatibilidad

- Las claves de compatibilidad contienen la contraseña de Channel; no las escriba en registros públicos.
- El punto final de compatibilidad ntfy no es compatible con `thing_id`.
- Los puntos finales de compatibilidad no pueden expresar el ciclo de vida completo del Thing.
- La prioridad específica del proveedor y los nombres de campo se asignan y es posible que no se conserven uno a uno.
- Los metadatos complejos, E2EE y las relaciones entre entidades son más claras después de migrar a API nativas.