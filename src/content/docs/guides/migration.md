---
title: Migration Guide
description: Migrate existing ntfy, Bark, ServerChan, or webhook scripts to PushGo.
---

Migrating to PushGo does not require rewriting every script at once. Start with compatibility endpoints so existing scripts keep working, then upgrade important workflows to native Message, Event, or Thing APIs.

## Recommended Path

1. **Change the endpoint**: point your ntfy, Bark, or ServerChan request at the PushGo compatibility endpoint.
2. **Replace the key**: use `<channel_id>:<password>` as the compatibility key.
3. **Normalize fields**: map priority, level, group, icon, and similar fields into `severity`, `tags`, `images`, or `metadata`.
4. **Upgrade models**: keep one-off alerts as Message; upgrade lifecycles to Event; upgrade persistent state to Thing.

## Compatibility Endpoints

| Source | Method | PushGo path | Key location |
| :--- | :--- | :--- | :--- |
| ntfy | `POST` / `PUT` | `/ntfy/{topic}` | `{topic}` = `<channel_id>:<password>` |
| ServerChan | `GET` / `POST` | `/serverchan/{sendkey}` | `{sendkey}` = `<channel_id>:<password>` |
| Bark v1 | `GET` | `/bark/{device_key}/{body}` | `{device_key}` = `<channel_id>:<password>` |
| Bark v2 | `POST` | `/bark/push` | JSON field `device_key` |

Compatibility endpoints reduce migration cost. They do not express the full PushGo data model. Use native APIs when you need `thing_id`, Event lifecycles, or full Thing state.

## From ntfy

Old request:

```bash
curl -d "NAS backup completed" https://ntfy.example.com/my-topic
```

PushGo compatibility endpoint:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -H "Priority: 3" \
  -d "NAS backup completed"
```

Native Message:

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The NAS backup task has finished.",
    "severity": "normal",
    "tags": ["nas", "backup"]
  }'
```

## From Bark

Bark commonly puts the device key in the path. Replace that key with `<channel_id>:<password>`.

```bash
curl "https://gateway.pushgo.dev/bark/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD/Server%20alert?title=CPU%20High&level=timeSensitive"
```

If you already use JSON requests, prefer migrating directly to native Message. Native APIs express `images`, `tags`, `metadata`, `thing_id`, and E2EE more clearly.

## From ServerChan

```bash
curl -X POST https://gateway.pushgo.dev/serverchan/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -d "title=Deployment completed" \
  -d "desp=Production deployment succeeded"
```

ServerChan is mostly a one-off alert model. If your script sends "started", "running", and "finished", upgrade directly to Event.

## When to Upgrade to Event

If the same task sends multiple stage updates, Event is a better fit.

| Old script behavior | Event expression |
| :--- | :--- |
| Send "deployment started" | `/event/create` |
| Send "build completed" or "publishing" | `/event/update` |
| Send "deployment succeeded/failed" | `/event/close` |

This lets clients show one coherent timeline instead of unrelated messages.

## When to Upgrade to Thing

If your script repeatedly reports the current state of the same object, use Thing.

| Old script behavior | Thing expression |
| :--- | :--- |
| Send CPU/memory every minute | `/thing/update` with `attrs` |
| Send room temperature repeatedly | One room or sensor per `thing_id` |
| Service online/offline alerts | Thing for the service, Message or Event for incidents |

## Compatibility Limits

- Compatibility keys contain the channel password; do not write them to public logs.
- The ntfy compatibility endpoint does not support `thing_id`.
- Compatibility endpoints cannot express the full Thing lifecycle.
- Provider-specific priority and field names are mapped and may not be preserved one-to-one.
- Complex metadata, E2EE, and entity relationships are clearer after migrating to native APIs.
