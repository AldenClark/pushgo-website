---
title: NAS, IoT, and Home Assistant Notifications
description: Use PushGo for NAS alerts, IoT devices, Home Assistant automations, and long-lived device state updates.
---

Home automation and device monitoring often need more than a one-time alert. PushGo lets automations send notifications, track events, and maintain the current state of devices or services.

## Good Fits

- Send NAS disk, backup, and service alerts to mobile and desktop clients.
- Report Home Assistant automations through a webhook-style HTTP request.
- Represent a device, sensor, backup job, or media service as a Thing.
- Use private Gateway deployment when home data should stay under your control.

## How PushGo models this workflow

| Need | Use | Why |
| :--- | :--- | :--- |
| Doorbell snapshot or disk warning | Message | The content is a single alert. |
| Backup or media scan progress | Event | Progress can update until completion. |
| Sensor or device state | Thing | The latest state matters more than every past update. |

## Minimal example

A NAS script can call `/message` for disk warnings, while a backup job can create an Event and update it until it succeeds or fails.

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

- **Can PushGo receive Home Assistant webhook notifications?** Yes. Home Assistant automations can call PushGo HTTP APIs through webhook or REST actions.
- **How do I avoid repeated stale device notifications?** Use Thing for device or service state so clients can show the current object state.
- **Can this run on a private network?** Yes. Self-host the Gateway when the data path or transport policy should remain private.

## Security and operations

- Prefer scoped credentials and separate Channels for high-risk automation.
- Use MCP OAuth for AI assistants so models do not directly hold Channel passwords.
- Use self-hosting when the data path, transport policy, or compliance boundary must stay under your control.
- Use E2EE for sensitive fields that should be decrypted only by clients.

## Next steps

- [Use Cases](/guides/use-cases/)
- [Thing API](/reference/api-thing/)
- [Self-Hosting](/guides/self-hosting/)
