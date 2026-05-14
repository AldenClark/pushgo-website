---
title: Event API
description: Verwenden Sie /event/create, /event/update und /event/close, um aktualisierbare Lebenszyklen zu modellieren.
---
Die Event-API stellt einen Prozess dar, der sich im Laufe der Zeit ändert und schließlich endet. Das Erstellen eines Ereignisses gibt ein `event_id` zurück; Aktualisierungen und Abschlussaufrufe verwenden diese ID, um mit demselben Lebenszyklus verbunden zu bleiben.

## Endpunkte

```http
POST /event/create
POST /event/update
POST /event/close
```

Der Anfragebody muss JSON sein und unbekannte Felder werden abgelehnt. Wenn ein privater Gateway `PUSHGO_TOKEN` aktiviert, schließen Sie `Authorization: Bearer <token>` ein.

## Kopfzeilen

| Kopfzeile | Erforderlich | Beschreibung |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Ja | Textformat anfordern. |
| `Authorization: Bearer <token>` | Gateway-abhängig | Nur erforderlich, wenn ein privater Gateway `PUSHGO_TOKEN` aktiviert. |

## Lebenszyklus

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   marks the event as ended
```

## Gemeinsame Felder

| Feld | Geben Sie | ein Erforderlich | Beschreibung |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Ja | Zielkanal-ID. |
| `password` | `string` | Ja | Channel-Passwort, normalerweise 8-128 Zeichen. |
| `op_id` | `string` | Nein | Idempotenzschlüssel; generiert und zurückgegeben, wenn es weggelassen wird. |
| `thing_id` | `string` | Nein | Verknüpfen Sie diesen Ereignisversand mit einem vorhandenen Thing. |
| `ciphertext` | `string` | Nein | Optionale E2EE-Chiffretext-Nutzlast. |

## Erforderliche Felder nach Route

| Route | Erforderliche Geschäftsfelder |
| :--- | :--- |
| `/event/create` | `title`, `status`, `message`, `severity`, `event_time` |
| `/event/update` | `event_id`, `status`, `message`, `severity`, `event_time` |
| `/event/close` | `event_id`, `status`, `message`, `severity`, `event_time` |

## Feldregeln

| Feld | Geben Sie | ein Regeln |
| :--- | :--- | :--- |
| `event_id` | `string` | Erforderlich zum Aktualisieren und Schließen; Darf nicht beim Erstellen gesendet werden. |
| `title` | `string` | Erforderlich beim Erstellen; optional beim Aktualisieren und Schließen. |
| `description` | `string` | Optional; Leere Zeichenfolgen werden als fehlend behandelt. |
| `status` | `string` | Erforderlich; nicht leer, maximal 24 Zeichen. |
| `message` | `string` | Erforderlich; nicht leer, max. 512 Zeichen. |
| `severity` | `string` | Erforderlich; nur `critical`, `high`, `normal`, `low`. |
| `event_time` | `number` | Erforderlich; als dieses Update stattfand, Unix-Millisekunden. |
| `started_at` | `number` | Nur erstellen; Gesamtstartzeit der Veranstaltung. |
| `ended_at` | `number` | Nur schließen; Gesamtendzeit der Veranstaltung. |
| `tags` | `string[]` | Bis zu 32 Elemente mit jeweils maximal 64 Zeichen, gekürzt und dedupliziert. |
| `images` | `string[]` | Bis zu 32 Bild-URLs mit jeweils maximal 2048 Zeichen. |
| `attrs` | `object` | Objektpatch; `null` entfernt einen Schlüssel; Arrays sind nicht zulässig. |
| `metadata` | `object` | Nur Skalarwerte; Schlüssel <= 64, Wert <= 512. |

## Event erstellen

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

Antwort:

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

Bewahren Sie den zurückgegebenen `event_id` auf. Update- und Close-Aufrufe benötigen es.

## Event aktualisieren

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

`/event/update` kann mehrmals aufgerufen werden. Jedes Update sollte die aktuelle Änderung beschreiben und nicht den gesamten Verlauf wiederholen.

## Event schließen

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

Bei Ausfällen verwenden Sie `status=failed` und erhöhen gegebenenfalls `severity`.

## Mit einem Thing verknüpfen

Wenn das Ereignis auf einer dauerhaften Entität auftritt, schließen Sie `thing_id` ein.

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

Thing identifiziert das Objekt; Event beschreibt den Prozess, der dabei abläuft.

## Antwortsemantik

Event-APIs verwenden den gemeinsamen Antwortumschlag. `accepted=true` bedeutet, dass der Gateway im Versand ist, nicht dass jedes Gerät eine Systembenachrichtigung angezeigt hat.

## Häufige Fehler

| Status | Typischer Grund |
| :--- | :--- |
| `400` | Fehlendes für die Route erforderliches Feld, unbekanntes Feld, ungültiges `severity`, ungültiges `attrs`. |
| `401` | Privates Gateway Bearer-Token fehlt oder ist falsch. |
| `404` | Channel oder `event_id` existiert nicht. |
| `413` | Der Anforderungstext überschreitet 32 KB. |
| `503` | Der Versand gelang nicht vollständig. |