---
title: Anwendungsfälle
description: Lernen Sie Nachrichten, Ereignisse und Dinge anhand praktischer PushGo-Szenarien.
---
Bei dieser Seite handelt es sich um ein Modellierungskochbuch, nicht um eine Funktionsliste. In jedem Szenario wird erläutert, welches Modell verwendet werden soll und warum es klarer ist, als für alles Klartextbenachrichtigungen zu senden.

## Server und NAS

### Festplattenwarnung: Message

Wenn die Festplattennutzung einen Schwellenwert überschreitet, reicht eine einzige starke Warnung aus.

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

### Sicherungsauftrag: Event

Ein Backup hat einen Start, einen Fortschritt und ein Ergebnis. Event hält diese Updates in einem Lebenszyklus.

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

Speichern Sie den zurückgegebenen `event_id` und rufen Sie dann `/event/update` und `/event/close` während des Hochladens, der Überprüfung, des Abschlusses oder eines Fehlers auf.

### Host-Statusfeld: Thing

Wenn Sie den aktuellen Status eines Servers im Zeitverlauf sehen möchten, modellieren Sie den Host als Thing.

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

## Home Assistant und IoT

### Raum oder Sensor: Thing

Temperatur, Luftfeuchtigkeit und Licht sind dauerhafte Zustände. Modellieren Sie jeden Raum oder jedes Gerät als Thing und aktualisieren Sie `attrs`.

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

### Tür offen bis geschlossen: Event

Eine offene Tür ist ein Vorgang, der mit dem Schließen der Tür endet.

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

### Bewegungsschnappschuss: Message

Eine Kamerabewegungserkennung mit einem Schnappschuss ist ein Message.

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

## DevOps und Automatisierung

### Deploymentspipeline: Event

Deployments haben einen Lebenszyklusstatus. Am Anfang erstellen, in wichtigen Phasen aktualisieren und mit Erfolg oder Misserfolg abschließen.

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

Erhöhen Sie bei einem Misserfolg `severity` auf `critical` und schließen Sie das Ereignis mit `status=failed`.

### Dienstzustand: Thing

Online-Status, Latenz und Version sind der aktuelle Status.

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

### Fehlerwarnung: Message

Selbst wenn Event den Deploymentslebenszyklus aufzeichnet, können Sie für eine bessere mobile Sichtbarkeit einen Message an der Fehlerstelle senden.

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

## Persönliche Automatisierung

### Preismonitor: Message

Bei einem Preisschwellenwert handelt es sich in der Regel um einen Alarm.

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

### Langer Download- oder Transkodierungsauftrag: Event

Downloads, Transkodierung und Schulungsaufträge sind Ereignisse, da sie beginnen, aktualisiert und enden.

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

## Modellierungs-Spickzettel

| Szenario | Modell | Warum |
| :--- | :--- | :--- |
| Misserfolg, Erfolg, Preisverfall, Alarm | Message | Einmalige Warnung. |
| Deployment, Backup, Transkodierung, Vorfall | Event | Prozess mit Aktualisierungen und einem Ergebnis. |
| Server, Sensor, Raum, Service | Thing | Persistentes Objekt mit aktuellem Status. |
| Warnung auf einem bestimmten Gerät | Thing + Message | Die Entität und die Warnung bleiben verbunden. |
| Vorfall bei einem Dienst | Thing + Event | Der Dienst ist die Entität; Vorfall ist der Lebenszyklus. |