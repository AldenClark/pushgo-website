---
title: 私有部署 (Self-Hosting)
description: 从最小可用到生产运维，部署自己的 PushGo Gateway。
---

私有部署适合希望自己控制数据路径、鉴权策略、数据库、私有通道和 MCP/OAuth 的用户。Gateway 是 Rust 服务；HTTP API、WSS、MCP/OAuth 共用同一个 HTTP listener，QUIC 和 Raw TCP 使用独立监听地址。

## 什么时候需要私有部署

- 不希望通知载荷或 Event/Thing patch 经过公共 Gateway。
- 需要自己的数据库、备份、日志、监控和容量策略。
- 需要 Android 私有通道的低延迟同步。
- 希望用自己的域名启用 MCP/OAuth。
- 需要网关级 Bearer Token 限制调用方。

如果你只是想体验 PushGo，先使用公共网关完成 [快速上手](/zh/guides/getting-started/)。

## 部署层级

| 层级 | 适合谁 | 主要配置 |
| :--- | :--- | :--- |
| 最小可用 | 本地测试、单用户脚本 | SQLite + HTTP API |
| 生产基础 | 长期运行、公开域名 | HTTPS 反向代理 + 持久化数据库 + Bearer Token |
| 私有通道 | Android 低延迟同步 | WSS，按需增加 QUIC / Raw TCP / MQTT 5 |
| AI 集成 | MCP 客户端和 AI 助手 | MCP/OAuth + `PUSHGO_PUBLIC_BASE_URL` |

## 最小可用部署

最小部署只需要数据库和 HTTP listener。

```bash
mkdir -p /var/lib/pushgo

docker run -d --name pushgo-gateway \
  -p 6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='sqlite:///var/lib/pushgo/pushgo.db?mode=rwc' \
  -v /var/lib/pushgo:/var/lib/pushgo \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

测试：

```bash
curl -X POST http://127.0.0.1:6666/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "私有网关测试",
    "body": "这条消息来自自己的 Gateway。"
  }'
```

最小部署适合验证链路，不建议直接暴露到公网。

## 生产基础配置

生产环境建议至少做到：

1. Gateway 只监听内网或本机地址。
2. 使用 Nginx、Caddy 或负载均衡器提供 HTTPS。
3. 设置 `PUSHGO_TOKEN` 作为网关级 Bearer Token。
4. 使用持久化数据库并纳入备份。
5. 显式设置 `PUSHGO_PUBLIC_BASE_URL` 和 `PUSHGO_TOKEN_SERVICE_URL`。

```bash
docker run -d --name pushgo-gateway \
  -p 127.0.0.1:6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='postgres://user:pass@db:5432/pushgo' \
  -e PUSHGO_TOKEN='replace-with-gateway-token' \
  -e PUSHGO_PUBLIC_BASE_URL='https://gateway.example.com' \
  -e PUSHGO_TOKEN_SERVICE_URL='https://token.example.com' \
  -e PUSHGO_TOKEN_SERVICE_AUTH_TOKEN='replace-with-a-separate-token-service-token' \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

设置 `PUSHGO_TOKEN` 后，普通 API 以及 `/healthz`、`/readyz` 都需要：

```http
Authorization: Bearer replace-with-gateway-token
```

频道 ID 和频道密码仍然需要放在请求体中。两层鉴权的区别见 [身份验证](/zh/reference/auth/)。

启用 MCP 时，MCP/OAuth discovery 入口是共享 Token 中间件的例外；它们使用自己的 OAuth 授权流程。

## 公共区域端点

公共 Gateway 为 `https://gateway.pushgo.dev/`（全球）和 `https://gateway.pushgo.cn/`（中国大陆）。自托管 Gateway 的 token-service 默认地址是 `http://127.0.0.1:6766`；非同机部署请配置自己的可达服务。任何非 loopback token-service 都必须设置仅支持环境变量的 `PUSHGO_TOKEN_SERVICE_AUTH_TOKEN`，且必须使用独立 Bearer Token，不能复用 `PUSHGO_TOKEN`。

## 反向代理

HTTP API、WSS、MCP/OAuth 共用 HTTP listener。反向代理需要支持普通 HTTP 和 WebSocket upgrade。

```nginx
server {
    listen 443 ssl http2;
    server_name gateway.example.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:6666;
    }
}
```

`PUSHGO_PUBLIC_BASE_URL` 应指向外部可访问的 HTTPS 根地址。启用 MCP 时，除仅绑定 loopback 的本地开发外，该值必填且必须使用 HTTPS；否则无法安全生成 MCP issuer 和绑定链接。

## Android 私有通道

私有通道由 `PUSHGO_PRIVATE_TRANSPORTS` 开启。建议从 `wss` 开始，因为它复用 HTTPS 入口，部署复杂度最低。

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

需要更低延迟或受控网络时，再增加 QUIC / Raw TCP。

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss,mqtt
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_MQTT_BIND=0.0.0.0:1883
PUSHGO_MQTT_PORT=1883
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

