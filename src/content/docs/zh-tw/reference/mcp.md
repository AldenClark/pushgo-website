---
title: Model Context Protocol (MCP)
description: 透過 MCP 與 OAuth2 將 PushGo 整合到 AI 助理工作流程。
---
PushGo Gateway 可以作為 MCP HTTP Server，讓支援 MCP 的 AI 助理在授權 Channel 範圍內傳送 Message、管理 Event、更新 Thing。建議使用 OAuth2 授權模式，讓使用者在瀏覽器中繫結 Channel，而不是把 Channel 密碼交給模型。

## 適合什麼場景

- 請 AI 助理在任務完成後主動傳送 PushGo 通知。
- 讓 AI 助理把長期任務同步為 Event。
- 請 AI 助理更新某個服務、裝置或任務對應的 Thing。
- 給第三方 MCP 用戶端提供受控的 Channel 存取範圍。

MCP 不應該取代使用者確認。涉及高影響操作時，用戶端或上層工作流程仍應保留確認步驟。

## Endpoint

```text
https://your-gateway-domain/mcp
```

公共 Gateway 如果啟用了 MCP/OAuth，可以直接使用對應區域的 `/mcp` 端點。私人部署必須設定外部可存取的 `PUSHGO_PUBLIC_BASE_URL`。

## 啟用私人 Gateway MCP

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

常用配置：

| 環境變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | 是否允許 Dynamic Client Registration。 |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | 無 | 預置 OAuth 用戶端，格式為 `client_id:client_secret`；多個用戶端用換行或分號分隔。 |

如果用戶端不支援 DCR，請關閉或忽略 DCR，並透過 `PUSHGO_MCP_PREDEFINED_CLIENTS` 設定固定用戶端。

## 授權模式

| 模式 | Channel 密碼 | 適用於 | 風險 |
| :--- | :--- | :--- | :--- |
| OAuth2 授權模式 | 工具呼叫中不傳 `password` | AI 助理、第三方用戶端、生產環境 | 由 scope 和 Channel 授權範圍限制。 |
| Legacy 模式 | 每次工具呼叫傳 `password` | 個人指令碼、受信任環境 | 呼叫方直接持有 Channel 密碼。 |

生產環境優先使用 OAuth2 授權模式。

## 使用者繫結流程

1. MCP 用戶端連線 `/mcp`。
2. 用戶端透過 OAuth2 或 DCR 取得用戶端身分。
3. 助手呼叫 `pushgo.channel.bind.start`。
4. 使用者開啟返回的 `bind_url`。
5. 使用者輸入 Channel ID 和密碼，並確認授權範圍。
6. 助手輪詢 `pushgo.channel.bind.status`。
7. 授權完成後，助手可以在已授權 Channel 範圍內呼叫工具。

綁定工作階段與 token 生命週期由目前 Gateway 執行階段設定檔管理；在 v1.2.9 中它們不是公開 CLI/env 參數。

## 工具能力

### Message

| 工具 | 作用 |
| :--- | :--- |
| `pushgo.message.send` | 傳送一次性 Message。支援 `title`、`body`、`url`、`images`、`severity`、`ttl`、`metadata`、`thing_id` 等欄位。 |

### Event

| 工具 | 作用 |
| :--- | :--- |
| `pushgo.event.create` | 建立生命週期事件，回傳 `event_id`。 |
| `pushgo.event.update` | 更新已有事件。 |
| `pushgo.event.close` | 關閉已有事件。 |

### Thing

| 工具 | 作用 |
| :--- | :--- |
| `pushgo.thing.create` | 建立長期實體，回傳 `thing_id`。 |
| `pushgo.thing.update` | 更新實體屬性。 |
| `pushgo.thing.archive` | 歸檔實體。 |
| `pushgo.thing.delete` | 刪除或退役實體。 |

### Channel

| 工具或資源 | 作用 |
| :--- | :--- |
| `pushgo.channel.bind.start` | 建立繫結或撤銷會話，回傳 `bind_url`。 |
| `pushgo.channel.bind.status` | 查詢繫結會話狀態。 |
| `pushgo.channel.list` | 列出目前授權的 Channel。 |
| `pushgo.channel.unbind` | 撤銷某個 Channel 授權。 |
| `pushgo://channels` | 已授權 Channel 資源清單。 |
| `pushgo://channels/{channel_id}` | 單一 Channel 的基礎資訊。 |

## 用戶端設定要點

- MCP endpoint 使用 `https://your-gateway-domain/mcp`。
- 反向代理必須把 `Host` 和 `X-Forwarded-Proto` 正確傳給 Gateway。
- 私人部署必須設定 `PUSHGO_PUBLIC_BASE_URL`，並確保它是外部可存取的 HTTPS 根位址。
- 如果 OAuth issuer 或繫結連結出現內部網路位址，優先檢查 `PUSHGO_PUBLIC_BASE_URL`。
- 如果用戶端不支援 DCR，使用預置用戶端配置。

## 維運注意事項

- MCP 授權狀態會持久化；不要把資料庫或儲存目錄當臨時快取清空。
- Token 與綁定工作階段生命週期在 v1.2.9 中屬於執行階段設定檔內建設定；請選擇合適的執行階段設定檔，而不是設定 TTL 環境變數。
- 定期輪換預置用戶端 secret。
- 高風險 Channel 可以單獨建立，避免把所有自動化授權到同一 Channel。
- 維運稽核與執行階段問題應結合 Gateway 結構化日誌與統計指標排查。

## 常見問題

| 現象 | 檢查專案 |
| :--- | :--- |
| 用戶端無法發現 OAuth 元資料 | `PUSHGO_PUBLIC_BASE_URL` 是否設定為 HTTPS 外部位址；反向代理是否轉送 well-known 路由。 |
| 綁定連結無法開啟 | 公網 DNS、HTTPS 憑證、反向代理路徑、`PUSHGO_PUBLIC_BASE_URL`，以及綁定工作階段是否已過期。 |
| DCR 失敗 | 用戶端是否支援 DCR；`PUSHGO_MCP_DCR_ENABLED` 是否開啟。 |
| 工具呼叫要求 `password` | 目前可能是 Legacy 模式，或 OAuth 授權未完成。 |
| 已授權但看不到 Channel | 繫結會話是否完成；scope 是否足夠；Channel 是否被撤銷授權。 |