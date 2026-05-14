---
title: Authentication
description: Understand channel credentials, gateway tokens, compatibility keys, and MCP OAuth.
---

PushGo authentication depends on the API surface you call. Identify the mode first, then put the credential in the right place.

## Authentication Modes

| Scenario | Required credential | Location | Used by |
| :--- | :--- | :--- | :--- |
| Native API | `channel_id` + `password` | JSON body | `/message`, `/event/*`, `/thing/*` |
| Private Gateway token | Bearer token | `Authorization` header | Restricting callers to a self-hosted Gateway |
| Compatibility endpoint | `<channel_id>:<password>` | Path or compatibility field | ntfy, Bark, ServerChan migration |
| MCP OAuth | OAuth access token | Managed by the MCP client | AI assistants and third-party clients |

Channel authorization and gateway authorization are separate layers. If a private Gateway token is enabled, requests still need channel ID and password.

## Channel Authorization

Native Message, Event, and Thing APIs use channel credentials in the JSON body.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Test message"
}
```

| Field | Description |
| :--- | :--- |
| `channel_id` | Target channel. |
| `password` | Channel password, usually 8-128 characters. |

The channel password controls who can write to a channel. It is not a Gateway administrator password and should not be placed in public repositories, logs, or frontend code.

## Gateway Bearer Token

Self-hosted Gateways can enable gateway-level authentication with `PUSHGO_TOKEN`.

```bash
PUSHGO_TOKEN=replace-with-gateway-token
```

Requests then need:

```http
Authorization: Bearer replace-with-gateway-token
```

Full example:

```bash
curl -X POST https://gateway.example.com/message \
  -H "Authorization: Bearer replace-with-gateway-token" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Private Gateway test"
  }'
```

Constraints:

- Use the standard header name `Authorization`.
- Token type must be `Bearer`.
- Token length is capped at 4096 characters.
- If `PUSHGO_TOKEN` is empty, gateway-level token authentication is disabled.

## Public Gateways

Public gateways still validate channel ID and channel password. Getting Started examples show only channel authorization by default. Additional access policy may depend on current public endpoint configuration.

## Compatibility Keys

Compatibility endpoints use `<channel_id>:<password>` as the `compat_key`.

| Source | Key location |
| :--- | :--- |
| ntfy | `/ntfy/{topic}`, where `{topic}` is the `compat_key` |
| ServerChan | `/serverchan/{sendkey}`, where `{sendkey}` is the `compat_key` |
| Bark v1 | `/bark/{device_key}/{body}`, where `{device_key}` is the `compat_key` |
| Bark v2 | JSON field `device_key` |

Example:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -d "NAS backup completed"
```

The compatibility key contains the channel password and must be treated as a secret.

## MCP OAuth

In MCP OAuth mode, AI assistants should not pass channel passwords in tool calls. The recommended flow is:

1. The MCP client connects to `https://gateway.example.com/mcp`.
2. The user opens a bind link.
3. The user enters channel ID and password and confirms authorization.
4. The Gateway issues a scope-limited OAuth token to the MCP client.
5. Tool calls use OAuth authorization for the bound channels.

Legacy MCP mode can still pass `password` in each tool call, but it is best reserved for personal or trusted environments. Production integrations should prefer OAuth.

## Security Recommendations

- Do not commit channel passwords, compatibility keys, or Gateway tokens.
- Use HTTPS in production.
- Do not hardcode real channel passwords in public examples.
- For self-hosted Gateways, enable `PUSHGO_TOKEN` and put the HTTP listener behind a reverse proxy.
- For AI assistant integrations, prefer MCP OAuth so the model does not directly hold channel passwords.
- Rotate channel passwords and Gateway tokens independently; do not set them to the same value.
