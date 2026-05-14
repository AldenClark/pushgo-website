---
title: Self-hosted Open-source Notification Server
description: Deploy PushGo Gateway as a self-hosted open-source notification server with private transports, persistent state, E2EE, and MCP/OAuth.
---

Self-host PushGo when you want the notification path, data storage, Gateway authentication, private transport policy, and MCP/OAuth endpoint to stay under your control.

## Good Fits

- Operate a private notification Gateway for personal or team automation.
- Keep notification, event, and entity-state data out of a public Gateway.
- Expose your own HTTPS `/mcp` endpoint for AI assistant workflows.
- Use backups, reverse proxies, logs, and observability as part of production operations.

## How PushGo models this workflow

| Need | Use | Why |
| :--- | :--- | :--- |
| Private delivery path | Gateway | Your infrastructure controls the HTTP API and transport listeners. |
| Sensitive fields | E2EE | Clients decrypt sensitive payload fields locally. |
| AI assistant access | MCP OAuth | Users bind channels through your public Gateway URL. |

## Minimal example

Set `PUSHGO_PUBLIC_BASE_URL` to the externally reachable HTTPS origin before enabling MCP/OAuth, otherwise issuer metadata and bind links may contain internal addresses.

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Hello from PushGo",
    "body": "The automation path is working."
  }'
```

## Questions this page answers

- **Can PushGo run as a self-hosted notification server?** Yes. The Gateway is designed for private deployment with persistent storage and configurable transport listeners.
- **Does self-hosting enable MCP?** Yes. A private Gateway can expose `/mcp` and OAuth routes when configured with a public HTTPS base URL.
- **Do I still need backups?** Yes. Channels, devices, MCP grants, Event state, and Thing state depend on persistent storage.

## Security and operations

- Prefer scoped credentials and separate Channels for high-risk automation.
- Use MCP OAuth for AI assistants so models do not directly hold Channel passwords.
- Use self-hosting when the data path, transport policy, or compliance boundary must stay under your control.
- Use E2EE for sensitive fields that should be decrypted only by clients.

## Next steps

- [Self-Hosting](/guides/self-hosting/)
- [End-to-End Encryption](/reference/e2ee/)
- [MCP Reference](/reference/mcp/)
