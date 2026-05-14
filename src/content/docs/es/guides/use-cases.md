---
title: Casos de uso
description: Aprenda mensajes, eventos y cosas a través de escenarios prácticos de PushGo.
---
Esta página es un libro de cocina de modelado, no una lista de funciones. Cada escenario explica qué modelo usar y por qué es más claro que enviar notificaciones de texto sin formato para todo.

## Servidores y NAS

### Alerta de disco: Message

Cuando el uso del disco cruza un umbral, una alerta fuerte es suficiente.

```bash
USAGE=$(df / | awk 'NR==2 { gsub("%", "", $5); print $5 }')

if [ "$USAGE" -ge 90 ]; then
  curl -X POST https://gateway.pushgo.dev/message \
    -H "Content-Type: application/json" \
    -d '{
      "channel_id": "YOUR_CHANNEL_ID",
      "password": "YOUR_CHANNEL_PASSWORD",
      "title": "Disk space warning",
      "body": "Root partition usage has reached '"$USAGE"'%.",
      "severity": "high",
      "tags": ["nas", "disk"]
    }'
fi
```

### Trabajo de copia de seguridad: Event

Una copia de seguridad tiene un inicio, un progreso y un resultado. Event mantiene esas actualizaciones en un ciclo de vida.

```bash
curl -X POST https://gateway.pushgo.dev/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "NAS backup",
    "status": "running",
    "message": "Backup started",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000
  }'
```

Almacene el `event_id` devuelto, luego llame a `/event/update` y `/event/close` durante la carga, verificación, finalización o falla.

### Panel de estado del host: Thing

Si desea ver el estado actual de un servidor a lo largo del tiempo, modele el host como Thing.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Home NAS",
  "observed_at": 1713750000000,
  "tags": ["nas", "home"],
  "attrs": {
    "online": true,
    "cpu": 0.18,
    "disk_used": 0.72,
    "temperature": 43.2
  }
}
```

## Home Assistant e IoT

### Habitación o Sensor: Thing

La temperatura, la humedad y la luz son estados persistentes. Modele cada habitación o dispositivo como Thing y actualice `attrs`.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Living room",
  "observed_at": 1713750000000,
  "external_ids": {
    "home_assistant": "sensor.living_room_temperature"
  },
  "location_type": "physical",
  "location_value": "home/living-room",
  "attrs": {
    "temperature": 22.5,
    "humidity": 0.46
  }
}
```

### Puerta abierta a cerrada: Event

Una puerta abierta es un proceso que finaliza cuando la puerta se cierra.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Balcony door open",
  "status": "open",
  "message": "The balcony door has been open for more than 5 minutes.",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "tags": ["home", "door"]
}
```

### Instantánea de movimiento: Message

Una cámara con detección de movimiento con una instantánea es una Message.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Motion detected",
  "body": "Entry camera detected motion.",
  "severity": "high",
  "images": ["https://example.com/snapshot.jpg"],
  "tags": ["camera", "security"]
}
```

## DevOps y automatización

### Canal de implementación: Event

Las implementaciones tienen un estado de ciclo de vida. Cree desde el principio, actualice en las etapas principales y cierre con éxito o fracaso.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Production deployment",
  "status": "building",
  "message": "Building image",
  "severity": "normal",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "attrs": {
    "service": "api",
    "revision": "8f3c2a1"
  }
}
```

En caso de falla, suba `severity` a `critical` y cierre el evento con `status=failed`.

### Estado del servicio: Thing

El estado en línea, la latencia y la versión son el estado actual.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "API service",
  "observed_at": 1713750000000,
  "location_type": "cloud",
  "location_value": "prod",
  "attrs": {
    "healthy": true,
    "latency_ms": 83,
    "version": "1.8.4"
  }
}
```

### Alerta de falla: Message

Incluso si Event registra el ciclo de vida de la implementación, puede enviar un Message al punto de falla para obtener una mayor visibilidad móvil.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Production deployment failed",
  "body": "The api service deployment failed. Check the pipeline logs.",
  "severity": "critical",
  "tags": ["deploy", "prod"]
}
```

## Automatización personal

### Monitor de precios: Message

Un umbral de precio suele ser una alerta.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Price dropped",
  "body": "The tracked product is now 199.",
  "severity": "normal",
  "url": "https://example.com/product"
}
```

### Trabajo largo de descarga o transcodificación: Event

Las descargas, la transcodificación y los trabajos de capacitación son eventos porque comienzan, se actualizan y finalizan.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Video transcoding",
  "status": "running",
  "message": "45% complete",
  "severity": "normal",
  "event_time": 1713750000000,
  "attrs": {
    "progress": 0.45
  }
}
```

## Hoja de trucos de modelado

| Escenario | Modelo | Por qué |
| :--- | :--- | :--- |
| Fracaso, éxito, caída de precios, alerta | Message | Alerta única. |
| Implementación, copia de seguridad, transcodificación, incidente | Event | Proceso con actualizaciones y un resultado. |
| Servidor, sensor, habitación, servicio | Thing | Objeto persistente con estado actual. |
| Alerta en un dispositivo específico | Thing + Message | La entidad y la alerta permanecen conectadas. |
| Incidente en un servicio | Thing + Event | El servicio es la entidad; El incidente es el ciclo de vida. |