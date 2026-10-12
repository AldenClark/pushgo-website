---
title: Limits & Errors
description: Shared PushGo Gateway limits, response envelope, status codes, and troubleshooting entry points.
---

This page summarizes rules shared across APIs. Required fields, lifecycle behavior, and model-specific semantics still belong to each API page.

## Shared Limits

| Item | Limit |
| :--- | :--- |
| Request body size | Max 32 KiB (32,768 bytes). |
| `channel_id` | 128-bit Crockford Base32. Canonical output is 26 uppercase characters; input is case-insensitive, ignores ASCII whitespace and hyphens, and accepts Crockford aliases `O`→`0` and `I`/`L`→`1`. |
| Gateway-generated entity IDs | 32 lowercase hex characters. Client-supplied Event/Thing IDs on non-create routes may use the general format below. |
| Channel password | Trimmed before validation, then 8-128 bytes. |
| `op_id` | Client input: 1-128 characters using letters, digits, `_`, `:`, `-`, supported by Message only. Generated values currently use 13 lowercase hex timestamp characters, a hyphen, and 32 lowercase hex random characters; treat the generated value as opaque. |
| `thing_id` / `event_id` | 1-64 characters; letters, digits, `_`, `:`, `-`. |
| `images` | Up to 32 URLs, max 2048 bytes each. |
| `tags` | Up to 32 tags, max 64 bytes each, trimmed and deduplicated. |
| `metadata` | Scalar values only; key max 64 bytes, non-empty scalar text max 512 bytes; no nested objects, arrays, or null. |
| `ttl` and API timestamps | Unix seconds or milliseconds accepted where documented; values normalize to milliseconds. |
| Active subscribers | Max 32 concurrent subscribers per channel. |
| Built-in password request budget | Per Gateway process: 60 requests per IP per minute and 1,200 total per minute on public/password-sensitive and MCP/OAuth password surfaces. Private requests authenticated by the shared Bearer token bypass this limiter. |
| Unknown fields | Native Message, Event, and Thing ignore extension fields for forward compatibility; known action-forbidden fields still return 400. |

Message validates its `tags`, `images`, and `severity` as documented. Event and Thing patch content does not inherit those Message-specific limits.

## Response Envelope

Success:

```json
{
  "success": true,
  "data": {
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
}
```

Failure:

```json
{
  "success": false,
  "error": "human readable message",
  "error_code": "machine_readable_code",
  "problem": {
    "code": "machine_readable_code",
    "category": "validation",
    "status": 400,
    "title": "Invalid request",
    "detail": "human readable message",
    "localized_message": "human readable message",
    "locale": "en",
    "retryable": false,
    "request_id": "request-id"
  }
}
```

Optional `problem` members are omitted when unavailable. The response also mirrors `request_id` in the `x-request-id` header when request scope provides one.

Success `data` contains `op_id` plus exactly one of `message_id`, `event_id`, or `thing_id`; it does not contain `channel_id` or an `accepted` boolean. Automation should prefer the HTTP status plus `success`, `error_code`, or `problem.code` over natural-language text.

## Acceptance and Sender Status

`success=true` from a send API means the Gateway durably accepted the submission. It does not guarantee provider success, private-transport delivery, device display, or user visibility.

It does not guarantee:

- Every device is online.
- APNs or FCM has displayed a notification.
- Android private transport delivered in real time.
- The user is unaffected by notification permissions, Focus mode, or battery policy.

Query the returned operation ID with `GET /send_status/{op_id}`. The response contains `op_id`, `status`, `model`, `entity_id`, `accepted_at`, `updated_at`, and `expires_at`.

| Status | Meaning |
| :--- | :--- |
| `accepted` | Submission was durably accepted. |
| `processing` | Dispatch processing is underway. |
| `provider_queued` | Queued in the Gateway provider worker; not provider success. |
| `sent` | Dispatch completed without a recorded target failure. |
| `partially_failed` | At least one dispatch target failed. |
| `failed` | Submission processing failed. |

An unknown or expired operation ID returns `404 send_status_not_found`. This is coarse dispatch state, not an end-device display receipt.

## Common HTTP Status Codes

| Status | Meaning | Typical reason | What to do |
| :--- | :--- | :--- | :--- |
| `200` | Gateway processed the request | `success=true` | Store returned IDs and `op_id`. |
| `400` | Validation failed | Missing/invalid field or a known field is forbidden for the action | Compare the JSON with the API field table. |
| `401` | Gateway authentication failed | Private Gateway uses `PUSHGO_TOKEN`; Bearer token missing or wrong | Check `Authorization: Bearer <token>`. |
| `404` | Target missing | Channel or sender-status record does not exist | Check `channel_id` or `op_id`. |
| `409` | Idempotency conflict | Message `op_id` reused with another normalized payload or scope | Generate a new operation ID or resend the original payload. |
| `413` | Request body too large | JSON exceeds 32 KiB (32,768 bytes) | Use image URLs; reduce metadata or attrs. |
| `429` | Request rate limited | A built-in per-process password request budget was exceeded | Retry later and reduce bursts. |
| `503` | Submission not accepted | Gateway admission or durable submission failed | Inspect Gateway logs, storage health, and capacity. |

## Troubleshooting by Scenario

### Request Returns 400

- JSON must be valid.
- Do not send `event_id` to `/event/create` or `thing_id` to `/thing/create`.
- Do not supply `op_id` to Event or Thing routes, or generated IDs to create routes.
- For Message, `severity` should be `critical`, `high`, `normal`, or `low`; unknown values normalize to `normal`.
- Unknown extension fields are ignored, so verify field spelling when an optional value has no effect.

### Request Returns 401

- Check whether the private Gateway has `PUSHGO_TOKEN`.
- Header must be `Authorization: Bearer <token>`.
- Do not confuse channel password with Gateway token.
- Ensure the reverse proxy does not strip Authorization headers.
- If a private Gateway sets `PUSHGO_TOKEN`, `/healthz` and `/readyz` also require the Bearer token.

### Request Succeeds but Device Does Not Notify

- The client must be subscribed to the channel.
- Device notification permission must be enabled.
- Apple delivery can be affected by APNs, Focus modes, and system settings.
- Android clients must be able to fetch the correct `/gateway/profile`.
- Private transport ports, certificates, and external addresses must be reachable.
- Gateway logs may show provider or private dispatch errors.

### Private Transport Unavailable

- `PUSHGO_PRIVATE_TRANSPORTS` must be enabled.
- WSS must be reachable through the HTTPS domain.
- QUIC UDP port may be blocked by firewall or proxy.
- Raw TCP must handle TLS or TLS offload correctly.
- Advertised ports and actual bind ports may differ behind NAT or port mapping.

### MCP Binding Fails

- `PUSHGO_MCP_ENABLED` must be enabled.
- For non-loopback deployment, `PUSHGO_PUBLIC_BASE_URL` must be an external HTTPS URL; loopback-only local development may omit it.
- Reverse proxy must forward `/.well-known/*`, `/oauth/*`, and `/mcp`.
- DCR must match client capability.
- Bind page sessions can expire.

## Related Pages

- [Authentication](/reference/auth/)
- [Message API](/reference/api-message/)
- [Event API](/reference/api-event/)
- [Thing API](/reference/api-thing/)
- [Self-Hosting](/guides/self-hosting/)
