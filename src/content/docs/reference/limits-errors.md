---
title: Limits & Errors
description: Shared PushGo Gateway limits, response envelope, status codes, and troubleshooting entry points.
---

This page summarizes rules shared across APIs. Required fields, lifecycle behavior, and model-specific semantics still belong to each API page.

## Shared Limits

| Item | Limit |
| :--- | :--- |
| Request body size | Max 32KB. |
| Gateway-generated IDs | 32 lowercase hex characters. |
| Channel password | Usually 8-128 characters. |
| `op_id` | 1-128 characters; letters, digits, `_`, `:`, `-`. |
| `images` | Up to 32 URLs, max 2048 characters each. |
| `tags` | Up to 32 tags, max 64 characters each, trimmed and deduplicated. |
| `metadata` | Scalar values only; key max 64, value max 512. |
| `attrs` | Object patch; `null` removes a key; avoid complex nesting. |
| `ttl` | Unix-millisecond timestamp; provider delivery TTL is capped around 28 days. |
| Unknown fields | Native Message, Event, Thing, and MCP tool arguments are strict; unknown fields return 400. |

## Response Envelope

Success:

```json
{
  "success": true,
  "data": {
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

Failure:

```json
{
  "success": false,
  "data": null,
  "error": "human readable message",
  "error_code": "machine_readable_code"
}
```

Automation should prefer `success` and `error_code` over natural-language `error` text.

## Meaning of `accepted`

`success=true` means the Gateway processed the request. `accepted=true` means it entered dispatch.

It does not guarantee:

- Every device is online.
- APNs or FCM has displayed a notification.
- Android private transport delivered in real time.
- The user is unaffected by notification permissions, Focus mode, or battery policy.

Treat `accepted` as Gateway acceptance and dispatch status, not as an end-device display receipt.

## Common HTTP Status Codes

| Status | Meaning | Typical reason | What to do |
| :--- | :--- | :--- | :--- |
| `200` | Gateway processed the request | `success=true`, but still check `accepted` | Store returned IDs and `op_id`. |
| `400` | Validation failed | Missing required field, unknown field, bad format | Compare the JSON with the API field table. |
| `401` | Gateway authentication failed | Private Gateway uses `PUSHGO_TOKEN`; Bearer token missing or wrong | Check `Authorization: Bearer <token>`. |
| `404` | Target missing | Channel, event, or thing does not exist | Check `channel_id`, `event_id`, `thing_id`. |
| `413` | Request body too large | JSON exceeds 32KB | Use image URLs; reduce metadata or attrs. |
| `503` | Dispatch not fully accepted | Provider, private transport, queue, or downstream unavailable | Inspect Gateway logs, stats, and queue capacity. |

## Troubleshooting by Scenario

### Request Returns 400

- JSON must be valid.
- Do not send `event_id` to `/event/create` or `thing_id` to `/thing/create`.
- Remove unknown fields.
- `severity` must be `critical`, `high`, `normal`, or `low`.
- `attrs` must be an object patch, not an array or deeply nested structure.

### Request Returns 401

- Check whether the private Gateway has `PUSHGO_TOKEN`.
- Header must be `Authorization: Bearer <token>`.
- Do not confuse channel password with Gateway token.
- Ensure the reverse proxy does not strip Authorization headers.

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
- `PUSHGO_PUBLIC_BASE_URL` must be an external HTTPS URL.
- Reverse proxy must forward `/.well-known/*`, `/oauth/*`, and `/mcp`.
- DCR must match client capability.
- Bind page sessions can expire.

## Related Pages

- [Authentication](/reference/auth/)
- [Message API](/reference/api-message/)
- [Event API](/reference/api-event/)
- [Thing API](/reference/api-thing/)
- [Self-Hosting](/guides/self-hosting/)
