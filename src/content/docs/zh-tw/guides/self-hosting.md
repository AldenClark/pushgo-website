---
title: 私人部署 (Self-Hosting)
description: 從最小可用到生產運維，部署自己的 PushGo Gateway。
---
私人部署適合希望自行控制資料路徑、驗證策略、資料庫、私人通道和 MCP/OAuth 的使用者。 Gateway 是 Rust 服務；HTTP API、WSS、MCP/OAuth 共用同一個 HTTP listener，QUIC 和 Raw TCP 使用獨立監聽位址。

## 什麼時候需要私人部署

- 不希望通知、事件或實體狀態經過公共 Gateway。
- 需要自己的資料庫、備份、日誌、監控和容量策略。
- 需要 Android 私人通道的低延遲同步。
- 希望用自己的網域啟用 MCP/OAuth。
- 需要 Gateway 級 Bearer Token 限制呼叫方。

如果你只是想體驗 PushGo，先使用公共 Gateway 完成 [快速上手](/zh-tw/guides/getting-started/)。

## 部署層級

| 層級 | 適合誰 | 主要配置 |
| :--- | :--- | :--- |
| 最小可用 | 本機測試、單一使用者指令碼 | SQLite + HTTP API |
| 生產基礎 | 長期運作、公開網域 | HTTPS 反向代理 + 持久化資料庫 + Bearer Token |
| 私人通道 | Android 低延遲同步 | WSS，按需增加 QUIC / Raw TCP |
| AI 整合 | MCP 用戶端與 AI 助理 | MCP/OAuth + `PUSHGO_PUBLIC_BASE_URL` |

## 最小可用部署

最小部署只需要資料庫和 HTTP listener。

```bash
mkdir -p /var/lib/pushgo

docker run -d --name pushgo-gateway \
  -p 6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='sqlite:///var/lib/pushgo/pushgo.db?mode=rwc' \
  -v /var/lib/pushgo:/var/lib/pushgo \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

測試：

```bash
curl -X POST http://127.0.0.1:6666/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "私人 Gateway 測試",
    "body": "這條訊息來自自己的 Gateway。"
  }'
```

最小部署適合驗證鏈路，不建議直接暴露到公網。

## 生產基礎配置

生產環境建議至少做到：

1. Gateway 只監聽內網或本機位址。
2. 使用 Nginx、Caddy 或負載平衡器提供 HTTPS。
3. 設定 `PUSHGO_TOKEN` 作為 Gateway 級 Bearer Token。
4. 使用持久化資料庫並納入備份。
5. 明確設定 `PUSHGO_PUBLIC_BASE_URL` 和 `PUSHGO_TOKEN_SERVICE_URL`。

```bash
docker run -d --name pushgo-gateway \
  -p 127.0.0.1:6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='postgres://user:pass@db:5432/pushgo' \
  -e PUSHGO_TOKEN='replace-with-gateway-token' \
  -e PUSHGO_PUBLIC_BASE_URL='https://gateway.example.com' \
  -e PUSHGO_TOKEN_SERVICE_URL='https://token.pushgo.dev' \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

設定 `PUSHGO_TOKEN` 後，所有 API 請求都需要：

```http
Authorization: Bearer replace-with-gateway-token
```

Channel ID 和 Channel 密碼仍然需要放在請求 body中。兩層驗證的差異請參考 [驗證](/zh-tw/reference/auth/)。

## 公共區域端點

如果 Gateway 需要聯絡 token-service，建議按區域明確設定。

| 區域 | Gateway | token-service |
| :--- | :--- | :--- |
| Global | `https://gateway.pushgo.dev/` | `https://token.pushgo.dev/` |
| 中國大陸 | `https://gateway.pushgo.cn/` | `https://token.pushgo.cn/` |

私人部署可以繼續使用公用 token-service，也可以根據專案後續部署策略切換到自己的服務。

## 反向代理

HTTP API、WSS、MCP/OAuth 共用 HTTP listener。反向代理需要支援普通 HTTP 和 WebSocket upgrade。

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

`PUSHGO_PUBLIC_BASE_URL` 必須是外部可存取的 HTTPS 根位址，否則 MCP issuer、繫結連結和用戶端 profile 可能會產生內部位址。

## Android 私人通道

私人通道由 `PUSHGO_PRIVATE_TRANSPORTS` 開啟。建議從 `wss` 開始，因為它重複使用 HTTPS 入口，部署複雜度最低。

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

