---
title: Core Concepts
description: Understand PushGo's channels, gateway, clients, and three data models.
---

PushGo can be understood as a synchronization path from your scripts, services, or devices to the clients subscribed to a channel. It does not only turn text into a system notification; its clients also project Event lifecycles and Thing state from the accepted patches so history, filtering, and automation stay structured.

## One Mental Model

```text
Sender -> Gateway -> Channel -> Subscribed devices
                  |
                  +-> Message / Event / Thing
```

- **Sender**: your script, server, Home Assistant, CI/CD pipeline, or AI assistant.
- **Gateway**: validates and durably accepts requests, stores operational delivery state, selects delivery paths, and dispatches data.
- **Channel**: the communication space subscribed to by one or more devices. Requests need a channel ID and password.
- **Client**: Apple clients receive through APNs; Android clients can use FCM plus private transports.
- **Data model**: PushGo separates one-off alerts, lifecycle processes, and persistent state into different objects.

## Channel: Permission and Subscription Boundary

A channel is PushGo's basic boundary. Multiple devices can subscribe to one channel, and multiple senders can write to it if they know the credentials.

| Concept | Purpose |
| :--- | :--- |
| `channel_id` | Identifies where the request is sent. |
| `password` | Authorizes writes to the channel. |
| Subscribed devices | Receive content accepted for the channel. |

The channel password is not the gateway administrator password. Public and private gateways both use channel-level authorization; private gateways may also require a gateway-level Bearer token.

## Gateway: Acceptance and Delivery

When the Gateway receives a request, it:

1. Validates the request, channel credentials, and optional gateway Bearer token.
2. Durably records the submission and operational delivery state; it does not merge Event/Thing patches into a canonical server-side entity record.
3. Dispatches to subscribed devices through APNs, FCM, or Android private transports.

Subscribed clients persist and project Event/Thing history and current state. The IDs correlate those patches; update routes validate their format but do not require a prior server-side create record. The send response acknowledges durable Gateway acceptance. Delivery is asynchronous: use the returned `op_id` for coarse sender status, but do not treat it as a provider-success or device-display receipt.

## Three Data Models

PushGo's core idea is not "many notification fields"; it is using different models for different business objects.

| Model | Represents | Examples | Main API |
| :--- | :--- | :--- | :--- |
| Message | One-off alert | Disk warning, backup completed, price dropped | `POST /message` |
| Event | Process with updates and an end | Deployment, incident handling, door open to closed | `/event/create`, `/event/update`, `/event/close` |
| Thing | Persistent entity state | NAS, sensor, room, network service | `/thing/create`, `/thing/update`, `/thing/archive`, `/thing/delete` |

Ask one question first: are you notifying about something, tracking a process, or synchronizing an object's current state?

## Delivery Paths

PushGo does not force every platform through the same background connection.

| Platform | Primary path | Notes |
| :--- | :--- | :--- |
| Apple platforms | APNs | System-managed delivery for iOS, macOS, and watchOS. |
| Android | FCM + private transports | FCM for wake-up; private transports for lower-latency sync. |
| Self-hosted Gateway | Deployment-dependent | Can enable WSS, QUIC, Raw TCP, and MQTT 5 for Android private transports. |

See [Apps and Platform Support](/guides/apps/) for client capabilities.

## Security Layers

| Layer | What it solves |
| :--- | :--- |
| Channel password | Prevents unauthorized writes to a channel. |
| Gateway Bearer token | Restricts who can call a private Gateway instance. |
| HTTPS / TLS | Protects credentials and requests in transit. |
| E2EE `ciphertext` | Lets clients decrypt sensitive business fields locally while the Gateway only relays ciphertext. |
| MCP OAuth | Lets AI assistants act within authorized channel scopes without directly holding channel passwords. |

If you only want to send your first test notification, understand Channel and Message first. Read the data model, authentication, and self-hosting guides when you need long-lived state or your own Gateway.
