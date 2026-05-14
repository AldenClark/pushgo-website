---
title: 面向 AI Agent 的 MCP 通知
description: 通过 PushGo MCP 和 OAuth，让 AI agent、聊天机器人和 MCP 客户端发送通知、更新事件和同步状态。
---

当 AI agent、聊天机器人或 MCP 客户端需要通知用户、报告长任务进度，或更新一个服务/设备/任务状态时，可以用 PushGo 建立一条清晰的通知路径，并避免让模型直接持有 Channel 密码。

## 适合场景

- Agent 完成长任务后通知用户。
- 把 Agent 进度记录为可更新的 Event。
- 当 Agent 改变服务、设备或任务状态时更新 Thing。
- 通过 OAuth Channel 绑定给第三方 MCP 客户端授权。

## PushGo 如何建模这个流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 一次完成提醒 | Message | 用户只需要一条可见通知。 |
| 长时间运行的 Agent 任务 | Event | 同一个任务可以持续更新并关闭。 |
| 服务或任务当前状态 | Thing | Agent 更新同一个持久对象。 |
| 助手授权 | MCP OAuth | 模型不需要在工具调用中持有 Channel 密码。 |

## 最小示例

MCP 客户端连接 `/mcp`，启动 `pushgo.channel.bind.start`，用户在浏览器里授权 Channel，之后助手即可在该权限范围内调用 `pushgo.message.send`、`pushgo.event.update` 或 `pushgo.thing.update`。

```text
pushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send
```

## 本页直接回答的问题

- **AI agent 可以给我的手机发送推送通知吗？** 可以。PushGo 提供 MCP 工具，授权后的 AI agent 可以通过 Gateway 发送 Message 通知。
- **聊天机器人应该保存我的 Channel 密码吗？** 不应该。生产环境应使用 MCP OAuth，由用户在浏览器里绑定 Channel，模型只获得受限工具访问权。
- **Agent 应该如何报告进度？** 长任务使用 Event，因为它可以创建、反复更新，并在任务结束时关闭。

## 安全与运维

- 高风险自动化应使用独立 Channel 和受限凭据。
- AI 助手应优先使用 MCP OAuth，避免模型直接持有 Channel 密码。
- 当数据路径、通道策略或合规边界必须自行控制时，使用私有部署。
- 敏感字段应使用 E2EE，让客户端本地解密。

## 下一步

- [MCP 参考](/zh/reference/mcp/)
- [身份验证](/zh/reference/auth/)
- [数据模型](/zh/guides/data-models/)
