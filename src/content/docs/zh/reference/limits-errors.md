---
title: 限制与错误
description: PushGo Gateway 的通用限制、响应 envelope、状态码和排障入口。
---

本页汇总跨 API 的通用规则。单个接口的必填字段、生命周期和字段语义仍以对应 API 页面为准。

## 通用限制

| 项目 | 限制 |
| :--- | :--- |
| 请求体大小 | 最大 32KB。 |
| Gateway 生成 ID | 32 位小写十六进制字符串。 |
| 频道密码 | 通常为 8-128 字符。 |
| `op_id` | 1-128 字符，只允许字母、数字、`_`、`:`、`-`。 |
| `thing_id` / `event_id` | 1-64 字符，只允许字母、数字、`_`、`:`、`-`。 |
| `images` | 最多 32 项，每项 URL 最大 2048 字符。 |
| `tags` | 最多 32 项，每项最大 64 字符，trim 后去重。 |
| `metadata` | 仅允许标量值；key 最大 64，非空标量 value 最大 512；不允许嵌套对象或数组。 |
| `attrs` | 对象 patch；`null` 删除 key；数组和深层嵌套会被拒绝。 |
| `ttl` 与 API 时间戳 | 文档注明的时间字段接受 Unix 秒或毫秒，并归一化为毫秒。 |
| 未知字段 | 原生 Message、Event、Thing 和 MCP 工具参数都采用严格解析，未知字段会返回 400。 |

## 响应 envelope

成功：

```json
{
  "success": true,
  "data": {
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

失败：

```json
{
  "success": false,
  "data": null,
  "error": "human readable message",
  "error_code": "machine_readable_code"
}
```

自动化脚本应优先判断 `success` 和 `error_code`，不要只依赖自然语言错误信息。

## `accepted` 的含义

`success=true` 表示 Gateway 已处理请求。`accepted=true` 表示 Gateway 已进入分发流程。

它不保证：

- 每台设备都已经在线。
- APNs 或 FCM 已经展示系统通知。
- Android 私有通道已经实时送达。
- 用户没有被系统通知权限、专注模式或省电影响。

因此，`accepted` 是网关受理和分发状态，不是终端展示回执。

## 常见 HTTP 状态

| 状态码 | 含义 | 典型原因 | 处理建议 |
| :--- | :--- | :--- | :--- |
| `200` | 请求已被 Gateway 处理 | `success=true`，但仍需查看 `accepted` | 保存返回的 ID 和 `op_id`。 |
| `400` | 请求校验失败 | 缺少必填字段、未知字段、字段格式错误 | 对照 API 字段表，检查 JSON 和大小写。 |
| `401` | 网关级鉴权失败 | 私有 Gateway 开启 `PUSHGO_TOKEN`，Bearer Token 缺失或错误 | 检查 `Authorization: Bearer <token>`。 |
| `404` | 目标不存在 | 频道、事件或实体不存在 | 检查 `channel_id`、`event_id`、`thing_id`。 |
| `413` | 请求体过大 | JSON 超过 32KB | 图片使用 URL；减少 metadata 或 attrs。 |
| `503` | 分发未完整成功 | provider、私有通道、队列或下游暂时不可用 | 查看 Gateway 日志、统计指标和队列容量。 |

## 按场景排障

### 请求返回 400

- JSON 是否合法。
- 是否把 `event_id` 传给了 `/event/create`，或把 `thing_id` 传给了 `/thing/create`。
- 是否传了未声明字段。
- `severity` 是否是 `critical`、`high`、`normal`、`low`。
- `attrs` 是否是对象补丁，而不是数组或复杂嵌套。

### 请求返回 401

- 是否在私有 Gateway 设置了 `PUSHGO_TOKEN`。
- Header 是否是 `Authorization: Bearer <token>`。
- 是否把频道密码误当成 Gateway Token。
- 反向代理是否剥离了 Authorization Header。

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
- `PUSHGO_PUBLIC_BASE_URL` 是否是外部 HTTPS 地址。
- 反向代理是否转发 `/.well-known/*`、`/oauth/*` 和 `/mcp`。
- DCR 是否与客户端能力匹配。
- 绑定页面会话是否过期。

## 相关文档

- [身份验证](/zh/reference/auth/)
- [消息 API](/zh/reference/api-message/)
- [事件 API](/zh/reference/api-event/)
- [实体 API](/zh/reference/api-thing/)
- [私有部署](/zh/guides/self-hosting/)
