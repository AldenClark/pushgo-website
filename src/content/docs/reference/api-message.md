---
title: Message API
description: Send one-off notifications with /message and understand fields, responses, and dispatch semantics.
---

The Message API sends top-level transient notifications. Use it for alerts, completion messages, image snapshots, price notifications, and other content that does not need later updates or closing.

## Endpoint

```http
POST /message
```

The request body must be JSON, and unknown fields are rejected. If a private Gateway enables `PUSHGO_TOKEN`, include `Authorization: Bearer <token>`.

## Headers

| Header | Required | Description |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Yes | Request body format. |
| `Authorization: Bearer <token>` | Gateway-dependent | Required only when a private Gateway enables `PUSHGO_TOKEN`. |

## Request Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Yes | Target channel ID. |
| `password` | `string` | Yes | Channel password, usually 8-128 characters. |
| `title` | `string` | Yes | Message title, must not be empty. |
| `body` | `string` | No | Message body, Markdown is supported. |
| `op_id` | `string` | No | Idempotency key, 1-128 chars, letters/digits/`_`/`:`/`-`. |
| `thing_id` | `string` | No | Associate the message with an existing Thing; 1-64 chars, letters/digits/`_`/`:`/`-`. |
| `occurred_at` | `number` | No | When the message occurred; Unix seconds or milliseconds accepted. Required when `thing_id` is present. |
| `severity` | `string` | No | `critical`, `high`, `normal`, `low`; unknown values normalize to `normal`. |
| `ttl` | `number` | No | Unix-millisecond expiration time; provider TTL is capped around 28 days. |
| `url` | `string` | No | Optional click-through URL. |
| `images` | `string[]` | No | Up to 32 image URLs, max 2048 chars each. |
| `tags` | `string[]` | No | Up to 32 tags, max 64 chars each, trimmed and deduplicated. |
| `ciphertext` | `string` | No | Optional E2EE ciphertext payload. |
| `metadata` | `object` | No | Custom scalar key-values; key <= 64, non-empty scalar value <= 512; nested objects and arrays are rejected. |

## Severity Mapping

| `severity` | APNs interruption level | FCM priority |
| :--- | :--- | :--- |
| `critical` | `critical` | `HIGH` |
| `high` | `time-sensitive` | `HIGH` |
| `normal` | `active` | `HIGH` |
| `low` | `passive` | `NORMAL` |

## Minimal Example

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

## Associate with a Thing

If the alert belongs to a persistent entity, pass `thing_id` and an explicit `occurred_at`.

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

## Success Response

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

`success=true` means the Gateway processed the request. `accepted=true` means the request entered dispatch; final display still depends on platform push services, device state, and private transports.

## Common Errors

| Status | Typical reason |
| :--- | :--- |
| `400` | Missing required field, unknown field, empty `title`, invalid `op_id`. |
| `401` | Private Gateway requires a Bearer token, but the header is missing or wrong. |
| `404` | Channel does not exist or credentials do not match. |
| `413` | Request body exceeds 32KB. |
| `503` | Gateway could not fully enter dispatch; response may include `accepted=false`. |

See [Limits & Errors](/reference/limits-errors/) for shared limits.

## Compatibility Endpoints

PushGo also provides ntfy, Bark, and ServerChan compatibility endpoints for migration. Their field coverage is limited; use native `/message` when you need `thing_id`, E2EE, or full PushGo semantics. See [Migration Guide](/guides/migration/).
