---
title: 面向脚本和服务的推送通知 API
description: 把 PushGo 用作 curl、Webhook、cron、CI/CD、NAS 告警和自动化脚本的 HTTP 通知 API。
---

PushGo 提供直接可调用的 HTTP API，适合把脚本、服务和自动化结果可靠送达用户，同时保留事件和状态的结构化语义。

## 适合场景

- 从 curl、cron、Shell 脚本或 Webhook 发送通知。
- 报告任务完成、价格提醒、图片快照或监控结果。
- 用 Event 和 Thing 替代不断堆积的纯文本通知。
- 先使用兼容接口，再逐步迁移到 PushGo 原生 API。

## PushGo 如何建模这个流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 一次脚本告警 | Message | 简单、瞬时，适合用 curl 测试。 |
| 带进度的任务 | Event | 同一个事件可以持续更新到完成。 |
| 设备或服务当前状态 | Thing | 客户端看到最新状态，而不是一串过期通知。 |

## 最小示例

原生 `/message` 端点接收 JSON，并返回 Gateway 是否已经把请求受理进分发流程。

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

- **可以用 curl 发送通知吗？** 可以。Message API 适合从 curl、脚本和简单 HTTP 客户端调用。
- **PushGo 只是手机通知 API 吗？** 不是。PushGo 还可以表达 Event 生命周期和 Thing 当前状态。
- **这个 API 可以私有部署吗？** 可以。你可以运行自己的 Gateway，并控制鉴权、存储、通道和 MCP/OAuth。

## 安全与运维

- 高风险自动化应使用独立 Channel 和受限凭据。
- AI 助手应优先使用 MCP OAuth，避免模型直接持有 Channel 密码。
- 当数据路径、通道策略或合规边界必须自行控制时，使用私有部署。
- 敏感字段应使用 E2EE，让客户端本地解密。

## 下一步

- [快速上手](/zh/guides/getting-started/)
- [消息 API](/zh/reference/api-message/)
- [私有部署](/zh/guides/self-hosting/)
