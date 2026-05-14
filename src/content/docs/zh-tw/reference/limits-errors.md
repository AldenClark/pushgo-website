---
title: 限制與錯誤
description: PushGo Gateway 的一般限制、回應 envelope、狀態碼和排障入口。
---
本頁總結跨 API 的通用規則。單一介面的必填欄位、生命週期和欄位語意仍以對應 API 頁面為準。

## 通用限制

| 專案 | 限制 |
| :--- | :--- |
| 請求 body大小 | 最大 32KB。 |
| Gateway 產生 ID | 32 位元小寫十六進位字串。 |
| Channel 密碼 | 通常為 8-128 字元。 |
| `op_id` | 1-128 字元，只允許字母、數字、`_`、`:`、`-`。 |
| `images` | 最多 32 項，每項 URL 最大 2048 字元。 |
| `tags` | 最多 32 項，每項最大 64 字元，trim 後去重。 |
| `metadata` | 只支援標量值；key 最大 64，value 最大 512。 |
| `attrs` | 物件補丁；`null` 表示刪鍵；複雜巢狀應避免。 |
| `ttl` | Unix 毫秒時間戳記；provider 投遞 TTL 會被裁切到最大約 28 天。 |
| 未知欄位 | 原生 Message、Event、Thing 和 MCP 工具引數都採用嚴格解析，未知欄位會傳回 400。 |

## 回應 envelope

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

失敗：

```json
{
  "success": false,
  "data": null,
  "error": "human readable message",
  "error_code": "machine_readable_code"
}
```

自動化指令碼應優先判斷 `success` 和 `error_code`，不要只依賴自然語言錯誤訊息。

## `accepted` 的意思

`success=true` 表示 Gateway 已處理請求。 `accepted=true` 表示 Gateway 已進入分發流程。

它不保證：

- 每台裝置都已經線上上。
- APNs 或 FCM 已經展示系統通知。
- Android 私人通道已經即時送達。
- 使用者沒有被系統通知許可權、專注模式或省電影響。

因此，`accepted` 是 Gateway 受理和分發狀態，不是終端展示回執。

## 常見 HTTP 狀態

| 狀態碼 | 意義 | 典型原因 | 處理建議 |
| :--- | :--- | :--- | :--- |
| `200` | 請求已被 Gateway 處理 | `success=true`，但仍需檢視 `accepted` | 儲存返回的 ID 和 `op_id`。 |
| `400` | 請求校驗失敗 | 缺少必填欄位、未知欄位、欄位格式錯誤 | 對照 API 欄位表，檢查 JSON 和大小寫。 |
| `401` | Gateway 級驗證失敗 | 私人 Gateway 開啟 `PUSHGO_TOKEN`，Bearer Token 缺失或錯誤 | 檢查 `Authorization: Bearer <token>`。 |
| `404` | 目標不存在 | Channel、事件或實體不存在 | 檢查 `channel_id`、`event_id`、`thing_id`。 |
| `413` | 請求 body過大 | JSON 超過 32KB | 圖片使用 URL；減少 metadata 或 attrs。 |
| `503` | 分發未完整成功 | provider、私人通道、佇列或下游暫時無法使用 | 檢視 Gateway 日誌、統計指標和佇列容量。 |

## 按場景排障

### 請求回傳 400

- JSON 是否合法。
- 是否把 `event_id` 傳給了 `/event/create`，或把 `thing_id` 傳給了 `/thing/create`。
- 是否傳承了未宣告欄位。
- `severity` 是否為 `critical`、`high`、`normal`、`low`。
- `attrs` 是否是物件補丁，而不是陣列或複雜巢狀。

### 請求回傳 401

- 是否在私人 Gateway 設定了 `PUSHGO_TOKEN`。
- Header 是否是 `Authorization: Bearer <token>`。
- 是否把 Channel 密碼誤當成 Gateway Token。
- 反向代理是否剝離了 Authorization Header。

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
- `PUSHGO_PUBLIC_BASE_URL` 是否為外部 HTTPS 位址。
- 反向代理是否轉送 `/.well-known/*`、`/oauth/*` 和 `/mcp`。
- DCR 是否與用戶端能力相符。
- 繫結頁面會話是否過期。

## 相關文件

- [驗證](/zh-tw/reference/auth/)
- [訊息 API](/zh-tw/reference/api-message/)
- [事件 API](/zh-tw/reference/api-event/)
- [實體 API](/zh-tw/reference/api-thing/)
- [私人部署](/zh-tw/guides/self-hosting/)