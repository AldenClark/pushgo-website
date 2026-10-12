---
title: Event API
description: Use /event/create, /event/update, and /event/close to model updatable lifecycles.
---

The Event API represents a process that changes over time and eventually ends. Creating an event returns an `event_id`; updates and close calls use that ID to stay attached to the same lifecycle.

## Endpoints

```http
POST /event/create
POST /event/update
POST /event/close
```

Thing-scoped aliases are also available:

```http
POST /thing/{thing_id}/event/create
POST /thing/{thing_id}/event/update
POST /thing/{thing_id}/event/close
```

The path value supplies `thing_id`. If the body also contains `thing_id`, the two values must match.

The request body must be JSON. Unknown extension fields are ignored, while known fields forbidden for an action are rejected. If a private Gateway enables `PUSHGO_TOKEN`, include `Authorization: Bearer <token>`.

## Headers

| Header | Required | Description |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Yes | Request body format. |
| `Authorization: Bearer <token>` | Gateway-dependent | Required only when a private Gateway enables `PUSHGO_TOKEN`. |

## Lifecycle

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   marks the event as ended
```

## Common Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Yes | Target channel ID. |
| `password` | `string` | Yes | Channel password; trimmed before validation, then 8-128 bytes. |
| `op_id` | `string` | Must omit | Generated and returned by the Gateway; client input returns `400 op_id_not_allowed`. |
| `thing_id` | `string` | No | Scope the event to a Thing ID. The Gateway validates the format but does not require a server-side Thing record. |
| `ciphertext` | `string` | No | Optional E2EE ciphertext payload. |

## Required Fields by Route

| Route | Required business fields |
| :--- | :--- |
| `/event/create` | `event_time` |
| `/event/update` | `event_id`, `event_time` |
| `/event/close` | `event_id`, `event_time` |

## Field Rules

| Field | Type | Rules |
| :--- | :--- | :--- |
| `event_id` | `string` | Required for update and close; must not be sent on create; 1-64 chars, letters/digits/`_`/`:`/`-`. |
| `title`, `description`, `status`, `message`, `severity` | `string` | Optional patch content. Gateway 1.3.0 does not impose the Message severity enum on Event patches. |
| `event_time` | `number` or numeric `string` | Required; Unix seconds or milliseconds, normalized to milliseconds. |
| `started_at` | `number` or numeric `string` | Optional create-only field; omitted when not supplied. No fallback from `event_time` is inserted. |
| `ended_at` | `number` or numeric `string` | Optional close-only field; omitted when not supplied. No fallback from `event_time` is inserted; explicitly rejected on create/update. |
| `tags`, `images` | `string[]` | Optional patch content; Event does not inherit Message tag/image limits. |
| `attrs` | `object` | Optional patch content. |
| `metadata` | `object` | Scalar values only; key <= 64 bytes, non-empty textual value <= 512 bytes; nested objects, arrays, and null are rejected. |

`event_id` is forbidden on create. `op_id` is forbidden on every Event action. Unknown fields are ignored and not applied, so use canonical field names.

## Create an Event

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

Response:

```json
{
  "success": true,
  "data": {
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
}
```

Save the returned `event_id`; update and close calls need it.

## Update an Event

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

`/event/update` can be called many times. Each update should describe the current change, not repeat the whole history.

## Close an Event

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

For failures, use `status=failed` and raise `severity` when appropriate.

## Associate with a Thing

If the event happens on a persistent entity, include `thing_id`.

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

Thing identifies the object; Event describes the process happening to it.

## Response Semantics

The shared success envelope means the operation was durably accepted by the Gateway, not that a provider succeeded or a device displayed it. Use the returned `op_id` with `GET /send_status/{op_id}`.

## Common Errors

| Status | Typical reason |
| :--- | :--- |
| `400` | Missing route-required field, invalid ID/time/metadata, supplied `op_id`, or an action-forbidden field. |
| `401` | Private Gateway Bearer token missing or wrong. |
| `404` | Channel does not exist or credentials do not match. |
| `413` | Request body exceeds 32 KiB (32,768 bytes). |
| `503` | Gateway could not accept the submission. |
