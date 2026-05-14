---
title: Migrationsleitfaden
description: Migrieren Sie vorhandene ntfy-, Bark-, ServerChan- oder Webhook-Skripte nach PushGo.
---
Für die Migration auf PushGo ist nicht das gleichzeitige Umschreiben jedes Skripts erforderlich. Beginnen Sie mit Kompatibilitätsendpunkten, damit vorhandene Skripte weiterhin funktionieren, und aktualisieren Sie dann wichtige Workflows auf native Message-, Event- oder Thing-APIs.

## Empfohlener Pfad

1. **Endpunkt ändern**: Richten Sie Ihre ntfy-, Bark- oder ServerChan-Anfrage auf den PushGo-Kompatibilitätsendpunkt.
2. **Ersetzen Sie den Schlüssel**: Verwenden Sie `<channel_id>:<password>` als Kompatibilitätsschlüssel.
3. **Felder normalisieren**: Ordnen Sie Priorität, Ebene, Gruppe, Symbol und ähnliche Felder den Feldern `severity`, `tags`, `images` oder `metadata` zu.
4. **Modelle aufwerten**: Einmalige Warnungen bleiben Message; Lebenszyklen werden zu Event; persistenter Status wird zu Thing.

## Kompatibilitätsendpunkte

| Quelle | Methode | PushGo-Pfad | Schlüsselstandort |
| :--- | :--- | :--- | :--- |
| ntfy | `POST` / `PUT` | `/ntfy/{topic}` | `{topic}` = `<channel_id>:<password>` |
| ServerChan | `GET` / `POST` | `/serverchan/{sendkey}` | `{sendkey}` = `<channel_id>:<password>` |
| Bark v1 | `GET` | `/bark/{device_key}/{body}` | `{device_key}` = `<channel_id>:<password>` |
| Bark v2 | `POST` | `/bark/push` | JSON-Feld `device_key` |

Kompatibilitätsendpunkte reduzieren die Migrationskosten. Sie drücken nicht das vollständige PushGo-Datenmodell aus. Verwenden Sie native APIs, wenn Sie `thing_id`-, Event-Lebenszyklen oder den vollständigen Thing-Status benötigen.

## Von ntfy

Alte Anfrage:

```bash
curl -d "NAS backup completed" https://ntfy.example.com/my-topic
```

PushGo-Kompatibilitätsendpunkt:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -H "Priority: 3" \
  -d "NAS backup completed"
```

Nativer Message:

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

## Von Bark

Bark fügt üblicherweise den Geräteschlüssel in den Pfad ein. Ersetzen Sie diesen Schlüssel durch `<channel_id>:<password>`.

```bash
curl "https://gateway.pushgo.dev/bark/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD/Server%20alert?title=CPU%20High&level=timeSensitive"
```

Wenn Sie bereits JSON-Anfragen verwenden, ziehen Sie es vor, direkt auf natives Message zu migrieren. Native APIs drücken `images`, `tags`, `metadata`, `thing_id` und E2EE klarer aus.

## Von ServerChan

```bash
curl -X POST https://gateway.pushgo.dev/serverchan/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -d "title=Deployment completed" \
  -d "desp=Production deployment succeeded"
```

ServerChan ist größtenteils ein einmaliges Alarmmodell. Wenn Ihr Skript „gestartet“, „läuft“ und „fertig“ sendet, führen Sie ein direktes Upgrade auf Event durch.

## Wann sollte ein Upgrade auf Event durchgeführt werden?

Wenn dieselbe Aufgabe mehrere Phasenaktualisierungen sendet, ist Event besser geeignet.

| Altes Skriptverhalten | Event-Ausdruck |
| :--- | :--- |
| Senden Sie „Deployment gestartet“ | `/event/create` |
| Senden Sie „Build abgeschlossen“ oder „Veröffentlichung“ | `/event/update` |
| Senden Sie „Deployment erfolgreich/fehlgeschlagen“ | `/event/close` |

Dadurch können Clients eine zusammenhängende Zeitleiste anstelle unabhängiger Nachrichten anzeigen.

## Wann sollte ein Upgrade auf Thing durchgeführt werden?

Wenn Ihr Skript wiederholt den aktuellen Status desselben Objekts meldet, verwenden Sie Thing.

| Altes Skriptverhalten | Thing-Ausdruck |
| :--- | :--- |
| CPU/Speicher jede Minute senden | `/thing/update` mit `attrs` |
| Raumtemperatur wiederholt senden | Ein Raum oder Sensor pro `thing_id` |
| Service Online-/Offline-Benachrichtigungen | Thing für den Dienst, Message oder Event für Vorfälle |

## Kompatibilitätsgrenzen

- Kompatibilitätsschlüssel enthalten das Channel-Passwort; schreiben Sie sie nicht in öffentliche Protokolle.
- Der ntfy-Kompatibilitätsendpunkt unterstützt `thing_id` nicht.
- Kompatibilitätsendpunkte können nicht den gesamten Thing-Lebenszyklus abbilden.
- Anbieterspezifische Prioritäten und Feldnamen werden zugeordnet und möglicherweise nicht eins zu eins beibehalten.
- Komplexe Metadaten, E2EE und Entitätsbeziehungen sind nach der Migration auf native APIs klarer.