---
title: Model Context Protocol (MCP)
description: 通过 MCP 与 OAuth2 将 PushGo 集成到 AI 助手工作流。
---

PushGo Gateway 可以作为 MCP HTTP Server，让支持 MCP 的 AI 助手在授权频道范围内发送 Message、管理 Event、更新 Thing。推荐使用 OAuth2 授权模式，让用户在浏览器中绑定频道，而不是把频道密码交给模型。

## 适合什么场景

- 让 AI 助手在任务完成后主动发送 PushGo 通知。
- 让 AI 助手把长期任务同步为 Event。
- 让 AI 助手更新某个服务、设备或任务对应的 Thing。
- 给第三方 MCP 客户端提供受控的频道访问范围。

MCP 不应该替代用户确认。涉及高影响操作时，客户端或上层工作流仍应保留确认步骤。

## Endpoint

```text
https://你的网关域名/mcp
```

公共网关如果启用了 MCP/OAuth，可以直接使用对应区域的 `/mcp` 端点。非 loopback 私有部署必须设置外部可访问的 HTTPS `PUSHGO_PUBLIC_BASE_URL`；只有 HTTP listener 绑定 loopback 的本地开发环境可以省略。

## 启用私有 Gateway MCP

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

常用配置：

| 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | 是否允许 Dynamic Client Registration。 |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | 无 | 预置 OAuth 客户端，格式为 `client_id:client_secret`；多个客户端用换行或分号分隔。 |

如果客户端不支持 DCR，请关闭或忽略 DCR，并通过 `PUSHGO_MCP_PREDEFINED_CLIENTS` 配置固定客户端。

## 授权模式

| 模式 | 频道密码 | 适合 | 风险 |
| :--- | :--- | :--- | :--- |
| OAuth2 授权模式 | 工具调用中不传 `password` | AI 助手、第三方客户端、生产环境 | 由 scope 和频道授权限制权限。 |
| Legacy 模式 | 每次工具调用传 `password` | 个人脚本、受信任环境 | 调用方直接持有频道密码。 |

生产环境优先使用 OAuth2 授权模式。

## 用户绑定流程

1. MCP 客户端连接 `/mcp`。
2. 客户端通过 OAuth2 或 DCR 获取客户端身份。
3. 助手调用 `pushgo.channel.bind.start`。
4. 用户打开返回的 `bind_url`。
5. 用户输入频道 ID 和密码，并确认授权范围。
6. 助手轮询 `pushgo.channel.bind.status`。
7. 授权完成后，助手可以在已授权频道范围内调用工具。

绑定会话和 token 生命周期由当前 Gateway 运行时档位管理；在 v1.3.0 中它们不是公开 CLI/env 参数。

## 工具能力

### Message

| 工具 | 作用 |
| :--- | :--- |
| `pushgo.message.send` | 发送一次性 Message。支持 `title`、`body`、`url`、`images`、`severity`、`ttl`、`metadata`、`thing_id` 等字段。 |

### Event

| 工具 | 作用 |
| :--- | :--- |
| `pushgo.event.create` | 创建生命周期事件，返回 `event_id`。 |
| `pushgo.event.update` | 为指定 `event_id` 发送更新 patch。 |
| `pushgo.event.close` | 为指定 `event_id` 发送关闭 patch。 |

### Thing

| 工具 | 作用 |
| :--- | :--- |
| `pushgo.thing.create` | 创建长期实体，返回 `thing_id`。 |
| `pushgo.thing.update` | 为指定 `thing_id` 发送属性 patch。 |
| `pushgo.thing.archive` | 为指定 `thing_id` 发送归档 patch。 |
| `pushgo.thing.delete` | 为指定 `thing_id` 发送删除/退役 patch。 |

### Channel

| 工具或资源 | 作用 |
| :--- | :--- |
| `pushgo.channel.bind.start` | 创建绑定或撤销会话，返回 `bind_url`。 |
| `pushgo.channel.bind.status` | 查询绑定会话状态。 |
| `pushgo.channel.list` | 列出当前授权的频道。 |
| `pushgo.channel.unbind` | 撤销某个频道授权。 |
| `pushgo://channels` | 已授权频道资源列表。 |
| `pushgo://channels/{channel_id}` | 单个频道的基础信息。 |

## 动作级输入

| 工具类别 | 必填业务输入 | 重要排除项 |
| :--- | :--- | :--- |
| Message | `channel_id`、`title`；使用 `thing_id` 时还需 `occurred_at` | 已发布 MCP schema 将 `op_id` 标记为 Gateway 生成，因此为保持契约兼容应省略。原生 HTTP Message 明确支持客户端提供 `op_id`。 |
| Event | `channel_id`、`event_time`；update/close 还需 `event_id` | 省略 `op_id`；`ended_at` 仅用于 close，`started_at` 仅用于 create。 |
| Thing | `channel_id`、`observed_at`；update/archive/delete 还需 `thing_id` | 省略 `op_id` 和 `state`；`deleted_at` 仅用于 delete。 |

OAuth 模式禁止 `password`，并要求已绑定频道；Legacy 模式要求 `password`。发送工具需要 `mcp:tools` scope；频道管理工具和资源需要 `mcp:channels:manage`。

## 客户端配置要点

- MCP endpoint 使用 `https://你的网关域名/mcp`。
- 反向代理必须把 `Host` 和 `X-Forwarded-Proto` 正确传给 Gateway。
- 非 loopback 私有部署必须设置 `PUSHGO_PUBLIC_BASE_URL`，并确保它是外部可访问的 HTTPS 根地址；只有 loopback 本地开发可以省略。
- 如果 OAuth issuer 或绑定链接出现内网地址，优先检查 `PUSHGO_PUBLIC_BASE_URL`。
- 如果客户端不支持 DCR，使用预置客户端配置。

## 运维注意事项

- MCP 授权状态会持久化；不要把数据库或存储目录当临时缓存清空。
- Token 与绑定会话生命周期在 v1.3.0 中属于运行时档位内置设置；请选择合适的运行时档位，而不是设置 TTL 环境变量。
- 定期轮换预置客户端 secret。
- 高风险频道可以单独创建，避免把所有自动化都授权到同一频道。
- 运维审计和运行时问题应结合 Gateway 结构化日志与统计指标排查。

## 常见问题

| 现象 | 检查项 |
| :--- | :--- |
| 客户端无法发现 OAuth 元数据 | 非 loopback 部署的 `PUSHGO_PUBLIC_BASE_URL` 是否为 HTTPS 外部地址；反向代理是否转发 well-known 路由。 |
| 绑定链接无法打开 | 公网 DNS、HTTPS 证书、反向代理路径、`PUSHGO_PUBLIC_BASE_URL`，以及绑定会话是否已过期。 |
| DCR 失败 | 客户端是否支持 DCR；`PUSHGO_MCP_DCR_ENABLED` 是否开启。 |
| 工具调用要求 `password` | 当前可能是 Legacy 模式，或 OAuth 授权未完成。 |
| 已授权但看不到频道 | 绑定会话是否完成；scope 是否足够；频道是否被撤销授权。 |
