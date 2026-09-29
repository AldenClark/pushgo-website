---
title: 訊息 API (Message)
description: 使用 /message 傳送一次性通知，並理解欄位、回應和投遞語義。
---
Message API 用於傳送頂層瞬時通知。它適合警告、完成提醒、帶圖片的快照、價格提醒等「不需要後續更新或關閉」的場景。

## Endpoint

```http
POST /message
```

請求 body 必須是 JSON。未知擴充欄位會被忽略；動作明確禁止的已知欄位仍會被拒絕。私人 Gateway 如果啟用了 `PUSHGO_TOKEN`，還需要 `Authorization: Bearer <token>`。

## 請求頭

| Header | 必填 | 說明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 請求 body 格式。 |
| `Authorization: Bearer <token>` | 視 Gateway 設定而定 | 僅私人 Gateway 開啟 `PUSHGO_TOKEN` 時必填。 |

## 請求欄位

| 欄位 | 型別 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 是 | 目標 Channel ID。 |
| `password` | `string` | 是 | Channel 密碼；先 trim，再按 8-128 位元組驗證。 |
| `title` | `string` | 是 | 訊息標題，不能為空。 |
| `body` | `string` | 否 | 訊息正文，可包含 Markdown。 |
| `op_id` | `string` | 否 | 冪等鍵，1-128 個字元，只允許字母、數字、`_`、`:`、`-`。 |
| `thing_id` | `string` | 否 | 將訊息歸入某個 Thing ID；1-64 個字元，可用字母、數字、`_`、`:`、`-`。Gateway 只驗證格式，不要求伺服器端已存在 Thing 記錄。 |
| `occurred_at` | `number` 或數字字串 | 否 | 接受 Unix 秒或毫秒並正規化為毫秒；傳入 `thing_id` 時必填。 |
| `severity` | `string` | 否 | `critical`、`high`、`normal`、`low`；未知值依 `normal` 處理。 |
| `ttl` | `number` 或數字字串 | 否 | 接受 Unix 秒或毫秒；provider 投遞 TTL 上限為 30 天。 |
| `url` | `string` | 否 | 點選跳轉 URL。 |
| `images` | `string[]` | 否 | 最多 32 個圖片 URL，每個最長 2048 位元組。 |
| `tags` | `string[]` | 否 | 最多 32 個標籤，每個最長 64 位元組，trim 後去重。 |
| `ciphertext` | `string` | 否 | 可選 E2EE 密文載重。 |
| `metadata` | `object` | 否 | 自訂標量鍵值；key <= 64 位元組，非空標量文字 <= 512 位元組；拒絕巢狀物件、陣列和 null。 |

`message_id` 由 Gateway 產生，客戶端傳入會被拒絕。未知欄位會被忽略且不會生效，因此請注意欄位拼寫。

## 優先權對映

| `severity` | APNs interruption level | FCM priority |
| :--- | :--- | :--- |
| `critical` | `critical` | `HIGH` |
| `high` | `time-sensitive` | `HIGH` |
| `normal` | `active` | `HIGH` |
| `low` | `passive` | `NORMAL` |

## 最小範例

```bash
curl -X POST https://gateway.pushgo.cn/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "備份完成",
    "body": "NAS 每日備份已經完成。",
    "severity": "normal"
  }'
```

## 關聯 Thing

如果這則提醒屬於某個長期實體，可以傳 `thing_id`。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
  "occurred_at": 1713750000000,
  "title": "家庭 NAS 磁碟預警",
  "body": "volume1 使用率已達到 92%。",
  "severity": "high",
  "tags": ["nas", "disk"]
}
```

## 成功回應

相同 `op_id` 搭配相同的正規化請求內容和作用域會傳回最初結果；用於不同內容或作用域會傳回 `409`。省略時由 Gateway 產生。

```json
{
  "success": true,
  "data": {
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
}
```

`success=true` 表示 Gateway 已持久受理請求，不代表推播供應商已成功或裝置已顯示。需要粗粒度分發狀態時，儲存 `op_id` 並查詢 `GET /send_status/{op_id}`。

## 常見錯誤

| 狀態碼 | 典型原因 |
| :--- | :--- |
| `400` | 必填欄位缺失/無效、傳入 `message_id`、`title` 為空白或 metadata 無效。 |
| `401` | 私人 Gateway 要求 Bearer Token，但 Header 缺失或錯誤。 |
| `404` | Channel 不存在，或 Channel 憑證不相符。 |
| `409` | `op_id` 被用於不同的請求內容或作用域。 |
| `413` | 請求 body 超過 32 KiB（32,768 位元組）。 |
| `503` | Gateway 無法受理本次提交。 |

更多限制請見 [限制與錯誤](/zh-tw/reference/limits-errors/)。

## 舊版 GET Query 形式

為相容舊呼叫，Gateway 仍支援 `GET /message`。它以 query 參數接收上述標量欄位；`images` 和 `tags` 使用逗號分隔，`metadata` 是 JSON 編碼字串。新整合應使用 JSON `POST`，因為 URL、存取日誌和瀏覽器歷史可能暴露 Channel 密碼或載荷。

## 相容介面

PushGo 也提供 ntfy、Bark 和 ServerChan 相容入口，方便遷移舊指令碼。相容介面的欄位覆蓋能力有限；需要 `thing_id`、E2EE 或完整模型語意時，請使用原生 `/message`。遷移方式見 [遷移指南](/zh-tw/guides/migration/)。
