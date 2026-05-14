---
title: NAS、IoT 与 Home Assistant 通知
description: 用 PushGo 处理 NAS 告警、IoT 设备、Home Assistant 自动化和长期设备状态更新。
---

家庭自动化和设备监控通常不只是一次提醒。PushGo 可以发送通知、跟踪事件，并维护设备或服务的当前状态。

## 适合场景

- 把 NAS 磁盘、备份和服务告警发送到手机和桌面端。
- 通过 webhook 风格的 HTTP 请求接入 Home Assistant 自动化。
- 把设备、传感器、备份任务或媒体服务建模为 Thing。
- 当家庭数据需要自己掌控时使用私有 Gateway。

## PushGo 如何建模这个流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 门铃快照或磁盘告警 | Message | 内容是一条单次提醒。 |
| 备份或媒体扫描进度 | Event | 进度可以持续更新到完成。 |
| 传感器或设备状态 | Thing | 最新状态比每次历史更新更重要。 |

## 最小示例

NAS 脚本可以用 `/message` 发送磁盘告警；备份任务可以创建 Event，并持续更新到成功或失败。

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

- **PushGo 可以接收 Home Assistant webhook 通知吗？** 可以。Home Assistant 自动化可以通过 webhook 或 REST action 调用 PushGo HTTP API。
- **如何避免重复的过期设备通知？** 用 Thing 表达设备或服务状态，让客户端显示同一个对象的当前状态。
- **可以在私有网络里运行吗？** 可以。需要控制数据路径或通道策略时，可以私有部署 Gateway。

## 安全与运维

- 高风险自动化应使用独立 Channel 和受限凭据。
- AI 助手应优先使用 MCP OAuth，避免模型直接持有 Channel 密码。
- 当数据路径、通道策略或合规边界必须自行控制时，使用私有部署。
- 敏感字段应使用 E2EE，让客户端本地解密。

## 下一步

- [典型场景](/zh/guides/use-cases/)
- [实体 API](/zh/reference/api-thing/)
- [私有部署](/zh/guides/self-hosting/)
