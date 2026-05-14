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

The request body must be JSON, and unknown fields are rejected. If a private Gateway enables `PUSHGO_TOKEN`, include `Authorization: Bearer <token>`.

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
| `password` | `string` | Yes | Channel password, usually 8-128 characters. |
| `op_id` | `string` | No | Idempotency key; generated and returned if omitted. |
| `thing_id` | `string` | No | Associate this event dispatch with an existing Thing. |
| `ciphertext` | `string` | No | Optional E2EE ciphertext payload. |

## Required Fields by Route

| Route | Required business fields |
| :--- | :--- |
| `/event/create` | `title`, `status`, `message`, `severity`, `event_time` |
| `/event/update` | `event_id`, `status`, `message`, `severity`, `event_time` |
| `/event/close` | `event_id`, `status`, `message`, `severity`, `event_time` |

## Field Rules

| Field | Type | Rules |
| :--- | :--- | :--- |
| `event_id` | `string` | Required for update and close; must not be sent on create. |
| `title` | `string` | Required on create; optional on update and close. |
| `description` | `string` | Optional; empty strings are treated as missing. |
| `status` | `string` | Required; non-empty, max 24 chars. |
| `message` | `string` | Required; non-empty, max 512 chars. |
| `severity` | `string` | Required; only `critical`, `high`, `normal`, `low`. |
| `event_time` | `number` | Required; when this update happened, Unix milliseconds. |
| `started_at` | `number` | Create only; overall event start time. |
| `ended_at` | `number` | Close only; overall event end time. |
| `tags` | `string[]` | Up to 32 items, max 64 chars each, trimmed and deduplicated. |
| `images` | `string[]` | Up to 32 image URLs, max 2048 chars each. |
| `attrs` | `object` | Object patch; `null` removes a key; arrays are not allowed. |
| `metadata` | `object` | Scalar values only; key <= 64, value <= 512. |

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
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
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

Event APIs use the shared response envelope. `accepted=true` means the Gateway entered dispatch, not that every device has displayed a system notification.

## Common Errors

| Status | Typical reason |
| :--- | :--- |
| `400` | Missing route-required field, unknown field, invalid `severity`, invalid `attrs`. |
| `401` | Private Gateway Bearer token missing or wrong. |
| `404` | Channel or `event_id` does not exist. |
| `413` | Request body exceeds 32KB. |
| `503` | Dispatch did not fully succeed. |
