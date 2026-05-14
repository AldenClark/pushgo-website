---
title: Data Models
description: Decide when to use Message, Event, or Thing, and understand their field boundaries.
---

PushGo's three data models carry different business semantics. Choosing the right model makes client presentation, history, state merging, and automation easier to reason about.

## Decision Matrix

| What you need to express | Use | Why |
| :--- | :--- | :--- |
| "Something happened; notify me once" | Message | No persistent state; each message stands alone. |
| "Something started, changes over time, and eventually ends" | Event | One `event_id` can be updated multiple times and then closed. |
| "This device, service, room, or task has current state" | Thing | One `thing_id` can be updated over time. |
| "An alert happened on a specific entity" | Thing + Message | Thing identifies the entity; Message records the alert. |
| "A specific entity is going through a process" | Thing + Event | Thing identifies the object; Event records the lifecycle. |

## Message: One-Off Alert

Message is the simplest notification model. Use it for content that does not need later merging or closing.

### Good Fits

- Disk usage crossed a threshold.
- Backup completed.
- Price dropped.
- A camera detected motion and includes a snapshot.

### Poor Fits

- A deployment's build, publish, and finish lifecycle.
- The latest state of a server, sensor, or room.
- A dashboard value that should be overwritten over time.

### Field Groups

| Group | Fields |
| :--- | :--- |
| Auth and routing | `channel_id`, `password`, `op_id`, `thing_id` |
| Display | `title`, `body`, `severity`, `url`, `images`, `tags` |
| Time and security | `occurred_at`, `ttl`, `ciphertext` |
| Extensions | `metadata` |

### Minimal Example

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Backup completed",
  "body": "The daily NAS backup has finished.",
  "severity": "normal"
}
```

## Event: Updatable Lifecycle

Event represents a process. Creating it returns an `event_id`; subsequent updates and the final close call use that ID.

### Good Fits

- CI/CD deployment: started, building, published, succeeded or failed.
- Incident handling: detected, investigating, recovered.
- Door/window state: opened and then closed.
- Long-running tasks: transcoding, sync, model training.

### Lifecycle

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   ends the event
```

### Field Groups

| Group | Fields |
| :--- | :--- |
| Auth and routing | `channel_id`, `password`, `op_id`, `thing_id` |
| Lifecycle | `event_id`, `event_time`, `started_at`, `ended_at` |
| Display | `title`, `description`, `status`, `message`, `severity`, `tags`, `images` |
| Extensions | `attrs`, `metadata`, `ciphertext` |

### Modeling Tips

- Use short `status` values such as `running`, `degraded`, `success`, or `failed`.
- Use `message` for the current update, such as "image pushed".
- `event_time` is when this update happened.
- `started_at` is the overall event start time and belongs on create.
- `ended_at` is the overall event end time and belongs on close.

## Thing: Persistent Entity State

Thing represents a long-lived object. Its value comes from updating the same object instead of creating unrelated notifications.

### Good Fits

- Home NAS, server, or network service.
- Room, sensor, camera, or lock.
- Long-running asset or task.
- Anything that should show current state.

### Lifecycle

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

### Field Groups

| Group | Fields |
| :--- | :--- |
| Auth and routing | `channel_id`, `password`, `op_id` |
| Identity and display | `thing_id`, `title`, `description`, `tags`, `primary_image`, `images` |
| Time | `created_at`, `observed_at`, `deleted_at` |
| External systems | `external_ids`, `location_type`, `location_value` |
| State | `attrs`, `metadata`, `ciphertext` |

### Modeling Tips

- Use `title` for the human-readable name, such as "Home NAS".
- Use `attrs` for changing values such as CPU, temperature, or online state.
- Use `metadata` for auxiliary data that is not usually displayed.
- Use `external_ids` to connect to IDs from systems such as Home Assistant.

## Combining Models

| Combination | Pattern |
| :--- | :--- |
| Thing + Message | A "disk almost full" alert occurred on the "Home NAS" entity. |
| Thing + Event | The "production database" entity is experiencing a replication lag event. |
| Event + Message | Event records the lifecycle; Message sends a strong alert at a critical point. |

If unsure, start with Message. When a script repeatedly sends "started/updated/finished" or "current value changed", upgrade to Event or Thing.
