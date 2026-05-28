---
title: 消息 API (Message)
description: 使用 /message 发送一次性通知，并理解字段、响应和投递语义。
---

Message API 用于发送顶层瞬时通知。它适合告警、完成提醒、带图片的快照、价格提醒等“不需要后续更新或关闭”的场景。

## Endpoint

```http
POST /message
```

请求体必须是 JSON，未声明字段会被严格拒绝。私有 Gateway 如果启用了 `PUSHGO_TOKEN`，还需要 `Authorization: Bearer <token>`。

## 请求头

| Header | 必填 | 说明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 请求体格式。 |
| `Authorization: Bearer <token>` | 视网关配置而定 | 仅私有 Gateway 开启 `PUSHGO_TOKEN` 时必填。 |

## 请求字段

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 是 | 目标频道 ID。 |
| `password` | `string` | 是 | 频道密码，通常 8-128 个字符。 |
| `title` | `string` | 是 | 消息标题，不能为空。 |
| `body` | `string` | 否 | 消息正文，可包含 Markdown。 |
| `op_id` | `string` | 否 | 幂等键，1-128 个字符，只允许字母、数字、`_`、`:`、`-`。 |
| `thing_id` | `string` | 否 | 关联到已有 Thing；1-64 个字符，可用字母、数字、`_`、`:`、`-`。 |
| `occurred_at` | `number` | 否 | 消息发生时间；接受 Unix 秒或毫秒。传入 `thing_id` 时必填。 |
| `severity` | `string` | 否 | `critical`、`high`、`normal`、`low`；未知值按 `normal` 处理。 |
| `ttl` | `number` | 否 | Unix 毫秒过期时间；provider 投递 TTL 最大约 28 天。 |
| `url` | `string` | 否 | 点击跳转 URL。 |
| `images` | `string[]` | 否 | 最多 32 个图片 URL，每个最长 2048 字符。 |
| `tags` | `string[]` | 否 | 最多 32 个标签，每个最长 64 字符，trim 后去重。 |
| `ciphertext` | `string` | 否 | 可选 E2EE 密文载荷。 |
| `metadata` | `object` | 否 | 自定义标量键值；key <= 64，非空标量 value <= 512；拒绝嵌套对象和数组。 |

## 优先级映射

| `severity` | APNs interruption level | FCM priority |
| :--- | :--- | :--- |
| `critical` | `critical` | `HIGH` |
| `high` | `time-sensitive` | `HIGH` |
| `normal` | `active` | `HIGH` |
| `low` | `passive` | `NORMAL` |

## 最小示例

```bash
curl -X POST https://gateway.pushgo.cn/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "备份完成",
    "body": "NAS 每日备份已经完成。",
    "severity": "normal"
  }'
```

## 关联 Thing

如果这条提醒属于某个长期实体，可以传 `thing_id`。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
  "title": "家庭 NAS 磁盘预警",
  "body": "volume1 使用率已达到 92%。",
  "severity": "high",
  "tags": ["nas", "disk"]
}
```

## 成功响应

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` 表示请求通过校验并被 Gateway 处理。`accepted=true` 表示 Gateway 已进入分发流程；最终设备展示仍取决于系统推送服务、设备在线状态和私有通道状态。

## 常见错误

| 状态码 | 典型原因 |
| :--- | :--- |
| `400` | 缺少必填字段、字段名未知、`title` 为空、`op_id` 格式错误。 |
| `401` | 私有 Gateway 要求 Bearer Token，但 Header 缺失或错误。 |
| `404` | 频道不存在或频道凭据无法匹配。 |
| `413` | 请求体超过 32KB。 |
| `503` | Gateway 未能完整进入分发流程，响应中可能出现 `accepted=false`。 |

更多限制见 [限制与错误](/zh/reference/limits-errors/)。

## 兼容接口

PushGo 还提供 ntfy、Bark 和 ServerChan 兼容入口，便于迁移旧脚本。兼容接口的字段覆盖能力有限；需要 `thing_id`、E2EE 或完整模型语义时，请使用原生 `/message`。迁移方式见 [迁移指南](/zh/guides/migration/)。
