---
title: 私人部署 (Self-Hosting)
description: 從最小可用到生產運維，部署自己的 PushGo Gateway。
---
私人部署適合希望自行控制資料路徑、驗證策略、資料庫、私人通道和 MCP/OAuth 的使用者。 Gateway 是 Rust 服務；HTTP API、WSS、MCP/OAuth 共用同一個 HTTP listener，QUIC 和 Raw TCP 使用獨立監聽位址。

## 什麼時候需要私人部署

- 不希望通知載荷或 Event/Thing patch 經過公共 Gateway。
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
| 私人通道 | Android 低延遲同步 | WSS，按需增加 QUIC / Raw TCP / MQTT 5 |
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
  -e PUSHGO_TOKEN_SERVICE_URL='https://token.example.com' \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

設定 `PUSHGO_TOKEN` 後，一般 API 以及 `/healthz`、`/readyz` 都需要：

```http
Authorization: Bearer replace-with-gateway-token
```

Channel ID 和 Channel 密碼仍然需要放在請求 body 中。兩層驗證的差異請參考 [驗證](/zh-tw/reference/auth/)。

啟用 MCP 時，MCP/OAuth discovery 入口是共享 Token middleware 的例外；它們使用自己的 OAuth 授權流程。

## 公共區域端點

公共 Gateway 為 `https://gateway.pushgo.dev/`（全球）和 `https://gateway.pushgo.cn/`（中國大陸）。Gateway 的 token-service 預設位址是 `https://token.pushgo.cn/`。使用自架 token-service 或全球端點（`https://token.pushgo.dev/`）時，請明確設定 `PUSHGO_TOKEN_SERVICE_URL`。Gateway 向 token-service 發出請求時不使用 Bearer 驗證。自架 token-service 應只監聽本機或私人網路，或設於限制存取的 HTTPS 反向代理後方。`PUSHGO_TOKEN` 僅用於 Gateway API。

### Token Service 重新整理請求

對 `/provider/token?provider=fcm`（或 `provider=wns`）的 `GET`/`POST` 請求預設回傳快取的 token。FCM 或 WNS 拒絕 token 後，Gateway 可附加 `force_refresh=true` 要求 OAuth 重新整理。更新後的 Token Service 會合併並行重新整理；強制重新整理成功後有 60 秒冷卻期，期間請求回傳目前仍有效的 token。強制重新整理失敗或處於共用退避期時會回傳錯誤，不會退回先前被拒絕的快取 token。APNs 不使用此參數。

自架部署需要更新 Token Service 才能取得這項恢復能力。舊版會忽略可選參數，請求仍相容，但可能繼續回傳被拒絕的快取 token。OAuth 成功回應也不保證 provider 一定接受該 token。

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

`PUSHGO_PUBLIC_BASE_URL` 應指向外部可存取的 HTTPS 根位址。啟用 MCP 時，除僅綁定 loopback 的本機開發外，該值必填且必須使用 HTTPS；否則無法安全產生 MCP issuer 和綁定連結。

## Android 私人通道

私人通道由 `PUSHGO_PRIVATE_TRANSPORTS` 開啟。建議從 `wss` 開始，因為它重複使用 HTTPS 入口，部署複雜度最低。

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

需要時再增加 QUIC、Raw TCP 或 MQTT 5。

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

