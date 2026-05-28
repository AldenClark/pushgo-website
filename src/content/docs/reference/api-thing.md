---
title: Thing API
description: Use /thing/create, /thing/update, /thing/archive, and /thing/delete to manage persistent entity state.
---

The Thing API represents long-lived objects that change over time, such as servers, rooms, sensors, network services, or long-running tasks. Creating a Thing returns a `thing_id`; updates, archive, and delete calls use that ID.

## Endpoints

```http
POST /thing/create
POST /thing/update
POST /thing/archive
POST /thing/delete
```

The request body must be JSON, and unknown fields are rejected. If a private Gateway enables `PUSHGO_TOKEN`, include `Authorization: Bearer <token>`.

## Headers

| Header | Required | Description |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Yes | Request body format. |
| `Authorization: Bearer <token>` | Gateway-dependent | Required only when a private Gateway enables `PUSHGO_TOKEN`. |

## Lifecycle

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

## Common Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Yes | Target channel ID. |
| `password` | `string` | Yes | Channel password, usually 8-128 characters. |
| `op_id` | `string` | No | Idempotency key; generated and returned if omitted. |
| `ciphertext` | `string` | No | Optional E2EE ciphertext payload. |

## Required Fields by Route

| Route | Required business fields |
| :--- | :--- |
| `/thing/create` | `observed_at` |
| `/thing/update` | `thing_id`, `observed_at` |
| `/thing/archive` | `thing_id`, `observed_at` |
| `/thing/delete` | `thing_id`, `observed_at` |

## Field Rules

| Field | Type | Rules |
| :--- | :--- | :--- |
| `thing_id` | `string` | Required for update, archive, and delete; must not be sent on create; 1-64 chars, letters/digits/`_`/`:`/`-`. |
| `title` | `string` | Recommended on create; the Gateway currently does not reject missing `title`. |
| `description` | `string` | Optional; empty strings are treated as missing. |
| `tags` | `string[]` | Up to 32 items, max 64 chars each, trimmed and deduplicated. |
| `primary_image` | `string` | Optional URL, max 2048 chars. |
| `images` | `string[]` | Up to 32 image URLs, max 2048 chars each. |
| `created_at` | `number` | Create only; falls back to `observed_at` when omitted. |
| `deleted_at` | `number` | Delete only; falls back to `observed_at` when omitted. |
| `observed_at` | `number` | Required; observation time for this state update; Unix seconds or milliseconds accepted and normalized to milliseconds. |
| `external_ids` | `object` | Key pattern `[A-Za-z0-9_:.-]`, key <= 64 and lowercased; value is non-empty `string` <= 256 or `null` to remove. |
| `location_type` + `location_value` | `string` + `string` | Must appear together; type is `physical`, `geo`, `cloud`, `datacenter`, or `logical`. Formats: `geo` is `lat,lng`, `cloud` is `provider:region[:zone]`, `datacenter` is `site[:room[:rack]]`, `logical` is slash-separated tokens. |
| `attrs` | `object` | Object patch; `null` removes a key; arrays are not allowed; only one nested object level. |
| `metadata` | `object` | No | Custom scalar key-values; key <= 64, non-empty scalar value <= 512; nested objects and arrays are rejected. |

## Create a Thing

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

Response:

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

Save the returned `thing_id`; update, archive, and delete calls need it.

## Update a Thing

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

`attrs` is a patch. You do not need to send full state every time. To remove a key, pass `null`.

```json
{
  "attrs": {
    "temporary_alarm": null
  }
}
```

## Archive a Thing

Archive is for objects that are no longer active but should keep history.

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

## Delete a Thing

Use `/thing/delete` when an object is removed or retired.

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

## Associate Message and Event

Thing represents a persistent object. Related alerts can use Message with `thing_id`; related processes can use Event with `thing_id`.

| Scenario | Model |
| :--- | :--- |
| Current NAS CPU, temperature, disk usage | Thing |
| One disk warning on the NAS | Message + `thing_id` |
| NAS backup from start to completion | Event + `thing_id` |

## Response Semantics

Thing APIs use the shared response envelope. `accepted=true` means the Gateway entered dispatch, not that every device has displayed a system notification.

## Common Errors

| Status | Typical reason |
| :--- | :--- |
| `400` | Missing `observed_at`, unknown field, invalid `attrs` or `external_ids`. |
| `401` | Private Gateway Bearer token missing or wrong. |
| `404` | Channel or `thing_id` does not exist. |
| `413` | Request body exceeds 32KB. |
| `503` | Dispatch did not fully succeed. |
