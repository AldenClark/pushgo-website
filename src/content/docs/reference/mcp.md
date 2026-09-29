---
title: Model Context Protocol (MCP)
description: Integrate PushGo into AI assistant workflows with MCP and OAuth2.
---

PushGo Gateway can act as an MCP HTTP Server so MCP-capable AI assistants can send Message, manage Event, and update Thing within authorized channel scopes. OAuth2 authorization is recommended so users bind channels in a browser instead of giving channel passwords to a model.

## Good Fits

- Let an AI assistant send a PushGo notification after a task completes.
- Let an AI assistant synchronize long-running work as Event.
- Let an AI assistant update a service, device, or task Thing.
- Provide scoped channel access to third-party MCP clients.

MCP should not replace user confirmation. High-impact workflows should still keep confirmation at the client or orchestration layer.

## Endpoint

```text
https://your-gateway-domain/mcp
```

If a public Gateway enables MCP/OAuth, use that region's `/mcp` endpoint. Non-loopback self-hosted deployments must set an externally reachable HTTPS `PUSHGO_PUBLIC_BASE_URL`; omitting it is supported only for loopback-bound local development.

## Enable MCP on a Private Gateway

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Common settings:

| Environment variable | Default | Description |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Enables Dynamic Client Registration. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | none | Predefined OAuth clients in `client_id:client_secret` format; separate multiple clients by newline or semicolon. |

If the client does not support DCR, use `PUSHGO_MCP_PREDEFINED_CLIENTS`.

## Authorization Modes

| Mode | Channel password | Best for | Risk |
| :--- | :--- | :--- | :--- |
| OAuth2 authorization | Not passed in tool calls | AI assistants, third-party clients, production | Limited by scopes and channel grants. |
| Legacy mode | Passed in every tool call | Personal scripts, trusted environments | Caller directly holds channel passwords. |

Prefer OAuth2 authorization in production.

## User Binding Flow

1. The MCP client connects to `/mcp`.
2. The client obtains an OAuth2 client identity through OAuth or DCR.
3. The assistant calls `pushgo.channel.bind.start`.
4. The user opens the returned `bind_url`.
5. The user enters channel ID and password and confirms authorization scope.
6. The assistant polls `pushgo.channel.bind.status`.
7. After authorization, the assistant can call tools within the bound channel scope.

Bind sessions and token lifetimes are managed by the current Gateway runtime profile; they are not public CLI/env knobs in v1.3.0.

## Tools

### Message

| Tool | Purpose |
| :--- | :--- |
| `pushgo.message.send` | Sends a one-off Message. Supports `title`, `body`, `url`, `images`, `severity`, `ttl`, `metadata`, `thing_id`, and related fields. |

### Event

| Tool | Purpose |
| :--- | :--- |
| `pushgo.event.create` | Creates a lifecycle event and returns `event_id`. |
| `pushgo.event.update` | Sends an update patch for an `event_id`. |
| `pushgo.event.close` | Sends a close patch for an `event_id`. |

### Thing

| Tool | Purpose |
| :--- | :--- |
| `pushgo.thing.create` | Creates a persistent entity and returns `thing_id`. |
| `pushgo.thing.update` | Sends an attribute patch for a `thing_id`. |
| `pushgo.thing.archive` | Sends an archive patch for a `thing_id`. |
| `pushgo.thing.delete` | Sends a delete/retire patch for a `thing_id`. |

### Channel

| Tool or resource | Purpose |
| :--- | :--- |
| `pushgo.channel.bind.start` | Creates a bind or revoke session and returns `bind_url`. |
| `pushgo.channel.bind.status` | Checks bind session status. |
| `pushgo.channel.list` | Lists currently authorized channels. |
| `pushgo.channel.unbind` | Revokes channel authorization. |
| `pushgo://channels` | Authorized channel resource list. |
| `pushgo://channels/{channel_id}` | Basic information for one channel. |

## Action-specific Inputs

| Tool family | Required business inputs | Important exclusions |
| :--- | :--- | :--- |
| Message | `channel_id`, `title`; `occurred_at` is also required with `thing_id` | The published MCP schema marks `op_id` as Gateway-generated, so omit it for contract compatibility. Native HTTP Message explicitly supports client-supplied `op_id`. |
| Event | `channel_id`, `event_time`; update/close also require `event_id` | Omit `op_id`; `ended_at` is close-only and `started_at` is create-only. |
| Thing | `channel_id`, `observed_at`; update/archive/delete also require `thing_id` | Omit `op_id` and `state`; `deleted_at` is delete-only. |

OAuth mode forbids `password` and requires a bound channel. Legacy mode requires `password`. Send tools require the `mcp:tools` scope; channel-management tools and resources require `mcp:channels:manage`.

## Client Configuration Notes

- MCP endpoint is `https://your-gateway-domain/mcp`.
- Reverse proxies must pass `Host` and `X-Forwarded-Proto` correctly.
- Non-loopback self-hosted deployments must set `PUSHGO_PUBLIC_BASE_URL` to an externally reachable HTTPS root URL. Loopback-only local development is the sole omission exception.
- If OAuth issuer metadata or bind links contain internal addresses, check `PUSHGO_PUBLIC_BASE_URL` first.
- If a client does not support DCR, use predefined clients.

## Operations

- MCP grants are persisted; do not treat the database or storage directory as disposable cache.
- Token and bind-session lifetimes are profile-owned runtime settings in v1.3.0; choose the appropriate runtime profile instead of setting TTL env vars.
- Rotate predefined client secrets regularly.
- Use separate channels for high-risk automation instead of authorizing everything into one channel.
- Use Gateway structured logs and stats for operational debugging.

## Troubleshooting

| Symptom | Check |
| :--- | :--- |
| Client cannot discover OAuth metadata | For non-loopback deployment, `PUSHGO_PUBLIC_BASE_URL` must be an external HTTPS URL; the reverse proxy must forward well-known routes. |
| Bind link does not open | Public DNS, HTTPS certificate, reverse-proxy path, `PUSHGO_PUBLIC_BASE_URL`, and whether the bind session has expired. |
| DCR fails | Client DCR support and `PUSHGO_MCP_DCR_ENABLED`. |
| Tool call asks for `password` | You may be in Legacy mode, or OAuth authorization is incomplete. |
| Authorized but no channels visible | Bind session completion, scopes, and whether the channel grant was revoked. |
