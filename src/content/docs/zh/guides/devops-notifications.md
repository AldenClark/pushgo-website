---
title: DevOps 与 CI/CD 通知
description: 用 PushGo 处理 CI/CD、部署、故障、服务器和监控通知，并用 Message、Event、Thing 建模。
---

DevOps 通知如果全部写成纯文本，很容易变成不可读的信息流。PushGo 把一次性告警、故障生命周期和服务当前状态分开建模。

## 适合场景

- 发送构建、部署和发布通知。
- 把故障处理过程记录为可更新的 Event。
- 把服务、队列、备份任务或主机状态展示为 Thing。
- 通过公共 Gateway 或私有 Gateway 投递到 Apple 和 Android 客户端。

## PushGo 如何建模这个流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 构建完成 | Message | 只需要一条可见提醒。 |
| 部署进行中 | Event | 同一个生命周期可以从开始更新到失败或完成。 |
| 服务健康状态 | Thing | 对象有随时间变化的当前状态。 |

## 最小示例

流水线完成用 Message；部署过程有多次状态变化时用 Event；用户更关心服务当前状态时用 Thing。

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "来自 PushGo 的通知",
    "body": "自动化通知路径已经打通。"
  }'
```

## 本页直接回答的问题

- **PushGo 适合 CI/CD 通知吗？** 适合。CI/CD 系统可以在 shell step 或 webhook action 中直接调用 HTTP API。
- **故障应该如何表达？** 用 Event，让同一故障可以持续更新并关闭，而不是产生很多无关通知。
- **团队可以私有部署 DevOps 通知吗？** 可以。私有 Gateway 可以控制数据路径、鉴权和运维策略。

## 安全与运维

- 高风险自动化应使用独立 Channel 和受限凭据。
- AI 助手应优先使用 MCP OAuth，避免模型直接持有 Channel 密码。
- 当数据路径、通道策略或合规边界必须自行控制时，使用私有部署。
- 敏感字段应使用 E2EE，让客户端本地解密。

## 下一步

- [数据模型](/zh/guides/data-models/)
- [事件 API](/zh/reference/api-event/)
- [私有部署](/zh/guides/self-hosting/)
