---
title: API de eventos
description: Utilice /event/create, /event/update y /event/close para modelar ciclos de vida actualizables.
---
La API Event representa un proceso que cambia con el tiempo y termina finalmente. Al crear un Event se devuelve un `event_id`; las actualizaciones y el cierre usan ese identificador para permanecer dentro del mismo ciclo de vida.

## Endpoints

```http
POST /event/create
POST /event/update
POST /event/close
```

El cuerpo de la petición debe ser JSON y los campos desconocidos se rechazan. Si un Gateway privado habilita `PUSHGO_TOKEN`, incluya `Authorization: Bearer <token>`.

## Cabeceras

| Encabezado | Requerido | Descripción |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Sí | Solicitar formato del cuerpo. |
| `Authorization: Bearer <token>` | Dependiente del Gateway | Se requiere solo cuando un Gateway privado habilita `PUSHGO_TOKEN`. |

## Ciclo de vida

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   marks the event as ended
```

## Campos comunes

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Sí | ID de Channel de destino. |
| `password` | `string` | Sí | Contraseña Channel, normalmente de 8 a 128 caracteres. |
| `op_id` | `string` | No | Clave de idempotencia; se genera y se devuelve si se omite. |
| `thing_id` | `string` | No | Asocie este despacho de eventos con un Thing existente. |
| `ciphertext` | `string` | No | Carga útil de texto cifrado E2EE opcional. |

## Campos obligatorios por ruta

| Ruta | Campos comerciales requeridos |
| :--- | :--- |
| `/event/create` | `title`, `status`, `message`, `severity`, `event_time` |
| `/event/update` | `event_id`, `status`, `message`, `severity`, `event_time` |
| `/event/close` | `event_id`, `status`, `message`, `severity`, `event_time` |

## Reglas de campo

| Campo | Tipo | Reglas |
| :--- | :--- | :--- |
| `event_id` | `string` | Obligatorio para update/close; no debe enviarse en create; 1-64 caracteres, letras/dígitos/`_`/`:`/`-`. |
| `title` | `string` | Requerido al crear; Opcional al actualizar y cerrar. |
| `description` | `string` | Opcional; las cadenas vacías se consideran faltantes. |
| `status` | `string` | Requerido; no vacío, máximo 24 caracteres. |
| `message` | `string` | Requerido; no vacío, máximo 512 caracteres. |
| `severity` | `string` | Requerido; Sólo `critical`, `high`, `normal`, `low`. |
| `event_time` | `number` | Obligatorio; momento de esta actualización; acepta segundos o milisegundos Unix y normaliza a milisegundos. |
| `started_at` | `number` | Solo create; por defecto usa `event_time`; se rechaza en update/close. |
| `ended_at` | `number` | Solo close; por defecto usa `event_time`; se rechaza en create/update. |
| `tags` | `string[]` | Hasta 32 elementos, con un máximo de 64 caracteres cada uno, recortados y sin duplicados. |
| `images` | `string[]` | Hasta 32 URL de imágenes, con un máximo de 2048 caracteres cada una. |
| `attrs` | `object` | Parche de objetos; `null` quita una llave; No se permiten matrices. |
| `metadata` | `object` | No | Pares clave-valor escalares; clave <= 64, valor escalar no vacío <= 512; objetos anidados y arrays se rechazan. |

## Crea un Event

```bash
curl -X POST https://gateway.pushgo.dev/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Production deployment",
    "status": "running",
    "message": "Deployment started",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000,
    "attrs": {
      "service": "api",
      "revision": "8f3c2a1"
    }
  }'
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

Guarde el `event_id` devuelto; actualizar y cerrar llamadas lo necesitan.

## Actualizar un Event

```bash
curl -X POST https://gateway.pushgo.dev/event/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "publishing",
    "message": "Image pushed, publishing release",
    "severity": "normal",
    "event_time": 1713750300000,
    "attrs": {
      "progress": 0.75
    }
  }'
```

A `/event/update` se le puede llamar muchas veces. Cada actualización debe describir el cambio actual, no repetir todo el historial.

## Cerrar un Event

```bash
curl -X POST https://gateway.pushgo.dev/event/close \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "success",
    "message": "Production deployment completed",
    "severity": "normal",
    "event_time": 1713750600000,
    "ended_at": 1713750600000,
    "attrs": {
      "progress": 1
    }
  }'
```

Para fallas, use `status=failed` y eleve `severity` cuando sea apropiado.

## Asociarse con un Thing

Si el evento ocurre en una entidad persistente, incluya `thing_id`.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
  "title": "Database lag",
  "status": "open",
  "message": "Replica lag exceeded 30 seconds",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000
}
```

Thing identifica el objeto; Event describe el proceso que le sucede.

## Semántica de respuesta

Las API Event utilizan el sobre de respuesta compartido. `accepted=true` significa que el Gateway entró en despacho, no que todos los dispositivos hayan mostrado una notificación del sistema.

## Errores comunes

| Estado | Razón típica |
| :--- | :--- |
| `400` | Falta campo obligatorio de ruta, campo desconocido, `severity` no válido, `attrs` no válido. |
| `401` | El token privado Gateway Bearer falta o es incorrecto. |
| `404` | Channel o `event_id` no existe. |
| `413` | El cuerpo de la petición supera los 32 KB. |
| `503` | El envío no se aceptó por completo. |