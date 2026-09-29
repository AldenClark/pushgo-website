---
title: 限制与错误
description: PushGo Gateway 的通用限制、响应 envelope、状态码和排障入口。
---

本页汇总跨 API 的通用规则。单个接口的必填字段、生命周期和字段语义仍以对应 API 页面为准。

## 通用限制

| 项目 | 限制 |
| :--- | :--- |
| 请求体大小 | 最大 32 KiB（32,768 字节）。 |
| `channel_id` | 128 位 Crockford Base32；规范输出为 26 位大写字符。输入不区分大小写，忽略 ASCII 空白和连字符，并接受 Crockford 别名 `O`→`0`、`I`/`L`→`1`。 |
| Gateway 生成的实体 ID | 32 位小写十六进制字符串；非 create 路由接收的客户端 Event/Thing ID 也可使用下述通用格式。 |
| 频道密码 | 先 trim，再按 8-128 字节校验。 |
| `op_id` | 客户端值为 1-128 字符，只允许字母、数字、`_`、`:`、`-`，且仅 Message 接受。当前生成值由 13 位小写十六进制时间戳、连字符和 32 位小写十六进制随机值组成；调用方应将其视为不透明字符串。 |
| `thing_id` / `event_id` | 1-64 字符，只允许字母、数字、`_`、`:`、`-`。 |
| `images` | 最多 32 项，每项 URL 最大 2048 字节。 |
| `tags` | 最多 32 项，每项最大 64 字节，trim 后去重。 |
| `metadata` | 仅允许标量值；key 最大 64 字节，非空标量文本最大 512 字节；不允许嵌套对象、数组或 null。 |
| `ttl` 与 API 时间戳 | 文档注明的时间字段接受 Unix 秒或毫秒，并归一化为毫秒。 |
| 活跃订阅者 | 每个频道最多 32 个并发订阅者。 |
| 内置密码请求预算 | 每个 Gateway 进程：公开/密码敏感接口以及 MCP/OAuth 密码入口，每 IP 每分钟 60 次、全局每分钟 1,200 次。经共享 Bearer Token 鉴权的私有请求不受此 limiter 限制。 |
| 未知字段 | 原生 Message、Event、Thing 会忽略扩展字段；动作明确禁止的已知字段仍返回 400。 |

Message 的 `tags`、`images`、`severity` 按对应页面校验；Event 和 Thing 的 patch 内容不继承这些限制。

## 响应 envelope

成功：

```json
{
  "success": true,
  "data": {
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
}
```

失败：

```json
{
  "success": false,
  "error": "human readable message",
  "error_code": "machine_readable_code",
  "problem": {
    "code": "machine_readable_code",
    "category": "validation",
    "status": 400,
    "title": "Invalid request",
    "detail": "human readable message",
    "localized_message": "human readable message",
    "locale": "zh-CN",
    "retryable": false,
    "request_id": "request-id"
  }
}
```

无法提供的可选 `problem` 成员会被省略；存在请求作用域 ID 时，响应也会通过 `x-request-id` Header 返回。

成功 `data` 包含 `op_id` 和 `message_id`、`event_id`、`thing_id` 三者之一，不含 `channel_id` 或 `accepted` 布尔值。自动化应结合 HTTP 状态与 `success`、`error_code` 或 `problem.code`。

## 受理与发送状态

发送接口的 `success=true` 表示 Gateway 已持久受理提交，不保证 provider 成功、私有通道投递、设备展示或用户可见。

它不保证：

- 每台设备都已经在线。
- APNs 或 FCM 已经展示系统通知。
- Android 私有通道已经实时送达。
- 用户没有被系统通知权限、专注模式或省电影响。

使用返回的 `op_id` 查询 `GET /send_status/{op_id}`。响应包含 `op_id`、`status`、`model`、`entity_id`、`accepted_at`、`updated_at`、`expires_at`。

状态值为 `accepted`、`processing`、`provider_queued`、`sent`、`partially_failed`、`failed`。`provider_queued` 只表示进入 Gateway 的 provider worker 队列，不代表 provider 成功。未知或过期操作返回 `404 send_status_not_found`；这些状态也不是终端展示回执。

