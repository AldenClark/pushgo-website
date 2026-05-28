---
title: 訊息 API (Message)
description: 使用 /message 傳送一次性通知，並理解欄位、回應和投遞語義。
---
Message API 用於傳送頂層瞬時通知。它適合警告、完成提醒、帶圖片的快照、價格提醒等「不需要後續更新或關閉」的場景。

## Endpoint

```http
POST /message
```

請求 body必須是 JSON，未宣告欄位會被嚴格拒絕。私人 Gateway 如果啟用了 `PUSHGO_TOKEN`，還需要 `Authorization: Bearer <token>`。

## 請求頭

| Header | 必填 | 說明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 請求 body格式。 |
| `Authorization: Bearer <token>` | 視 Gateway 設定而定 | 僅私人 Gateway 開啟 `PUSHGO_TOKEN` 時必填。 |

## 請求欄位

| 欄位 | 型別 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 是 | 目標 Channel ID。 |
| `password` | `string` | 是 | Channel 密碼，通常 8-128 個字元。 |
| `title` | `string` | 是 | 訊息標題，不能為空。 |
| `body` | `string` | 否 | 訊息正文，可包含 Markdown。 |
| `op_id` | `string` | 否 | 冪等鍵，1-128 個字元，只允許字母、數字、`_`、`:`、`-`。 |
| `thing_id` | `string` | 否 | 關聯到已有 Thing；1-64 個字元，可用字母、數字、`_`、`:`、`-`。 |
| `occurred_at` | `number` | 否 | 訊息發生時間；接受 Unix 秒或毫秒。傳入 `thing_id` 時必填。 |
| `severity` | `string` | 否 | `critical`、`high`、`normal`、`low`；未知值依 `normal` 處理。 |
| `ttl` | `number` | 否 | Unix 毫秒過期時間；provider 投遞 TTL 最約 28 天。 |
| `url` | `string` | 否 | 點選跳轉 URL。 |
| `images` | `string[]` | 否 | 最多 32 個圖片 URL，每個最長 2048 字元。 |
| `tags` | `string[]` | 否 | 最多 32 個標籤，每個最長 64 字元，trim 後去重。 |
| `ciphertext` | `string` | 否 | 可選 E2EE 密文載重。 |
| `metadata` | `object` | 否 | 自訂標量鍵值；key <= 64，非空標量 value <= 512；拒絕巢狀物件和陣列。 |

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
  "title": "家庭 NAS 磁碟預警",
  "body": "volume1 使用率已達到 92%。",
  "severity": "high",
  "tags": ["nas", "disk"]
}
```

## 成功回應

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` 表示請求透過校驗並被 Gateway 處理。 `accepted=true` 表示 Gateway 已進入分發流程；最終裝置展示仍取決於系統推播服務、裝置線上狀態和私人通道狀態。

## 常見錯誤

| 狀態碼 | 典型原因 |
| :--- | :--- |
| `400` | 缺少必填欄位、欄位名稱未知、`title` 為空白、`op_id` 格式錯誤。 |
| `401` | 私人 Gateway 要求 Bearer Token，但 Header 缺失或錯誤。 |
| `404` | Channel 不存在，或 Channel 憑證不相符。 |
| `413` | 請求 body超過 32KB。 |
| `503` | Gateway 未能完整進入分送流程，回應中可能出現 `accepted=false`。 |

更多限制請見 [限制與錯誤](/zh-tw/reference/limits-errors/)。

## 相容介面

PushGo 也提供 ntfy、Bark 和 ServerChan 相容入口，方便遷移舊指令碼。相容介面的欄位覆蓋能力有限；需要 `thing_id`、E2EE 或完整模型語意時，請使用原生 `/message`。遷移方式見 [遷移指南](/zh-tw/guides/migration/)。