| 配置 | 說明 |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`/`off`/`disabled`/`none` 關閉全部；`true`/`on`/`enabled`/`all` 開啟 `quic,tcp,wss,mqtt`；也可用逗號、分號、豎線或空白分隔列表。預設 `false`。開啟全部也會開啟 QUIC，因此必須設定 TLS 憑證和私鑰。 |
| `PUSHGO_PRIVATE_QUIC_BIND` | Gateway 實際監聽的 UDP 位址。 |
| `PUSHGO_PRIVATE_QUIC_PORT` | 對用戶端宣告的 QUIC 連線埠。 |
| `PUSHGO_PRIVATE_TCP_BIND` | Gateway 實際監聽的 TCP 位址。 |
| `PUSHGO_PRIVATE_TCP_PORT` | 對用戶端宣告的 Raw TCP 連線埠。 |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | QUIC 必填；Gateway 終止 TCP/MQTT TLS 時也需要。 |
| `PUSHGO_PRIVATE_TCP_TLS_ENABLED` | Gateway 是否終止 Raw TCP TLS；預設 `false`。 |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Raw TCP 入口是否期待 PROXY protocol v1；預設 `false`。 |
| `PUSHGO_MQTT_BIND` / `PUSHGO_MQTT_PORT` | MQTT 監聽和廣播連線埠；預設 `127.0.0.1:1883` 與 `1883`。 |
| `PUSHGO_MQTT_TLS_ENABLED` | Gateway 是否終止 MQTT TLS；預設 `false`。 |
| `PUSHGO_MQTT_MAX_PACKET_BYTES` | MQTT 最大封包，預設 `32768`。 |

QUIC 使用自訂 ALPN (`pushgo-quic`)，不能簡單地和 HTTP/3 共用同一個 UDP/443 入口。若邊緣代理已在 `443/udp` 提供 HTTP/3，請為 PushGo QUIC 使用獨立 UDP 埠，或確認代理能夠正確分流。

容器部署必須發布所選監聽連線埠：預設範例為 HTTP `6666/tcp`、QUIC `5223/udp`、Raw TCP `5223/tcp`、MQTT `1883/tcp`。MQTT 用戶端必須使用 MQTT 5 和 QoS 1。

## MCP / OAuth

啟用 MCP 至少需要：

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

非 loopback 部署必須提供 public base URL；它必須是絕對 HTTPS URL，且不能包含憑據、query 或 fragment。只有 HTTP listener 綁定 loopback 的本機開發環境可以省略，此時 Gateway 會派生 loopback HTTP issuer。

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
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `https://token.pushgo.cn/` | token-service 位址；自架或使用其他區域時需明確設定。 |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | 無 | 對外 HTTPS 根位址。 |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | 沙箱模式，包括 APNs sandbox endpoint。 |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | 原生 tracing 日誌等級。 |
| `--db-upgrade` / `PUSHGO_DB_UPGRADE` | 無 | 僅執行資料庫升級 `plan` 或 `run` 後退出。 |

## 維運建議

- 資料庫必須納入備份；其中包含 Channel、裝置/路由、待投遞狀態、傳送狀態、MCP 授權/工作階段以及 Widget/Live Activity 訂閱。Event/Thing 投影和歷史由已訂閱用戶端儲存，不是 Gateway 中的規範實體記錄。
- SQLite 適合個人或輕量部署；多人或高並發場景優先使用 PostgreSQL。
- 高負載先觀察分發佇列和 worker，然後再評估資料庫和 provider 限流。
- 排障時暫時提高 `PUSHGO_OBSERVABILITY_LOG_LEVEL`，完成後恢復一般等級。
- Android 私人通道問題先檢查 `/gateway/profile` 宣告的連線埠和外部可存取性。

執行階段容量：

Gateway v1.3.0 的執行容量由執行階段設定檔管理。私有或輕量部署使用 `PUSHGO_RUNTIME_PROFILE=small`，高負載公開部署使用 `PUSHGO_RUNTIME_PROFILE=public`。底層調校值是設定檔內建預設值。

## 升級與回滾

升級到 schema v12 前，先執行 `--db-upgrade plan`，建立並驗證 v11 快照，再執行 `--db-upgrade run`。v12 Gateway 一旦受理持久工作，就不要讓舊二進位檔直接使用該資料庫：保留資料庫，並使用完全匹配、支援 v12 的緊急構件向前恢復。要退回 v12 之前的版本，必須還原 v12 寫入前的 v11 快照。不要竄改 schema 標記或刪除待投遞狀態。

- 升級前備份資料庫和執行配置。
- 保持 Gateway 映像檔/二進位、環境變數和反向代理設定可追蹤。
- 先在測試 Channel 驗證 `/message`、`/event/create` 和 `/thing/create`。
- 如果啟用了私人通道，升級後檢查 Android 用戶端是否能取得新的 `/gateway/profile`。
- 如果啟用了 MCP，升級後檢查 `/.well-known/*`、`/oauth/*` 和 `/mcp` 是否仍使用外部 HTTPS 位址。
