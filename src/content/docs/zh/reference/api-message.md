---
title: 消息 API (Message)
description: 使用 /message 发送一次性通知，并理解字段、响应和投递语义。
---

Message API 用于发送顶层瞬时通知。它适合告警、完成提醒、带图片的快照、价格提醒等“不需要后续更新或关闭”的场景。

## Endpoint

```http
POST /message
```

请求体必须是 JSON。未知扩展字段会被忽略；当前动作明确禁止的已知字段仍会被拒绝。私有 Gateway 如果启用了 `PUSHGO_TOKEN`，还需要 `Authorization: Bearer <token>`。

## 请求头

| Header | 必填 | 说明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 请求体格式。 |
| `Authorization: Bearer <token>` | 视网关配置而定 | 仅私有 Gateway 开启 `PUSHGO_TOKEN` 时必填。 |

## 请求字段

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 是 | 目标频道 ID。 |
| `password` | `string` | 是 | 频道密码；先 trim，再按 8-128 字节校验。 |
| `title` | `string` | 是 | 消息标题，不能为空。 |
| `body` | `string` | 否 | 消息正文，可包含 Markdown。 |
| `op_id` | `string` | 否 | 幂等键，1-128 个字符，只允许字母、数字、`_`、`:`、`-`。 |
| `thing_id` | `string` | 否 | 将消息归入某个 Thing ID；1-64 个字符，可用字母、数字、`_`、`:`、`-`。Gateway 只校验格式，不要求服务端已存在 Thing 记录。 |
| `occurred_at` | `number` 或数字字符串 | 否 | 接受 Unix 秒或毫秒并归一化为毫秒；传入 `thing_id` 时必填。 |
| `severity` | `string` | 否 | `critical`、`high`、`normal`、`low`；未知值按 `normal` 处理。 |
| `ttl` | `number` 或数字字符串 | 否 | 接受 Unix 秒或毫秒；provider 投递 TTL 上限为 30 天。 |
| `url` | `string` | 否 | 点击跳转 URL。 |
| `images` | `string[]` | 否 | 最多 32 个图片 URL，每个最长 2048 字节。 |
| `tags` | `string[]` | 否 | 最多 32 个标签，每个最长 64 字节，trim 后去重。 |
| `ciphertext` | `string` | 否 | 可选 E2EE 密文载荷。 |
| `metadata` | `object` | 否 | 自定义标量键值；key <= 64 字节，非空标量文本 <= 512 字节；拒绝嵌套对象、数组和 null。 |

`message_id` 由 Gateway 生成，客户端传入会被拒绝。未知字段会被忽略且不会生效，因此请注意字段拼写。

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
  "occurred_at": 1713750000000,
  "title": "家庭 NAS 磁盘预警",
  "body": "volume1 使用率已达到 92%。",
  "severity": "high",
  "tags": ["nas", "disk"]
}
```

## 成功响应

相同 `op_id` 配合相同的归一化请求内容和作用域会返回最初结果；用于不同内容或作用域会返回 `409`。省略时由 Gateway 生成。

```json
{
  "success": true,
  "data": {
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
}
```

`success=true` 表示 Gateway 已持久受理请求，不代表推送提供商已成功或设备已展示。需要粗粒度分发状态时，保存 `op_id` 并查询 `GET /send_status/{op_id}`。

## 常见错误

| 状态码 | 典型原因 |
| :--- | :--- |
| `400` | 必填字段缺失/无效、传入 `message_id`、`title` 为空或 metadata 无效。 |
| `401` | 私有 Gateway 要求 Bearer Token，但 Header 缺失或错误。 |
| `404` | 频道不存在或频道凭据无法匹配。 |
| `409` | `op_id` 被用于不同的请求内容或作用域。 |
| `413` | 请求体超过 32 KiB（32,768 字节）。 |
| `503` | Gateway 无法受理本次提交。 |

更多限制见 [限制与错误](/zh/reference/limits-errors/)。

## 旧版 GET Query 形式

为兼容旧调用，Gateway 仍支持 `GET /message`。它以 query 参数接收上述标量字段；`images` 和 `tags` 使用逗号分隔，`metadata` 是 JSON 编码字符串。新集成应使用 JSON `POST`，因为 URL、访问日志和浏览器历史可能暴露频道密码或载荷。

## 兼容接口

PushGo 还提供 ntfy、Bark 和 ServerChan 兼容入口，便于迁移旧脚本。兼容接口的字段覆盖能力有限；需要 `thing_id`、E2EE 或完整模型语义时，请使用原生 `/message`。迁移方式见 [迁移指南](/zh/guides/migration/)。
