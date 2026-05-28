---
title: API de mensajes
description: Envíe notificaciones únicas con /message y comprenda los campos, las respuestas y la semántica de envío.
---
La API Message envía notificaciones transitorias de nivel superior. Úselo para alertas, mensajes de finalización, instantáneas de imágenes, notificaciones de precios y otro contenido que no necesite actualizaciones ni cierres posteriores.

## Endpoint

```http
POST /message
```

El cuerpo de la petición debe ser JSON y los campos desconocidos se rechazan. Si un Gateway privado habilita `PUSHGO_TOKEN`, incluya `Authorization: Bearer <token>`.

## Cabeceras

| Encabezado | Requerido | Descripción |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Sí | Solicitar formato del cuerpo. |
| `Authorization: Bearer <token>` | Dependiente del Gateway | Se requiere solo cuando un Gateway privado habilita `PUSHGO_TOKEN`. |

## Campos de petición

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Sí | ID de Channel de destino. |
| `password` | `string` | Sí | Contraseña Channel, normalmente de 8 a 128 caracteres. |
| `title` | `string` | Sí | Título Message, no debe estar vacío. |
| `body` | `string` | No | Se admite el cuerpo Message, Markdown. |
| `op_id` | `string` | No | Clave de idempotencia, 1-128 caracteres, letras/dígitos/`_`/`:`/`-`. |
| `thing_id` | `string` | No | Asocia el mensaje con un Thing existente; 1-64 caracteres, letras/dígitos/`_`/`:`/`-`. |
| `occurred_at` | `number` | No | Momento del mensaje; acepta segundos o milisegundos Unix. Obligatorio cuando se incluye `thing_id`. |
| `severity` | `string` | No | `critical`, `high`, `normal`, `low`; los valores desconocidos se normalizan a `normal`. |
| `ttl` | `number` | No | Tiempo de vencimiento de milisegundos de Unix; El TTL del proveedor tiene un límite de alrededor de 28 días. |
| `url` | `string` | No | URL de destino opcional. |
| `images` | `string[]` | No | Hasta 32 URL de imágenes, con un máximo de 2048 caracteres cada una. |
| `tags` | `string[]` | No | Hasta 32 etiquetas, con un máximo de 64 caracteres cada una, recortadas y deduplicadas. |
| `ciphertext` | `string` | No | Carga útil de texto cifrado E2EE opcional. |
| `metadata` | `object` | No | Pares clave-valor escalares; clave <= 64, valor escalar no vacío <= 512; objetos anidados y arrays se rechazan. |

## Mapeo de gravedad

| `severity` | Nivel de interrupción APNs | Prioridad FCM |
| :--- | :--- | :--- |
| `critical` | `critical` | `HIGH` |
| `high` | `time-sensitive` | `HIGH` |
| `normal` | `active` | `HIGH` |
| `low` | `passive` | `NORMAL` |

## Ejemplo mínimo

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The daily NAS backup has finished.",
    "severity": "normal"
  }'
```

## Asociarse con un Thing

Si la alerta pertenece a una entidad persistente, pase `thing_id`.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
  "title": "Home NAS disk warning",
  "body": "volume1 usage has reached 92%.",
  "severity": "high",
  "tags": ["nas", "disk"]
}
```

## Respuesta exitosa

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` significa que Gateway procesó la petición. `accepted=true` significa que la petición entró en despacho; La visualización final aún depende de los servicios de inserción de la plataforma, el estado del dispositivo y los transportes privados.

## Errores comunes

| Estado | Razón típica |
| :--- | :--- |
| `400` | Falta campo obligatorio, campo desconocido, `title` vacío, `op_id` no válido. |
| `401` | El Gateway privado requiere un token Bearer, pero el encabezado falta o es incorrecto. |
| `404` | Channel no existe o las credenciales no coinciden. |
| `413` | El cuerpo de la petición supera los 32 KB. |
| `503` | Gateway no pudo entrar en despacho por completo; la respuesta puede incluir `accepted=false`. |

Consulte [Límites y errores](/es/reference/limits-errors/) para conocer los límites compartidos.

## Endpoints de compatibilidad

PushGo también proporciona puntos finales de compatibilidad ntfy, Bark y ServerChan para la migración. Su cobertura de campo es limitada; utilice `/message` nativo cuando necesite la semántica de `thing_id`, E2EE o PushGo completa. Consulte la [Guía de migración](/es/guides/migration/).