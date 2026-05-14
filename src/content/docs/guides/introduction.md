---
title: Introduction
description: What PushGo is, who it is for, and where to start.
---

**PushGo** is an open-source notification and state synchronization system for personal automation, server/NAS monitoring, DevOps, IoT, and AI assistant workflows. It consists of clients, a Gateway, and HTTP APIs. You can use the public Gateway directly or deploy your own.

## What PushGo Solves

Many notification tools only send text to a phone. That is enough for simple alerts, but it becomes messy when you need task progress, incident lifecycles, device state, or AI assistant actions.

PushGo separates data into three models:

| Model | Purpose | Examples |
| :--- | :--- | :--- |
| Message | One-off alert | Backup completed, disk almost full, price dropped |
| Event | Process that can be updated and closed | Deployment, incident handling, door open to closed |
| Thing | Persistent entity state | NAS, sensor, room, network service |

The result is that alerts, processes, and state are no longer squeezed into the same text field. Clients and automation can reason about them more reliably.

## System Components

```text
Script / Service / AI assistant
        |
        v
PushGo Gateway
        |
        +-- APNs -> Apple clients
        +-- FCM  -> Android clients
        +-- Private transport -> Android low-latency sync
```

The Gateway handles authentication, API acceptance, state storage, and dispatch. Clients receive, display, decrypt, and manage channel subscriptions.

## Who It Is For

- Personal users: scripts, webhooks, price monitors, and long-running tasks.
- Home server and NAS users: disk, backup, UPS, and service-state monitoring.
- DevOps users: deployments, builds, incidents, and service health.
- IoT / Home Assistant users: rooms, sensors, and security events.
- Self-hosters: control data, authentication, private transports, and MCP/OAuth on your own Gateway.

## Where to Start

| Goal | Read |
| :--- | :--- |
| Receive your first notification | [Getting Started](/guides/getting-started/) |
| Understand how the system works | [Core Concepts](/guides/concepts/) |
| Choose the right data model | [Data Models](/guides/data-models/) |
| See real integration patterns | [Use Cases](/guides/use-cases/) |
| Migrate from ntfy, Bark, or ServerChan | [Migration Guide](/guides/migration/) |
| Deploy your own Gateway | [Self-Hosting](/guides/self-hosting/) |
| Integrate AI assistants | [MCP Reference](/reference/mcp/) |

If you do not have a channel yet, start with Getting Started. If you already have a script to integrate, read Data Models and the Message API.
