---
title: Thing API
description: Utilice /thing/create, /thing/update, /thing/archive y /thing/delete para gestionar el estado persistente de la entidad.
---
La API Thing representa objetos duraderos que cambian con el tiempo, como servidores, salas, sensores, servicios de red o tareas largas. Al crear un Thing se devuelve un `thing_id`; las actualizaciones, el archivado y la eliminación usan ese identificador.

## Endpoints

```http
POST /thing/create
POST /thing/update
POST /thing/archive
POST /thing/delete
```

El cuerpo de la petición debe ser JSON y los campos desconocidos se rechazan. Si un Gateway privado habilita `PUSHGO_TOKEN`, incluya `Authorization: Bearer <token>`.

## Cabeceras

| Encabezado | Requerido | Descripción |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Sí | Solicitar formato del cuerpo. |
| `Authorization: Bearer <token>` | Dependiente del Gateway | Se requiere solo cuando un Gateway privado habilita `PUSHGO_TOKEN`. |

## Ciclo de vida

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

## Campos comunes

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Sí | ID de Channel de destino. |
| `password` | `string` | Sí | Contraseña Channel, normalmente de 8 a 128 caracteres. |
| `op_id` | `string` | No | Clave de idempotencia; se genera y se devuelve si se omite. |
| `ciphertext` | `string` | No | Carga útil de texto cifrado E2EE opcional. |

## Campos obligatorios por ruta

| Ruta | Campos comerciales requeridos |
| :--- | :--- |
| `/thing/create` | `observed_at` |
| `/thing/update` | `thing_id`, `observed_at` |
| `/thing/archive` | `thing_id`, `observed_at` |
| `/thing/delete` | `thing_id`, `observed_at` |

## Reglas de campo

| Campo | Tipo | Reglas |
| :--- | :--- | :--- |
| `thing_id` | `string` | Requerido para actualizar, archivar y eliminar; no debe enviarse al crear. |
| `title` | `string` | Recomendado para crear; Actualmente, el Gateway no rechaza el `title` faltante. |
| `description` | `string` | Opcional; las cadenas vacías se consideran faltantes. |
| `tags` | `string[]` | Hasta 32 elementos, con un máximo de 64 caracteres cada uno, recortados y sin duplicados. |
| `primary_image` | `string` | URL opcional, máximo 2048 caracteres. |
| `images` | `string[]` | Hasta 32 URL de imágenes, con un máximo de 2048 caracteres cada una. |
| `created_at` | `number` | Crear únicamente; vuelve a `observed_at` cuando se omite. |
| `deleted_at` | `number` | Eliminar sólo; vuelve a `observed_at` cuando se omite. |
| `observed_at` | `number` | Requerido; Tiempo de observación para esta actualización de estado, milisegundos Unix. |
| `external_ids` | `object` | patrón de clave `[A-Za-z0-9_:.\-]`, clave <= 64; El valor es `string` o `null`. |
| `location_type` + `location_value` | `string` + `string` | Deben presentarse juntos; El tipo es `physical`, `geo`, `cloud`, `datacenter` o `logical`. |
| `attrs` | `object` | Parche de objetos; `null` quita una llave; no se permiten matrices; sólo un nivel de objeto anidado. |
| `metadata` | `object` | Sólo valores escalares; clave <= 64, valor <= 512. |

## Crear un Thing

```bash
curl -X POST https://gateway.pushgo.dev/thing/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Home NAS",
    "description": "Primary storage in the living room rack",
    "observed_at": 1713750000000,
    "tags": ["nas", "home"],
    "location_type": "physical",
    "location_value": "home/living-room",
    "attrs": {
      "online": true,
      "disk_used": 0.72,
      "temperature": 43.2
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
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

Guarde el `thing_id` devuelto; actualizar, archivar y eliminar llamadas lo necesitan.

## Actualizar un Thing

```bash
curl -X POST https://gateway.pushgo.dev/thing/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713750600000,
    "attrs": {
      "disk_used": 0.74,
      "temperature": 44.1
    }
  }'
```

`attrs` es un parche. No es necesario enviar el estado completo cada vez. Para eliminar una clave, pase `null`.

```json
{
  "attrs": {
    "temporary_alarm": null
  }
}
```

## Archivar un Thing

El archivo es para objetos que ya no están activos pero que deben conservar su historial.

```bash
curl -X POST https://gateway.pushgo.dev/thing/archive \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751200000,
    "attrs": {
      "online": false
    }
  }'
```

## Eliminar un Thing

Utilice `/thing/delete` cuando se elimine o retire un objeto.

```bash
curl -X POST https://gateway.pushgo.dev/thing/delete \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751800000,
    "deleted_at": 1713751800000
  }'
```

## Asociar Message y Event

Thing representa un objeto persistente. Las alertas relacionadas pueden usar Message con `thing_id`; Los procesos relacionados pueden utilizar Event con `thing_id`.

| Escenario | Modelo |
| :--- | :--- |
| CPU NAS actual, temperatura, uso del disco | Thing |
| Advertencia de un disco en el NAS | Message + `thing_id` |
| Copia de seguridad NAS de principio a fin | Event + `thing_id` |

## Semántica de respuesta

Las API Thing utilizan el sobre de respuesta compartido. `accepted=true` significa que el Gateway entró en despacho, no que todos los dispositivos hayan mostrado una notificación del sistema.

## Errores comunes

| Estado | Razón típica |
| :--- | :--- |
| `400` | Falta `observed_at`, campo desconocido, `attrs` o `external_ids` no válido. |
| `401` | El token privado Gateway Bearer falta o es incorrecto. |
| `404` | Channel o `thing_id` no existe. |
| `413` | El cuerpo de la petición supera los 32 KB. |
| `503` | El envío no se aceptó por completo. |