---
title: DevOps and CI/CD Notifications
description: Use PushGo for CI/CD, deployment, incident, server, and monitoring notifications with Message, Event, and Thing models.
---

DevOps notifications are easier to understand when one-off alerts, incident lifecycles, and service state are modeled separately instead of becoming a long stream of plain text.

## Good Fits

- Send build, deployment, and release notifications.
- Track incident progress as an updatable Event.
- Show the current status of a service, queue, backup job, or host as a Thing.
- Route alerts to Apple and Android clients through the public Gateway or your own Gateway.

## How PushGo models this workflow

| Need | Use | Why |
| :--- | :--- | :--- |
| Build finished | Message | One visible alert is enough. |
| Deployment in progress | Event | The same lifecycle can move from started to failed or completed. |
| Service health | Thing | The object has a current status that changes over time. |

## Minimal example

Use Message for simple pipeline completion. Use Event when a deployment has multiple updates. Use Thing when users should see the current state of a service rather than a list of historical alerts.

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

- **Is PushGo suitable for CI/CD notifications?** Yes. CI/CD systems can call the HTTP API directly from shell steps or webhook actions.
- **How should incidents be represented?** Use Event so the incident can be updated and closed instead of creating unrelated notifications.
- **Can teams self-host DevOps notifications?** Yes. A private Gateway lets teams control data paths, authentication, and operational policy.

## Security and operations

- Prefer scoped credentials and separate Channels for high-risk automation.
- Use MCP OAuth for AI assistants so models do not directly hold Channel passwords.
- Use self-hosting when the data path, transport policy, or compliance boundary must stay under your control.
- Use E2EE for sensitive fields that should be decrypted only by clients.

## Next steps

- [Data Models](/guides/data-models/)
- [Event API](/reference/api-event/)
- [Self-Hosting](/guides/self-hosting/)
