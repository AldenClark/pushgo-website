---
title: Thing API
description: Verwenden Sie /thing/create, /thing/update, /thing/archive und /thing/delete, um den persistenten Entitätsstatus zu verwalten.
---
Die Thing-API stellt langlebige Objekte dar, die sich im Laufe der Zeit ändern, wie z. B. Server, Räume, Sensoren, Netzwerkdienste oder lang laufende Aufgaben. Beim Erstellen eines Thing wird ein `thing_id` zurückgegeben. Aktualisierungs-, Archivierungs- und Löschaufrufe verwenden diese ID.

## Endpunkte

```http
POST /thing/create
POST /thing/update
POST /thing/archive
POST /thing/delete
```

Der Anfragebody muss JSON sein und unbekannte Felder werden abgelehnt. Wenn ein privater Gateway `PUSHGO_TOKEN` aktiviert, schließen Sie `Authorization: Bearer <token>` ein.

## Kopfzeilen

| Kopfzeile | Erforderlich | Beschreibung |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Ja | Textformat anfordern. |
| `Authorization: Bearer <token>` | Gateway-abhängig | Nur erforderlich, wenn ein privater Gateway `PUSHGO_TOKEN` aktiviert. |

## Lebenszyklus

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

## Gemeinsame Felder

| Feld | Geben Sie | ein Erforderlich | Beschreibung |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Ja | Zielkanal-ID. |
| `password` | `string` | Ja | Channel-Passwort, normalerweise 8-128 Zeichen. |
| `op_id` | `string` | Nein | Idempotenzschlüssel; generiert und zurückgegeben, wenn es weggelassen wird. |
| `ciphertext` | `string` | Nein | Optionale E2EE-Chiffretext-Nutzlast. |

## Erforderliche Felder nach Route

| Route | Erforderliche Geschäftsfelder |
| :--- | :--- |
| `/thing/create` | `observed_at` |
| `/thing/update` | `thing_id`, `observed_at` |
| `/thing/archive` | `thing_id`, `observed_at` |
| `/thing/delete` | `thing_id`, `observed_at` |

## Feldregeln

| Feld | Geben Sie | ein Regeln |
| :--- | :--- | :--- |
| `thing_id` | `string` | Erforderlich für Aktualisierung, Archivierung und Löschung; Darf nicht beim Erstellen gesendet werden. |
| `title` | `string` | Empfohlen beim Erstellen; Der Gateway weist derzeit fehlende `title` nicht zurück. |
| `description` | `string` | Optional; Leere Zeichenfolgen werden als fehlend behandelt. |
| `tags` | `string[]` | Bis zu 32 Elemente mit jeweils maximal 64 Zeichen, gekürzt und dedupliziert. |
| `primary_image` | `string` | Optionale URL, maximal 2048 Zeichen. |
| `images` | `string[]` | Bis zu 32 Bild-URLs mit jeweils maximal 2048 Zeichen. |
| `created_at` | `number` | Nur erstellen; Fällt auf `observed_at` zurück, wenn es weggelassen wird. |
| `deleted_at` | `number` | Nur löschen; Fällt auf `observed_at` zurück, wenn es weggelassen wird. |
| `observed_at` | `number` | Erforderlich; Beobachtungszeit für diese Statusaktualisierung, Unix-Millisekunden. |
| `external_ids` | `object` | Schlüsselmuster `[A-Za-z0-9_:.\-]`, Schlüssel <= 64; Der Wert ist `string` oder `null`. |
| `location_type` + `location_value` | `string` + `string` | Müssen zusammen erscheinen; Typ ist `physical`, `geo`, `cloud`, `datacenter` oder `logical`. |
| `attrs` | `object` | Objektpatch; `null` entfernt einen Schlüssel; Arrays sind nicht erlaubt; nur eine verschachtelte Objektebene. |
| `metadata` | `object` | Nur Skalarwerte; Schlüssel <= 64, Wert <= 512. |

## Thing erstellen

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

Antwort:

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

Bewahren Sie den zurückgegebenen `thing_id` auf. Aktualisierungs-, Archivierungs- und Löschaufrufe benötigen dies.

## Thing aktualisieren

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

`attrs` ist ein Patch. Sie müssen nicht jedes Mal den vollständigen Status senden. Um einen Schlüssel zu entfernen, geben Sie `null` ein.

```json
{
  "attrs": {
    "temporary_alarm": null
  }
}
```

## Thing archivieren

Das Archiv ist für Objekte gedacht, die nicht mehr aktiv sind, aber den Verlauf behalten sollen.

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

## Einen Thing löschen

Verwenden Sie `/thing/delete`, wenn ein Objekt entfernt oder außer Dienst gestellt wird.

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

## Message und Event verknüpfen

Thing stellt ein persistentes Objekt dar. Zugehörige Warnungen können Message mit `thing_id` verwenden; zugehörige Prozesse können Event mit `thing_id` verwenden.

| Szenario | Modell |
| :--- | :--- |
| Aktuelle NAS-CPU, Temperatur, Festplattennutzung | Thing |
| Eine Festplattenwarnung auf dem NAS | Message + `thing_id` |
| NAS-Backup von Anfang bis Ende | Event + `thing_id` |

## Antwortsemantik

Thing-APIs verwenden den gemeinsamen Antwortumschlag. `accepted=true` bedeutet, dass der Gateway im Versand ist, nicht dass jedes Gerät eine Systembenachrichtigung angezeigt hat.

## Häufige Fehler

| Status | Typischer Grund |
| :--- | :--- |
| `400` | Fehlendes `observed_at`, unbekanntes Feld, ungültiges `attrs` oder `external_ids`. |
| `401` | Privates Gateway Bearer-Token fehlt oder ist falsch. |
| `404` | Channel oder `thing_id` existiert nicht. |
| `413` | Der Anforderungstext überschreitet 32 KB. |
| `503` | Der Versand gelang nicht vollständig. |