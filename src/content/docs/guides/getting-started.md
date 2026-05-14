---
title: Getting Started
description: Install a client, create a channel, and receive your first PushGo notification.
---

This guide is for first-time PushGo users. At the end, you will have a usable channel and a working HTTP request that sends your first Message.

## Prerequisites

- A device with a released PushGo client installed.
- A terminal that can run `curl`.
- A channel ID and channel password. You can create a new channel in the client or subscribe to one shared by another device.

## 1. Install a Client

Install one of the released clients.

| Platform | Download | Requirement |
| :--- | :--- | :--- |
| iOS / macOS / watchOS | [App Store](https://apps.apple.com/app/pushgo) | iOS 18+, macOS 15+, watchOS 11+ |
| Android | [GitHub Releases](https://github.com/AldenClark/pushgo-android/releases) | Android 12+ |

## 2. Create or Subscribe to a Channel

A channel is the PushGo write boundary. Requests go to a channel, and subscribed devices become delivery targets.

### Create a New Channel

1. Open the client.
2. Use the add action.
3. Choose create channel.
4. Enter a recognizable name and an 8-128 character password.
5. Save the generated channel ID and password.

### Subscribe to an Existing Channel

1. Open the client.
2. Choose subscribe channel.
3. Enter the channel ID and password.
4. After subscription, the device will receive content for that channel.

## 3. Choose a Public Gateway

Public gateways are useful for testing without deploying a server.

| Region | Gateway |
| :--- | :--- |
| Global | `https://gateway.pushgo.dev` |
| Mainland China | `https://gateway.pushgo.cn` |

Choose the region closest to you and your receiving devices. If you self-host, replace the example URL with your own Gateway URL. If your Gateway uses `PUSHGO_TOKEN`, add `Authorization: Bearer <token>`.

## 4. Send the First Message

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Hello from PushGo",
    "body": "This is a test notification.",
    "severity": "normal"
  }'
```

A successful response looks like:

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "message_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` means the Gateway accepted the request. `accepted=true` means it entered dispatch; final notification display still depends on device state, platform push services, and private transport status.

## Common Issues

| Symptom | Check |
| :--- | :--- |
| `400` response | JSON validity, field names, and required `title`, `channel_id`, `password`. |
| `401` response | Private Gateway `PUSHGO_TOKEN` and `Authorization: Bearer <token>`. |
| `404` response | Channel ID and whether the device created or subscribed to the channel. |
| `success=true` but no notification | Device notification permission, network state, Android private transport, APNs/FCM delivery. |
| Payload too large | JSON body max is 32KB; use image URLs instead of embedding binary data. |

See [Limits & Errors](/reference/limits-errors/) for more status codes.

## Next Steps

- To understand why PushGo has three models, read [Core Concepts](/guides/concepts/).
- To choose Message, Event, or Thing, read [Data Models](/guides/data-models/).
- To integrate real scripts, read [Use Cases](/guides/use-cases/).
- To run your own Gateway, read [Self-Hosting](/guides/self-hosting/).
