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

The request body must be JSON. Unknown extension fields are ignored, while known fields forbidden for an action are rejected. If a private Gateway enables `PUSHGO_TOKEN`, include `Authorization: Bearer <token>`.

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
| `password` | `string` | Yes | Channel password; trimmed before validation, then 8-128 bytes. |
| `op_id` | `string` | Must omit | Generated and returned by the Gateway; client input returns `400 op_id_not_allowed`. |
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
| `title`, `description` | `string` | Optional patch content. |
| `tags`, `images` | `string[]` | Optional patch content; Thing does not inherit Message tag/image limits. |
| `primary_image`, `location_type`, `location_value` | `string` | Optional patch content. Gateway 1.3.0 does not enforce the previously documented location pairing or formats. |
| `created_at` | `number` or numeric `string` | Optional create-only field; omitted when not supplied. No fallback from `observed_at` is inserted. |
| `deleted_at` | `number` or numeric `string` | Optional delete-only field; omitted when not supplied. No fallback from `observed_at` is inserted; rejected on create/update/archive. |
| `observed_at` | `number` or numeric `string` | Required; Unix seconds or milliseconds, normalized to milliseconds. |
| `external_ids`, `attrs` | `object` | Optional patch content; Gateway 1.3.0 does not enforce the previously documented shape restrictions. |
| `metadata` | `object` | Scalar values only; key <= 64 bytes, non-empty textual value <= 512 bytes; nested objects, arrays, and null are rejected. |

`thing_id` is forbidden on create. `state` is forbidden on every action. `op_id` is forbidden on every Thing action. Unknown fields are ignored and not applied.

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
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
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

The shared success envelope means the operation was durably accepted by the Gateway, not that a provider succeeded or a device displayed it. Use the returned `op_id` with `GET /send_status/{op_id}`.

## Common Errors

| Status | Typical reason |
| :--- | :--- |
| `400` | Missing route-required field, invalid ID/time/metadata, supplied `op_id`, or an action-forbidden field. |
| `401` | Private Gateway Bearer token missing or wrong. |
| `404` | Channel does not exist or credentials do not match. |
| `413` | Request body exceeds 32 KiB (32,768 bytes). |
| `503` | Gateway could not accept the submission. |
