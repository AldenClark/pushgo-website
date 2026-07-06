---
title: Apps and Platform Support
description: Understand released PushGo clients, system requirements, and platform delivery paths.
---

PushGo currently publishes Apple platform clients, an Android client, and the Gateway. This website only describes publicly available releases.

## Platform Overview

| Platform | Download | Requirement | Primary delivery path | Private transport |
| :--- | :--- | :--- | :--- | :--- |
| iOS | App Store | iOS 18+ | APNs | No |
| macOS | App Store | macOS 15+ | APNs | No |
| watchOS | App Store | watchOS 11+ | APNs | No |
| Android | GitHub Releases | Android 9+ | FCM + private transports | Yes, QUIC / Raw TCP / WSS |

## Apple Clients

Apple clients follow the system push model. APNs handles background delivery.

Good fits:

- Receiving personal notifications on iPhone, Mac, and Apple Watch.
- Using system notification priorities and notification extensions for rich content.
- Keeping client behavior close to the operating system instead of maintaining a long-running background connection.

Notes:

- Apple clients do not use PushGo Android private transports.
- Background delivery depends on APNs, notification permissions, Focus modes, and device network state.
- E2EE fields are decrypted locally after a key is configured; if no key is configured or decryption fails, clients keep the fallback display state.

## Android Client

The Android client supports both provider delivery and PushGo private transports.

Good fits:

- Lower-latency state synchronization.
- Self-hosted Gateway deployments where devices connect to your own sync entrypoint.
- FCM wake-up combined with private transport when active synchronization is needed.

Private transports are selected from the Gateway profile and current network conditions.

| Transport | Use case |
| :--- | :--- |
| WSS | Most universal; reuses HTTPS and is the best default private transport. |
| QUIC | Lower latency when UDP ports can be exposed. |
| Raw TCP | Controlled networks or dedicated layer-4 entrypoints. |

Private transports require the Gateway to enable the matching transport and advertise reachable ports, certificates, and public base URL. See [Self-Hosting](/guides/self-hosting/).

## Gateway

The Gateway is PushGo's server component. It:

- Validates channel passwords and optional gateway Bearer tokens.
- Accepts Message, Event, and Thing requests.
- Maintains event and entity state.
- Dispatches through APNs, FCM, or Android private transports.
- Can enable MCP/OAuth for AI assistants acting within authorized channel scopes.

You can use the public Gateway or self-host one to control data paths, authentication policy, and operations.

## Capability Matrix

| Capability | Apple | Android | Gateway |
| :--- | :--- | :--- | :--- |
| Receive Message | Yes | Yes | Dispatches |
| Display Event / Thing | Yes | Yes | Stores and dispatches state |
| E2EE field decryption | Yes | Yes | Relays ciphertext only |
| Private transport | No | Yes | Requires enabled private entrypoint |
| MCP/OAuth | N/A | N/A | Optional |

If you only want to receive notifications, install a client and follow [Getting Started](/guides/getting-started/). If you need data-path control and private transports, continue with self-hosting.
