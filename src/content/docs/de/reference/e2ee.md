---
title: Ende-zu-Ende-Verschlüsselung
description: Verwenden Sie Chiffretext, damit Clients vertrauliche PushGo-Felder lokal entschlüsseln.
---
PushGo E2EE schützt sensible Geschäftsfelder. Der Absender verschlüsselt Felder in `ciphertext`, der Gateway leitet diesen Chiffretext weiter und Clients entschlüsseln lokal, nachdem ein Schlüssel konfiguriert wurde.

## Was es schützt

| Inhalt | Geschützt durch E2EE | Notizen |
| :--- | :--- | :--- |
| Geschäftsfelder innerhalb `ciphertext` | Ja | Der Gateway kann keinen Klartext lesen. |
| Einfache Anfragefelder | Nein | `channel_id`, `password`, `severity` und Routen-IDs sind normale Anforderungsfelder. |
| HTTP-Header | Nein | Geschützt durch HTTPS/TLS, nicht durch E2EE. |
| Liefermetadaten | Nein | Der Gateway benötigt weiterhin grundlegende Metadaten für Authentifizierung, Routing und Versand. |

E2EE ist kein Ersatz für die Gateway-Authentifizierung. Sie benötigen weiterhin Channel-Zugangsdaten, optionale Gateway Bearer-Token und HTTPS.

## Verschlüsselungsformat

PushGo-Clients unterstützen AES-GCM. Die Schlüssellänge bestimmt die AES-Variante.

| Schlüssellänge | Algorithmus | Nonce / IV | Auth-Tag |
| :--- | :--- | :--- | :--- |
| 16 Byte | AES-128-GCM | 12 Byte | 16 Byte |
| 24 Byte | AES-192-GCM | 12 Byte | 16 Byte |
| 32 Byte | AES-256-GCM | 12 Byte | 16 Byte |

Binäres Layout:

```text
[ ciphertext (N bytes) ][ auth tag (16 bytes) ][ nonce / iv (12 bytes) ]
```

Codieren Sie den vollständigen Binärblob mit Base64 und platzieren Sie ihn im API `ciphertext`-Feld.

## Verschlüsselbare Felder

Nach der Entschlüsselung muss `ciphertext` ein JSON-Objekt enthalten. Clients erkennen die folgenden kanonischen Felder und schreiben sie zurück in die Benachrichtigungsnutzlast.

### Message Felder

| Feld | Geben Sie | ein Verhalten |
| :--- | :--- | :--- |
| `title` | `string` | Überschreibt den Benachrichtigungstitel. |
| `body` | `string` | Überschreibt den Nachrichtentext. |
| `url` | `string` | Überschreibt die Click-through-URL. |
| `images` | `string[]`- oder JSON-Zeichenfolge | Überschreibt die Bildliste. |
| `tags` | `string[]`- oder JSON-Zeichenfolge | Überschreibt die Tag-Liste. |
| `metadata` | `object`- oder JSON-Zeichenfolge | Überschreibt Metadaten. |

### Event Felder

| Feld | Geben Sie | ein Verhalten |
| :--- | :--- | :--- |
| `description` | `string` | Überschreibt die Ereignisbeschreibung. |
| `status` | `string` | Überschreibt den Ereignisstatus. |
| `message` | `string` | Überschreibt die Ereignismeldung. |
| `started_at` | `number` | Überschreibt die Startzeit des Ereignisses. |
| `ended_at` | `number` | Überschreibt die Endzeit des Ereignisses. |
| `attrs` | `object`- oder JSON-Zeichenfolge | Überschreibt den Patch für Ereignisattribute. |

### Thing Felder

| Feld | Geben Sie | ein Verhalten |
| :--- | :--- | :--- |
| `primary_image` | `string` | Überschreibt das primäre Bild. |
| `state` | `string` | Überschreibt den Entitätsstatus. |
| `created_at` | `number` | Überschreibt die Erstellungszeit. |
| `deleted_at` | `number` | Überschreibt die Löschzeit. |
| `external_ids` | `object`- oder JSON-Zeichenfolge | Überschreibt externe IDs. |
| `location_type` | `string` | Überschreibt den Standorttyp. |
| `location_value` | `string` | Überschreibt den Standortwert. |
| `location` | `object`- oder JSON-Zeichenfolge | Überschreibt das Standortobjekt. |

:::note
Felder, die für Routing und Lieferpriorität benötigt werden, wie z. B. `channel_id`, `password`, `event_id`, `thing_id`, `event_time`, `observed_at` und `severity`, sollten normalerweise Klartext bleiben.
:::

## Python-Beispiel

```python
import base64
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_payload(key_hex, payload):
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    plaintext = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    cipher_and_tag = aesgcm.encrypt(nonce, plaintext, None)
    return base64.b64encode(cipher_and_tag + nonce).decode("utf-8")


payload = {
    "title": "Database lag",
    "body": "Replica lag exceeded 60 seconds.",
    "tags": ["encrypted", "database"],
    "metadata": {"source": "replica-monitor"}
}

key_hex = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
print(encrypt_payload(key_hex, payload))
```

Das Beispiel `key_hex` ist ein 32-Byte-Schlüssel für AES-256-GCM. Verwenden Sie in der Produktion einen sicher generierten Zufallsschlüssel und konfigurieren Sie denselben Schlüssel lokal im Client.

## API-Nutzung

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Encrypted message",
    "body": "Your client will try to decrypt ciphertext.",
    "severity": "normal",
    "ciphertext": "BASE64_ENCODED_CIPHERTEXT"
  }'
```

Einfache `title` und `body` können als Ersatzanzeige für Clients ohne Schlüssel oder bei fehlgeschlagener Entschlüsselung dienen. Platzieren Sie wirklich sensible Inhalte im `ciphertext`.

## Entschlüsselungszustände

| Status | Bedeutung |
| :--- | :--- |
| `decryptOk` | Die Entschlüsselung war erfolgreich und mindestens ein Feld wurde angewendet. |
| `decryptFailed` | Geheimtext ist vorhanden, aber die Entschlüsselung oder Analyse ist fehlgeschlagen. |
| `notConfigured` | Für den Client ist kein verwendbarer Schlüssel konfiguriert. |
| `algMismatch` | Der konfigurierte Algorithmus passt nicht zur Nutzlast. |

## Fehlerbehebung

| Problem | Prüfen |
| :--- | :--- |
| Entschlüsselung schlägt fehl | Gleicher Schlüssel, vollständiges Base64 und binäres Layout `ciphertext + tag + nonce`. |
| Der Client überschreibt keine Felder | Entschlüsseltes JSON muss ein Objekt sein und Feldnamen müssen kanonisch sein. |
| Gateway kann den Titel | immer noch sehen Einfache Anforderungsfelder sind nicht E2EE-geschützt; Setzen Sie sensible Titel in `ciphertext`. |
| `severity` ist nicht verschlüsselt | Dies wird empfohlen, da die Gateway- und Plattform-Push-Dienste Prioritätsinformationen benötigen. |