需要更低延遲或控制網路時，再增加 QUIC / Raw TCP。

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

| 配置 | 說明 |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`、`true`、`none` 或明確列表，例如 `wss`、`quic,tcp,wss`。 |
| `PUSHGO_PRIVATE_QUIC_BIND` | Gateway 實際監聽的 UDP 位址。 |
| `PUSHGO_PRIVATE_QUIC_PORT` | 對用戶端宣告的 QUIC 連線埠。 |
| `PUSHGO_PRIVATE_TCP_BIND` | Gateway 實際監聽的 TCP 位址。 |
| `PUSHGO_PRIVATE_TCP_PORT` | 對用戶端宣告的 Raw TCP 連線埠。 |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | QUIC 必填；Raw TCP 未做 TLS offload 時也必填。 |
| `PUSHGO_PRIVATE_TCP_TLS_OFFLOAD` | Raw TCP 是否由邊緣代理處理 TLS。 |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Raw TCP 入口是否期待 PROXY protocol v1。 |

QUIC 使用自訂 ALPN (`pushgo-quic`)，不能簡單地和 HTTP/3 共用同一個 UDP/443 入口。若邊緣代理已在 `443/udp` 提供 HTTP/3，請為 PushGo QUIC 使用獨立 UDP 埠，或確認代理能夠正確分流。

## MCP / OAuth

啟用 MCP 至少需要：

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

常用配置：

| 環境變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | 是否允許 Dynamic Client Registration。 |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | 無 | 預置 OAuth 用戶端，格式為 `client_id:client_secret`；多個用戶端用換行或分號分隔。 |

更多工具和授權流程請見 [MCP 參考](/zh-tw/reference/mcp/)。

## 核心配置速查

| CLI / 環境變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | HTTP API、WSS、MCP/OAuth 的監聽位址。 |
| `--db-url` / `PUSHGO_DB_URL` | 無，必填 | 資料庫 URL，支援 SQLite、PostgreSQL 和 MySQL。 |
| `--runtime-profile` / `PUSHGO_RUNTIME_PROFILE` | `small` | 執行階段容量設定檔：`small` 用於私有/輕量部署，`public` 用於高負載部署。 |
| `--token` / `PUSHGO_TOKEN` | 無 | Gateway 級 Bearer Token；為空時不啟用 Gateway 級 Token 驗證。 |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `https://token.pushgo.dev` | token-service 位址，生產環境建議明確設定。 |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | 無 | 對外 HTTPS 根位址。 |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | 沙箱模式，包括 APNs sandbox endpoint。 |
| `--observability-profile` / `PUSHGO_OBSERVABILITY_PROFILE` | `prod_min` | 可觀測性檔位：`prod_min`、`ops`、`incident`、`debug`。 |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | 原生 tracing 日誌等級。 |

## 維運建議

- 資料庫必須納入備份；Channel、裝置、MCP 授權和實體狀態都依賴持久化儲存。
- SQLite 適合個人或輕量部署；多人或高並發場景優先使用 PostgreSQL。
- 高負載先觀察分發佇列和 worker，然後再評估資料庫和 provider 限流。
- 生產排障優先使用 `PUSHGO_OBSERVABILITY_PROFILE=ops`，臨時深查再切到 `incident` 或 `debug`。
- Android 私人通道問題先檢查 `/gateway/profile` 宣告的連線埠和外部可存取性。

執行階段容量：

Gateway v1.2.9 的執行容量由執行階段設定檔管理。私有或輕量部署使用 `PUSHGO_RUNTIME_PROFILE=small`，高負載公開部署使用 `PUSHGO_RUNTIME_PROFILE=public`。佇列、分發、提供者、資料庫連線池和 SQLite 等底層調校值現在是設定檔內建預設值，不再作為公開環境變數配置。

## 升級與回滾

- 升級前備份資料庫和執行配置。
- 保持 Gateway 映象/二進位、環境變數和反向代理配置可追蹤。
- 先在測試 Channel 驗證 `/message`、`/event/create` 和 `/thing/create`。
- 如果啟用了私人通道，升級後檢查 Android 用戶端是否能取得新的 `/gateway/profile`。
- 如果啟用了 MCP，升級後檢查 `/.well-known/*`、`/oauth/*` 和 `/mcp` 是否仍使用外部 HTTPS 位址。