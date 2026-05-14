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

If a public Gateway enables MCP/OAuth, use that region's `/mcp` endpoint. Self-hosted deployments must set an externally reachable `PUSHGO_PUBLIC_BASE_URL`.

## Enable MCP on a Private Gateway

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Common settings:

| Environment variable | Default | Description |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Enables Dynamic Client Registration. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | none | Predefined OAuth clients in `client_id:client_secret` format. |
| `PUSHGO_MCP_ACCESS_TOKEN_TTL_SECS` | `900` | Access token lifetime. |
| `PUSHGO_MCP_REFRESH_TOKEN_ABSOLUTE_TTL_SECS` | `2592000` | Refresh token absolute lifetime. |
| `PUSHGO_MCP_REFRESH_TOKEN_IDLE_TTL_SECS` | `604800` | Refresh token idle lifetime. |
| `PUSHGO_MCP_BIND_SESSION_TTL_SECS` | `600` | Channel bind page session lifetime. |

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

The bind session lifetime is controlled by `PUSHGO_MCP_BIND_SESSION_TTL_SECS`.

## Tools

### Message

| Tool | Purpose |
| :--- | :--- |
| `pushgo.message.send` | Sends a one-off Message. Supports `title`, `body`, `url`, `images`, `severity`, `ttl`, `metadata`, `thing_id`, and related fields. |

### Event

| Tool | Purpose |
| :--- | :--- |
| `pushgo.event.create` | Creates a lifecycle event and returns `event_id`. |
| `pushgo.event.update` | Updates an existing event. |
| `pushgo.event.close` | Closes an existing event. |

### Thing

| Tool | Purpose |
| :--- | :--- |
| `pushgo.thing.create` | Creates a persistent entity and returns `thing_id`. |
| `pushgo.thing.update` | Updates entity attributes. |
| `pushgo.thing.archive` | Archives an entity. |
| `pushgo.thing.delete` | Deletes or retires an entity. |

### Channel

| Tool or resource | Purpose |
| :--- | :--- |
| `pushgo.channel.bind.start` | Creates a bind or revoke session and returns `bind_url`. |
| `pushgo.channel.bind.status` | Checks bind session status. |
| `pushgo.channel.list` | Lists currently authorized channels. |
| `pushgo.channel.unbind` | Revokes channel authorization. |
| `pushgo://channels` | Authorized channel resource list. |
| `pushgo://channels/{channel_id}` | Basic information for one channel. |

## Client Configuration Notes

- MCP endpoint is `https://your-gateway-domain/mcp`.
- Reverse proxies must pass `Host` and `X-Forwarded-Proto` correctly.
- Self-hosted deployments must set `PUSHGO_PUBLIC_BASE_URL` to an externally reachable HTTPS root URL.
- If OAuth issuer metadata or bind links contain internal addresses, check `PUSHGO_PUBLIC_BASE_URL` first.
- If a client does not support DCR, use predefined clients.

## Operations

- MCP grants are persisted; do not treat the database or storage directory as disposable cache.
- Access tokens are short-lived; refresh tokens are longer-lived. Adjust TTLs based on client risk.
- Rotate predefined client secrets regularly.
- Use separate channels for high-risk automation instead of authorizing everything into one channel.
- Use Gateway structured logs and stats for operational debugging.

## Troubleshooting

| Symptom | Check |
| :--- | :--- |
| Client cannot discover OAuth metadata | `PUSHGO_PUBLIC_BASE_URL` must be an external HTTPS URL; reverse proxy must forward well-known routes. |
| Bind link does not open | Public DNS, HTTPS certificate, reverse-proxy path, and `PUSHGO_MCP_BIND_SESSION_TTL_SECS`. |
| DCR fails | Client DCR support and `PUSHGO_MCP_DCR_ENABLED`. |
| Tool call asks for `password` | You may be in Legacy mode, or OAuth authorization is incomplete. |
| Authorized but no channels visible | Bind session completion, scopes, and whether the channel grant was revoked. |
