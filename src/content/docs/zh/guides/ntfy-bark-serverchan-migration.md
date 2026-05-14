---
title: 从 ntfy、Bark 或 ServerChan 迁移
description: 通过兼容接口和原生模型，把现有 ntfy、Bark、ServerChan 或 Webhook 通知脚本迁移到 PushGo。
---

PushGo 可以先接住现有通知式流程，再逐步把重要路径迁移到原生 Message、Event 和 Thing 模型。

## 适合场景

- 评估 PushGo 时先保持简单脚本继续工作。
- 一次迁移一条告警路径，而不是重写所有自动化。
- 把纯文本消息升级为结构化生命周期或实体状态。
- 在敏感流程中结合 E2EE 和私有部署。

## PushGo 如何建模这个流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 简单迁移告警 | Message | 旧通知保持为一次性消息。 |
| 有状态变化的流程 | Event | 多次更新应属于同一个生命周期。 |
| 长期监控对象 | Thing | 同一个实体可以随时间更新。 |

## 最小示例

先把低风险脚本迁移到兼容接口；需要更强语义的流程，再迁移到原生 `/message`、`/event/*` 或 `/thing/*` API。

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

- **必须马上重写所有脚本吗？** 不需要。可以先使用兼容接口，优先迁移高价值流程。
- **什么时候不该继续用纯文本通知？** 当流程有进度、关闭、当前状态、图片、元数据或安全要求时，应升级到原生模型。
- **这是直接功能对比吗？** 不是。迁移应按建模需求判断：简单提醒保持简单，需要结构的流程再升级。

## 安全与运维

- 高风险自动化应使用独立 Channel 和受限凭据。
- AI 助手应优先使用 MCP OAuth，避免模型直接持有 Channel 密码。
- 当数据路径、通道策略或合规边界必须自行控制时，使用私有部署。
- 敏感字段应使用 E2EE，让客户端本地解密。

## 下一步

- [迁移指南](/zh/guides/migration/)
- [消息 API](/zh/reference/api-message/)
- [数据模型](/zh/guides/data-models/)
