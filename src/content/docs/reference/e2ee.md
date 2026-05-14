---
title: End-to-End Encryption
description: Use ciphertext so clients decrypt sensitive PushGo fields locally.
---

PushGo E2EE protects sensitive business fields. The sender encrypts fields into `ciphertext`, the Gateway relays that ciphertext, and clients decrypt locally after a key is configured.

## What It Protects

| Content | Protected by E2EE | Notes |
| :--- | :--- | :--- |
| Business fields inside `ciphertext` | Yes | The Gateway cannot read plaintext. |
| Plain request fields | No | `channel_id`, `password`, `severity`, and route IDs are normal request fields. |
| HTTP headers | No | Protected by HTTPS/TLS, not E2EE. |
| Delivery metadata | No | The Gateway still needs basic metadata for auth, routing, and dispatch. |

E2EE is not a replacement for Gateway authentication. You still need channel credentials, optional Gateway Bearer tokens, and HTTPS.

## Encryption Format

PushGo clients support AES-GCM. The key length determines the AES variant.

| Key length | Algorithm | Nonce / IV | Auth tag |
| :--- | :--- | :--- | :--- |
| 16 bytes | AES-128-GCM | 12 bytes | 16 bytes |
| 24 bytes | AES-192-GCM | 12 bytes | 16 bytes |
| 32 bytes | AES-256-GCM | 12 bytes | 16 bytes |

Binary layout:

```text
[ ciphertext (N bytes) ][ auth tag (16 bytes) ][ nonce / iv (12 bytes) ]
```

Base64-encode the full binary blob and place it in the API `ciphertext` field.

## Encryptable Fields

After decryption, `ciphertext` must contain a JSON object. Clients recognize the following canonical fields and write them back into the notification payload.

### Message Fields

| Field | Type | Behavior |
| :--- | :--- | :--- |
| `title` | `string` | Overrides notification title. |
| `body` | `string` | Overrides message body. |
| `url` | `string` | Overrides click-through URL. |
| `images` | `string[]` or JSON string | Overrides image list. |
| `tags` | `string[]` or JSON string | Overrides tag list. |
| `metadata` | `object` or JSON string | Overrides metadata. |

### Event Fields

| Field | Type | Behavior |
| :--- | :--- | :--- |
| `description` | `string` | Overrides event description. |
| `status` | `string` | Overrides event status. |
| `message` | `string` | Overrides event message. |
| `started_at` | `number` | Overrides event start time. |
| `ended_at` | `number` | Overrides event end time. |
| `attrs` | `object` or JSON string | Overrides event attrs patch. |

### Thing Fields

| Field | Type | Behavior |
| :--- | :--- | :--- |
| `primary_image` | `string` | Overrides primary image. |
| `state` | `string` | Overrides entity state. |
| `created_at` | `number` | Overrides creation time. |
| `deleted_at` | `number` | Overrides deletion time. |
| `external_ids` | `object` or JSON string | Overrides external IDs. |
| `location_type` | `string` | Overrides location type. |
| `location_value` | `string` | Overrides location value. |
| `location` | `object` or JSON string | Overrides location object. |

:::note
Fields needed for routing and delivery priority, such as `channel_id`, `password`, `event_id`, `thing_id`, `event_time`, `observed_at`, and `severity`, should usually remain plaintext.
:::

## Python Example

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

The example `key_hex` is a 32-byte key for AES-256-GCM. Use a securely generated random key in production, and configure the same key locally in the client.

## API Usage

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

Plain `title` and `body` can be fallback display for clients without a key or when decryption fails. Put truly sensitive content inside `ciphertext`.

## Decryption States

| State | Meaning |
| :--- | :--- |
| `decryptOk` | Decryption succeeded and at least one field was applied. |
| `decryptFailed` | Ciphertext exists, but decrypting or parsing failed. |
| `notConfigured` | The client has no usable key configured. |
| `algMismatch` | The configured algorithm does not match the payload. |

## Troubleshooting

| Problem | Check |
| :--- | :--- |
| Decryption fails | Same key, complete Base64, and binary layout `ciphertext + tag + nonce`. |
| Client does not override fields | Decrypted JSON must be an object and field names must be canonical. |
| Gateway can still see the title | Plain request fields are not E2EE-protected; put sensitive titles in `ciphertext`. |
| `severity` is not encrypted | This is recommended because the Gateway and platform push services need priority information. |
