---
title: Migrate from ntfy, Bark, or ServerChan
description: Migrate existing ntfy, Bark, ServerChan, or webhook notification scripts to PushGo with compatibility endpoints and native models.
---

PushGo can receive existing notification-style workflows while you gradually move important paths to native Message, Event, and Thing models.

## Good Fits

- Keep simple scripts working while you evaluate PushGo.
- Move one alert path at a time instead of rewriting every automation.
- Replace plain text messages with structured lifecycles or entity state where useful.
- Use E2EE and self-hosting when the migrated workflow carries sensitive data.

## How PushGo models this workflow

| Need | Use | Why |
| :--- | :--- | :--- |
| Simple migrated alert | Message | The old notification stays as a one-off message. |
| Workflow with status changes | Event | Repeated updates belong to one lifecycle. |
| Long-lived monitored object | Thing | The same entity can be updated over time. |

## Minimal example

Start by migrating low-risk scripts to compatibility endpoints, then move workflows that need richer semantics to native `/message`, `/event/*`, or `/thing/*` APIs.

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

- **Do I need to rewrite every script immediately?** No. Use compatibility endpoints and migrate high-value workflows first.
- **When should I stop using plain text notifications?** When the workflow has progress, closing, current state, images, metadata, or security requirements.
- **Is this a direct feature comparison?** No. Treat migration as a modeling decision: keep simple alerts simple and upgrade workflows that benefit from structure.

## Security and operations

- Prefer scoped credentials and separate Channels for high-risk automation.
- Use MCP OAuth for AI assistants so models do not directly hold Channel passwords.
- Use self-hosting when the data path, transport policy, or compliance boundary must stay under your control.
- Use E2EE for sensitive fields that should be decrypted only by clients.

## Next steps

- [Migration Guide](/guides/migration/)
- [Message API](/reference/api-message/)
- [Data Models](/guides/data-models/)