| 配置 | 说明 |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`/`off`/`disabled`/`none` 关闭全部；`true`/`on`/`enabled`/`all` 开启 `quic,tcp,wss,mqtt`；也可用逗号、分号、竖线或空白分隔列表。默认 `false`。开启全部也会开启 QUIC，因此必须配置 TLS 证书和私钥。 |
| `PUSHGO_PRIVATE_QUIC_BIND` | Gateway 实际监听的 UDP 地址。 |
| `PUSHGO_PRIVATE_QUIC_PORT` | 对客户端宣告的 QUIC 端口。 |
| `PUSHGO_PRIVATE_TCP_BIND` | Gateway 实际监听的 TCP 地址。 |
| `PUSHGO_PRIVATE_TCP_PORT` | 对客户端宣告的 Raw TCP 端口。 |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | QUIC 必填；Gateway 终止 TCP/MQTT TLS 时也需要。 |
| `PUSHGO_PRIVATE_TCP_TLS_ENABLED` | Gateway 是否终止 Raw TCP TLS；默认 `false`。 |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Raw TCP 入口是否期待 PROXY protocol v1；默认 `false`。 |
| `PUSHGO_MQTT_BIND` / `PUSHGO_MQTT_PORT` | MQTT 监听和广播端口；默认 `127.0.0.1:1883` 与 `1883`。 |
| `PUSHGO_MQTT_TLS_ENABLED` | Gateway 是否终止 MQTT TLS；默认 `false`。 |
| `PUSHGO_MQTT_MAX_PACKET_BYTES` | MQTT 最大报文，默认 `32768`。 |

QUIC 使用自定义 ALPN (`pushgo-quic`)，不能简单地和 HTTP/3 共用同一个 UDP/443 入口。若边缘代理已在 `443/udp` 提供 HTTP/3，请为 PushGo QUIC 使用独立 UDP 端口，或确认代理能够正确分流。

容器部署必须发布所选监听端口：默认示例为 HTTP `6666/tcp`、QUIC `5223/udp`、Raw TCP `5223/tcp`、MQTT `1883/tcp`。MQTT 客户端必须使用 MQTT 5 和 QoS 1。

## MCP / OAuth

启用 MCP 至少需要：

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

非 loopback 部署必须提供 public base URL；它必须是绝对 HTTPS URL，且不能包含凭据、query 或 fragment。只有 HTTP listener 绑定 loopback 的本地开发环境可以省略，此时 Gateway 会派生 loopback HTTP issuer。

常用配置：

| 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | 是否允许 Dynamic Client Registration。 |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | 无 | 预置 OAuth 客户端，格式为 `client_id:client_secret`；多个客户端用换行或分号分隔。 |

更多工具和授权流程见 [MCP 参考](/zh/reference/mcp/)。

## 核心配置速查

| CLI / 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | HTTP API、WSS、MCP/OAuth 的监听地址。 |
| `--db-url` / `PUSHGO_DB_URL` | 无，必填 | 数据库 URL，支持 SQLite、PostgreSQL 和 MySQL。 |
| `--runtime-profile` / `PUSHGO_RUNTIME_PROFILE` | `small` | 运行时容量档位：`small` 用于私有/轻量部署，`public` 用于高负载部署。 |
| `--token` / `PUSHGO_TOKEN` | 无 | 网关级 Bearer Token；为空时不启用网关级 Token 鉴权。 |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `http://127.0.0.1:6766` | token-service 地址；非 loopback 服务还需 `PUSHGO_TOKEN_SERVICE_AUTH_TOKEN`。 |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | 无 | 对外 HTTPS 根地址。 |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | 沙箱模式，包括 APNs sandbox endpoint。 |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | 原生 tracing 日志级别。 |
| `--db-upgrade` / `PUSHGO_DB_UPGRADE` | 无 | 仅执行数据库升级 `plan` 或 `run` 后退出。 |

## 运维建议

- 数据库必须纳入备份；其中包含频道、设备/路由、待投递状态、发送状态、MCP 授权/会话以及 Widget/Live Activity 订阅。Event/Thing 投影和历史由已订阅客户端保存，不是 Gateway 中的规范实体记录。
- SQLite 适合个人或轻量部署；多人或高并发场景优先使用 PostgreSQL。
- 高负载先观察分发队列和 worker，再评估数据库和 provider 限流。
- 排障时临时提高 `PUSHGO_OBSERVABILITY_LOG_LEVEL`，完成后恢复常规级别。
- Android 私有通道问题先检查 `/gateway/profile` 宣告的端口和外部可访问性。

运行时容量：

Gateway v1.3.0 的运行容量由运行时档位管理。私有或轻量部署使用 `PUSHGO_RUNTIME_PROFILE=small`，高负载公网部署使用 `PUSHGO_RUNTIME_PROFILE=public`。底层调优值是档位内置默认值。

## 升级与回滚

升级到 schema v12 前，先运行 `--db-upgrade plan`，创建并验证 v11 快照，再运行 `--db-upgrade run`。v12 Gateway 一旦受理持久任务，就不要让旧二进制直接使用该数据库：保留数据库，并使用完全匹配、支持 v12 的应急构件向前恢复。要退回 v12 之前的版本，必须恢复 v12 写入前的 v11 快照。不要篡改 schema 标记或删除待投递状态。

- 升级前备份数据库和运行配置。
- 保持 Gateway 镜像/二进制、环境变量和反向代理配置可追踪。
- 先在测试频道验证 `/message`、`/event/create` 和 `/thing/create`。
- 如果启用了私有通道，升级后检查 Android 客户端是否能获取新的 `/gateway/profile`。
- 如果启用了 MCP，升级后检查 `/.well-known/*`、`/oauth/*` 和 `/mcp` 是否仍使用外部 HTTPS 地址。