| 状态 | 含义 |
| :--- | :--- |
| `accepted` | 提交已被持久受理。 |
| `processing` | 正在处理分发。 |
| `provider_queued` | 已进入 Gateway provider worker 队列；不代表 provider 成功。 |
| `sent` | 分发完成，未记录目标失败。 |
| `partially_failed` | 至少一个分发目标失败。 |
| `failed` | 提交处理失败。 |

## 常见 HTTP 状态

| 状态码 | 含义 | 典型原因 | 处理建议 |
| :--- | :--- | :--- | :--- |
| `200` | 请求已被 Gateway 处理 | `success=true` | 保存返回的 ID 和 `op_id`。 |
| `400` | 请求校验失败 | 必填/格式错误，或已知字段不允许用于当前动作 | 对照 API 字段表检查 JSON。 |
| `401` | 网关级鉴权失败 | 私有 Gateway 开启 `PUSHGO_TOKEN`，Bearer Token 缺失或错误 | 检查 `Authorization: Bearer <token>`。 |
| `404` | 目标不存在 | 频道或发送状态记录不存在 | 检查 `channel_id` 或 `op_id`。 |
| `409` | 幂等冲突 | Message `op_id` 用于不同的归一化内容或作用域 | 使用新 ID，或重发原始内容。 |
| `413` | 请求体过大 | JSON 超过 32 KiB（32,768 字节） | 图片使用 URL；减少 metadata 或 attrs。 |
| `429` | 请求过于频繁 | 超过进程内置的密码请求预算 | 稍后重试并降低突发请求。 |
| `503` | 提交未受理 | Gateway 接入或持久提交失败 | 查看 Gateway 日志、存储健康和容量。 |

## 按场景排障

### 请求返回 400

- JSON 是否合法。
- 是否把 `event_id` 传给了 `/event/create`，或把 `thing_id` 传给了 `/thing/create`。
- Event/Thing 不要传 `op_id`，create 路由不要传 Gateway 生成的实体 ID。
- Message 的未知 `severity` 会归一化为 `normal`。
- 未知扩展字段会被忽略；可选字段未生效时先检查拼写。

### 请求返回 401

- 是否在私有 Gateway 设置了 `PUSHGO_TOKEN`。
- Header 是否是 `Authorization: Bearer <token>`。
- 是否把频道密码误当成 Gateway Token。
- 反向代理是否剥离了 Authorization Header。
- 私有 Gateway 设置 `PUSHGO_TOKEN` 后，`/healthz` 和 `/readyz` 也需要 Bearer Token。

### 请求成功但设备没收到

- 客户端是否已订阅该频道。
- 设备通知权限是否开启。
- Apple 设备是否受 APNs、专注模式或系统通知设置影响。
- Android 是否能获取正确的 `/gateway/profile`。
- 私有通道端口、证书和外部地址是否可达。
- Gateway 日志里是否有 provider 或 private dispatch 错误。

### 私有通道不可用

- `PUSHGO_PRIVATE_TRANSPORTS` 是否启用。
- WSS 是否能通过同一个 HTTPS 域名连接。
- QUIC UDP 端口是否被防火墙或代理阻断。
- Raw TCP 是否正确处理 TLS 或 TLS offload。
- 宣告端口和实际监听端口是否被端口映射搞混。

### MCP 绑定失败

- `PUSHGO_MCP_ENABLED` 是否开启。
- 非 loopback 部署的 `PUSHGO_PUBLIC_BASE_URL` 是否为外部 HTTPS 地址；仅 loopback 本地开发可以省略。
- 反向代理是否转发 `/.well-known/*`、`/oauth/*` 和 `/mcp`。
- DCR 是否与客户端能力匹配。
- 绑定页面会话是否过期。

## 相关文档

- [身份验证](/zh/reference/auth/)
- [消息 API](/zh/reference/api-message/)
- [事件 API](/zh/reference/api-event/)
- [实体 API](/zh/reference/api-thing/)
- [私有部署](/zh/guides/self-hosting/)
