---
title: 限制與錯誤
description: PushGo Gateway 的一般限制、回應 envelope、狀態碼和排障入口。
---
本頁總結跨 API 的通用規則。單一介面的必填欄位、生命週期和欄位語意仍以對應 API 頁面為準。

## 通用限制

| 專案 | 限制 |
| :--- | :--- |
| 請求 body 大小 | 最大 32 KiB（32,768 位元組）。 |
| `channel_id` | 128 位元 Crockford Base32；規範輸出為 26 位大寫字元。輸入不區分大小寫，忽略 ASCII 空白和連字號，並接受 Crockford 別名 `O`→`0`、`I`/`L`→`1`。 |
| Gateway 產生的實體 ID | 32 位小寫十六進位字串；非 create 路由接收的用戶端 Event/Thing ID 也可使用下述通用格式。 |
| Channel 密碼 | 先 trim，再按 8-128 位元組驗證。 |
| `op_id` | 客戶端值為 1-128 字元，只允許字母、數字、`_`、`:`、`-`，且僅 Message 接受。目前產生值由 13 位小寫十六進位時間戳、連字號和 32 位小寫十六進位隨機值組成；呼叫方應將其視為不透明字串。 |
| `thing_id` / `event_id` | 1-64 字元，只允許字母、數字、`_`、`:`、`-`。 |
| `images` | 最多 32 項，每項 URL 最大 2048 位元組。 |
| `tags` | 最多 32 項，每項最大 64 位元組，trim 後去重。 |
| `metadata` | 僅允許標量值；key 最大 64 位元組，非空標量文字最大 512 位元組；不允許巢狀物件、陣列或 null。 |
| `ttl` 與 API 時間戳 | 文件註明的時間欄位接受 Unix 秒或毫秒，並歸一化為毫秒。 |
| 活躍訂閱者 | 每個 Channel 最多 32 個並行訂閱者。 |
| 內建密碼請求預算 | 每個 Gateway 程序：公開/密碼敏感介面以及 MCP/OAuth 密碼入口，每 IP 每分鐘 60 次、全域每分鐘 1,200 次。經共享 Bearer Token 驗證的私人請求不受此 limiter 限制。 |
| 未知欄位 | 原生 Message、Event、Thing 會忽略擴充欄位；動作明確禁止的已知欄位仍傳回 400。 |

Message 的 `tags`、`images`、`severity` 按對應頁面驗證；Event 和 Thing 的 patch 內容不繼承這些限制。

## 回應 envelope

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

