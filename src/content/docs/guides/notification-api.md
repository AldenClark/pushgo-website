---
title: Push Notification API for Scripts and Services
description: Use PushGo as an HTTP notification API for curl, webhooks, cron jobs, CI/CD, NAS alerts, and automation scripts.
---

PushGo provides a direct HTTP API for scripts and services that need reliable user-visible notifications plus structured event and state models.

## Good Fits

- Send a notification from curl, cron, a shell script, or a webhook.
- Report job completion, price alerts, image snapshots, or monitoring results.
- Move beyond plain text by modeling lifecycles and entity state.
- Keep using compatibility endpoints while migrating to native PushGo APIs.

## How PushGo models this workflow

| Need | Use | Why |
| :--- | :--- | :--- |
| One alert from a script | Message | It is simple, transient, and easy to test with curl. |
| Job with progress | Event | The same event can be updated until completion. |
| Current state of a device or service | Thing | Clients see the latest state instead of many stale notifications. |

## Minimal example

The native `/message` endpoint accepts JSON and returns whether the Gateway accepted the request into dispatch.

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

- **Can I send a notification with curl?** Yes. The Message API is designed to be callable from curl, scripts, and simple HTTP clients.
- **Is PushGo only a phone notification API?** No. PushGo also models Event lifecycles and Thing state so automation history remains structured.
- **Can I self-host the API?** Yes. You can run your own Gateway and keep authentication, storage, transports, and MCP/OAuth under your control.

## Security and operations

- Prefer scoped credentials and separate Channels for high-risk automation.
- Use MCP OAuth for AI assistants so models do not directly hold Channel passwords.
- Use self-hosting when the data path, transport policy, or compliance boundary must stay under your control.
- Use E2EE for sensitive fields that should be decrypted only by clients.

## Next steps

- [Getting Started](/guides/getting-started/)
- [Message API](/reference/api-message/)
- [Self-Hosting](/guides/self-hosting/)
