---
title: Message API
description: Senden Sie einmalige Benachrichtigungen mit /message und verstehen Sie Felder, Antworten und Versandsemantik.
---
Die Message-API sendet transiente Benachrichtigungen der obersten Ebene. Verwenden Sie es für Warnungen, Abschlussmeldungen, Bildschnappschüsse, Preisbenachrichtigungen und andere Inhalte, die später nicht aktualisiert oder geschlossen werden müssen.

## Endpunkt

```http
POST /message
```

Der Anfragebody muss JSON sein und unbekannte Felder werden abgelehnt. Wenn ein privater Gateway `PUSHGO_TOKEN` aktiviert, schließen Sie `Authorization: Bearer <token>` ein.

## Kopfzeilen

| Kopfzeile | Erforderlich | Beschreibung |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Ja | Textformat anfordern. |
| `Authorization: Bearer <token>` | Gateway-abhängig | Nur erforderlich, wenn ein privater Gateway `PUSHGO_TOKEN` aktiviert. |

## Anforderungsfelder

| Feld | Geben Sie | ein Erforderlich | Beschreibung |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Ja | Zielkanal-ID. |
| `password` | `string` | Ja | Channel-Passwort, normalerweise 8-128 Zeichen. |
| `title` | `string` | Ja | Message-Titel, darf nicht leer sein. |
| `body` | `string` | Nein | Message-Text; Markdown wird unterstützt. |
| `op_id` | `string` | Nein | Idempotenzschlüssel, 1-128 Zeichen, Buchstaben/Ziffern/`_`/`:`/`-`. |
| `thing_id` | `string` | Nein | Ordnen Sie die Nachricht einem vorhandenen Thing zu. |
| `occurred_at` | `number` | Nein | Zeitpunkt, zu dem die Nachricht aufgetreten ist, Unix-Millisekunden. |
| `severity` | `string` | Nein | `critical`, `high`, `normal`, `low`; Unbekannte Werte normalisieren sich zu `normal`. |
| `ttl` | `number` | Nein | Unix-Millisekunden-Ablaufzeit; Die TTL des Anbieters ist auf etwa 28 Tage begrenzt. |
| `url` | `string` | Nein | Optionale Click-through-URL. |
| `images` | `string[]` | Nein | Bis zu 32 Bild-URLs mit jeweils maximal 2048 Zeichen. |
| `tags` | `string[]` | Nein | Bis zu 32 Tags mit jeweils maximal 64 Zeichen, gekürzt und dedupliziert. |
| `ciphertext` | `string` | Nein | Optionale E2EE-Chiffretext-Nutzlast. |
| `metadata` | `object` | Nein | Benutzerdefinierte skalare Schlüsselwerte; Schlüssel <= 64, Wert <= 512. |

## Schweregradzuordnung

| `severity` | APNs Unterbrechungsebene | FCM Priorität |
| :--- | :--- | :--- |
| `critical` | `critical` | `HIGH` |
| `high` | `time-sensitive` | `HIGH` |
| `normal` | `active` | `HIGH` |
| `low` | `passive` | `NORMAL` |

## Minimales Beispiel

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

## Mit einem Thing verknüpfen

Wenn die Warnung zu einer persistenten Entität gehört, übergeben Sie `thing_id`.

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

## Erfolgsantwort

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

`success=true` bedeutet, dass der Gateway die Anfrage verarbeitet hat. `accepted=true` bedeutet, dass die Anforderung versandt wurde; Die endgültige Anzeige hängt immer noch von Plattform-Push-Diensten, Gerätestatus und privaten Transporten ab.

## Häufige Fehler

| Status | Typischer Grund |
| :--- | :--- |
| `400` | Fehlendes erforderliches Feld, unbekanntes Feld, leeres `title`, ungültiges `op_id`. |
| `401` | Für ein privates Gateway ist ein Bearer-Token erforderlich, aber der Header fehlt oder ist falsch. |
| `404` | Channel existiert nicht oder die Anmeldeinformationen stimmen nicht überein. |
| `413` | Der Anforderungstext überschreitet 32 KB. |
| `503` | Gateway konnte nicht vollständig in den Versand gelangen; Die Antwort kann `accepted=false` enthalten. |

Gemeinsame Grenzwerte finden Sie unter [Grenzwerte und Fehler](/de/reference/limits-errors/).

## Kompatibilitätsendpunkte

PushGo bietet außerdem Kompatibilitätsendpunkte ntfy, Bark und ServerChan für die Migration. Ihre Feldabdeckung ist begrenzt; Verwenden Sie natives `/message`, wenn Sie `thing_id`-, E2EE- oder vollständige PushGo-Semantik benötigen. Siehe [Migrationsleitfaden](/de/guides/migration/).