失敗：

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
    "locale": "zh-TW",
    "retryable": false,
    "request_id": "request-id"
  }
}
```

無法提供的可選 `problem` 成員會被省略；存在請求作用域 ID 時，回應也會透過 `x-request-id` Header 傳回。

成功 `data` 包含 `op_id` 和 `message_id`、`event_id`、`thing_id` 三者之一，不含 `channel_id` 或 `accepted` 布林值。自動化應結合 HTTP 狀態與 `success`、`error_code` 或 `problem.code`。

## 受理與傳送狀態

傳送介面的 `success=true` 表示 Gateway 已持久受理提交，不保證 provider 成功、私人通道投遞、裝置顯示或使用者可見。

它不保證：

- 每台裝置都已經在線上。
- APNs 或 FCM 已經展示系統通知。
- Android 私人通道已經即時送達。
- 使用者沒有被系統通知許可權、專注模式或省電影響。

使用傳回的 `op_id` 查詢 `GET /send_status/{op_id}`。回應包含 `op_id`、`status`、`model`、`entity_id`、`accepted_at`、`updated_at`、`expires_at`。

狀態值為 `accepted`、`processing`、`provider_queued`、`sent`、`partially_failed`、`failed`。`provider_queued` 只表示進入 Gateway 的 provider worker 佇列，不代表 provider 成功。未知或過期操作傳回 `404 send_status_not_found`；這些狀態也不是終端顯示回執。

| 狀態 | 意義 |
| :--- | :--- |
| `accepted` | 提交已被持久受理。 |
| `processing` | 正在處理分發。 |
| `provider_queued` | 已進入 Gateway provider worker 佇列；不代表 provider 成功。 |
| `sent` | 分發完成，未記錄目標失敗。 |
| `partially_failed` | 至少一個分發目標失敗。 |
| `failed` | 提交處理失敗。 |

## 常見 HTTP 狀態

| 狀態碼 | 意義 | 典型原因 | 處理建議 |
| :--- | :--- | :--- | :--- |
| `200` | 請求已被 Gateway 處理 | `success=true` | 儲存傳回的 ID 和 `op_id`。 |
| `400` | 請求校驗失敗 | 必填/格式錯誤，或已知欄位不允許用於目前動作 | 對照 API 欄位表檢查 JSON。 |
| `401` | Gateway 級驗證失敗 | 私人 Gateway 開啟 `PUSHGO_TOKEN`，Bearer Token 缺失或錯誤 | 檢查 `Authorization: Bearer <token>`。 |
| `404` | 目標不存在 | Channel 或傳送狀態記錄不存在 | 檢查 `channel_id` 或 `op_id`。 |
| `409` | 冪等衝突 | Message `op_id` 用於不同的正規化內容或作用域 | 使用新 ID，或重送原始內容。 |
| `413` | 請求 body 過大 | JSON 超過 32 KiB（32,768 位元組） | 圖片使用 URL；減少 metadata 或 attrs。 |
| `429` | 請求過於頻繁 | 超過程序內建的密碼請求預算 | 稍後重試並降低突發請求。 |
| `503` | 提交未受理 | Gateway 接入或持久提交失敗 | 檢視 Gateway 日誌、儲存健康和容量。 |

## 按場景排障

### 請求回傳 400

- JSON 是否合法。
- 是否把 `event_id` 傳給了 `/event/create`，或把 `thing_id` 傳給了 `/thing/create`。
- Event/Thing 不要傳 `op_id`，create 路由不要傳 Gateway 產生的實體 ID。
- Message 的未知 `severity` 會正規化為 `normal`。
- 未知擴充欄位會被忽略；可選欄位未生效時先檢查拼寫。

### 請求回傳 401

- 是否在私人 Gateway 設定了 `PUSHGO_TOKEN`。
- Header 是否是 `Authorization: Bearer <token>`。
- 是否把 Channel 密碼誤當成 Gateway Token。
- 反向代理是否剝離了 Authorization Header。
- 私人 Gateway 設定 `PUSHGO_TOKEN` 後，`/healthz` 和 `/readyz` 也需要 Bearer Token。

### 請求成功但裝置沒收到

- 用戶端是否已訂閱該 Channel。
- 裝置通知許可權是否開啟。
- Apple 裝置是否受 APNs、專注模式或系統通知設定影響。
- Android 是否能取得正確的 `/gateway/profile`。
- 私人通道連線埠、憑證和外部位址是否可達。
- Gateway 日誌裡是否有 provider 或 private dispatch 錯誤。

### 私人通道不可用

- `PUSHGO_PRIVATE_TRANSPORTS` 是否啟用。
- WSS 是否能透過同一個 HTTPS 網域連線。
- QUIC UDP 連線埠是否被防火牆或代理程式阻斷。
- Raw TCP 是否正確處理 TLS 或 TLS offload。
- 宣告連線埠和實際監聽連線埠是否被連線埠對映搞混。

### MCP 繫結失敗

- `PUSHGO_MCP_ENABLED` 是否開啟。
- 非 loopback 部署的 `PUSHGO_PUBLIC_BASE_URL` 是否為外部 HTTPS 位址；僅 loopback 本機開發可以省略。
- 反向代理是否轉送 `/.well-known/*`、`/oauth/*` 和 `/mcp`。
- DCR 是否與用戶端能力相符。
- 繫結頁面會話是否過期。

## 相關文件

- [驗證](/zh-tw/reference/auth/)
- [訊息 API](/zh-tw/reference/api-message/)
- [事件 API](/zh-tw/reference/api-event/)
- [實體 API](/zh-tw/reference/api-thing/)
- [私人部署](/zh-tw/guides/self-hosting/)
