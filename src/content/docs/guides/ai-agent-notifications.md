---
title: AI Agent Notifications with MCP
description: Send mobile notifications, lifecycle events, and state updates from AI agents and chatbots through PushGo MCP and OAuth.
---

Use PushGo when an AI agent, chatbot, or MCP client needs to notify a user, report long-running progress, or update an operational object without exposing channel passwords to the model.

## Good Fits

- Notify a user when an agent finishes a long task.
- Track agent progress as an Event instead of sending unrelated messages.
- Update a Thing when an agent changes the state of a service, device, or task.
- Give third-party MCP clients scoped access through OAuth channel binding.

## How PushGo models this workflow

| Need | Use | Why |
| :--- | :--- | :--- |
| One completion alert | Message | The user needs one visible notification. |
| Long-running agent task | Event | The same task can be updated and closed. |
| Current status of a service or task | Thing | The agent updates one persistent object. |
| Assistant authorization | MCP OAuth | The model never needs the channel password in tool calls. |

## Minimal example

An MCP client connects to `/mcp`, starts `pushgo.channel.bind.start`, the user authorizes a channel in the browser, and the assistant can call `pushgo.message.send`, `pushgo.event.update`, or `pushgo.thing.update` within that scope.

```text
pushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send
```

## Questions this page answers

- **Can an AI agent send a push notification to my phone?** Yes. PushGo exposes MCP tools that let authorized AI agents send Message notifications through a PushGo Gateway.
- **Should a chatbot hold my channel password?** No. Production integrations should use MCP OAuth so the user binds a channel in the browser and the model receives only scoped tool access.
- **How should agents report progress?** Use Event for long-running work because it can be created, updated repeatedly, and closed when the task finishes.

## Security and operations

- Prefer scoped credentials and separate Channels for high-risk automation.
- Use MCP OAuth for AI assistants so models do not directly hold Channel passwords.
- Use self-hosting when the data path, transport policy, or compliance boundary must stay under your control.
- Use E2EE for sensitive fields that should be decrypted only by clients.

## Next steps

- [MCP Reference](/reference/mcp/)
- [Authentication](/reference/auth/)
- [Data Models](/guides/data-models/)
