---
title: 身份验证 (Authentication)
description: 理解频道授权、网关授权、兼容 key 和 MCP OAuth 的区别。
---

PushGo 的鉴权分为四种场景。先判断你调用的是哪类接口，再决定凭据放在哪里。

## 认证模式速查

| 场景 | 需要什么 | 放在哪里 | 适合 |
| :--- | :--- | :--- | :--- |
| 原生 API | `channel_id` + `password` | JSON 请求体 | `/message`、`/event/*`、`/thing/*` |
| 私有 Gateway Token | Bearer Token | `Authorization` Header | 自托管 Gateway 限制调用方 |
| 兼容接口 | `<channel_id>:<password>` | 路径或兼容字段 | ntfy、Bark、ServerChan 迁移 |
| MCP OAuth | OAuth access token | MCP 客户端自动携带 | AI 助手和第三方客户端 |

频道授权和网关授权是两层不同边界。开启私有 Gateway Token 后，请求仍然需要频道 ID 和频道密码。

## 频道授权

原生 Message、Event 和 Thing API 都使用请求体中的频道凭据。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "测试消息"
}
```

| 字段 | 说明 |
| :--- | :--- |
| `channel_id` | 目标频道。 |
| `password` | 频道密码，通常为 8-128 个字符。 |

频道密码决定“谁能向这个频道写入”。它不是 Gateway 管理员密码，也不应该写入公开仓库、日志或前端代码。

## 网关级 Bearer Token

私有部署可以通过 `PUSHGO_TOKEN` 开启网关级鉴权。

```bash
PUSHGO_TOKEN=replace-with-gateway-token
```

开启后，请求必须携带：

```http
Authorization: Bearer replace-with-gateway-token
```

完整请求示例：

```bash
curl -X POST https://gateway.example.com/message \
  -H "Authorization: Bearer replace-with-gateway-token" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "私有网关测试"
  }'
```

约束：

- Header 名称使用标准写法 `Authorization`。
- Token 类型必须是 `Bearer`。
- Token 最大长度为 4096 个字符。
- `PUSHGO_TOKEN` 为空时不启用网关级 Token 鉴权。

## 公共网关

公共网关仍会校验频道 ID 和频道密码。快速上手示例默认只展示频道授权。公共服务的额外访问策略可能随运营配置调整；如果某个公共端点要求 Bearer Token，以该端点当前说明为准。

## 兼容接口鉴权

兼容接口使用 `<channel_id>:<password>` 作为 `compat_key`。

| 来源 | key 放置位置 |
| :--- | :--- |
| ntfy | `/ntfy/{topic}`，其中 `{topic}` 是 `compat_key` |
| ServerChan | `/serverchan/{sendkey}`，其中 `{sendkey}` 是 `compat_key` |
| Bark v1 | `/bark/{device_key}/{body}`，其中 `{device_key}` 是 `compat_key` |
| Bark v2 | JSON 字段 `device_key` |

示例：

```bash
curl -X POST https://gateway.pushgo.cn/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: 备份完成" \
  -d "NAS backup completed"
```

兼容 key 包含频道密码，应按密钥处理。

## MCP OAuth

MCP OAuth 模式下，AI 助手不应该在工具调用里传频道密码。推荐流程是：

1. MCP 客户端连接 `https://gateway.example.com/mcp`。
2. 用户打开绑定链接。
3. 用户输入频道 ID 和密码并确认授权。
4. Gateway 给 MCP 客户端发放受 scope 限制的 OAuth token。
5. 工具调用通过 OAuth 授权访问已绑定频道。

Legacy MCP 模式仍允许每次工具调用传 `password`，但只适合个人或受信任环境。生产集成优先使用 OAuth。

## 安全建议

- 频道密码、兼容 key 和 Gateway Token 都不要写入公开仓库。
- 生产环境必须使用 HTTPS。
- 公共网关示例不要硬编码真实频道密码。
- 自托管 Gateway 建议开启 `PUSHGO_TOKEN`，并把 HTTP listener 放在反向代理之后。
- AI 助手集成优先使用 MCP OAuth，避免让模型直接持有频道密码。
- 定期轮换频道密码和 Gateway Token；两者不要设置成同一个值。
