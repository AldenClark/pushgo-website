---
title: 事件 API (Event)
description: 使用 /event/create、/event/update 和 /event/close 表達可更新的生命週期。
---
Event API 用於表達一個會持續變化並最終結束的過程。建立事件後，Gateway 傳回 `event_id`；後續更新和關閉都透過這個 ID 關聯到同一生命週期。

## Endpoints

```http
POST /event/create
POST /event/update
POST /event/close
```

也支援 Thing 作用域別名：

```http
POST /thing/{thing_id}/event/create
POST /thing/{thing_id}/event/update
POST /thing/{thing_id}/event/close
```

路徑參數會提供 `thing_id`；如果請求 body 也包含 `thing_id`，兩者必須一致。

請求 body 必須是 JSON。未知擴充欄位會被忽略；動作明確禁止的已知欄位仍會被拒絕。私人 Gateway 如果啟用了 `PUSHGO_TOKEN`，還需要 `Authorization: Bearer <token>`。

## 請求頭

| Header | 必填 | 說明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 請求 body 格式。 |
| `Authorization: Bearer <token>` | 視 Gateway 設定而定 | 僅私人 Gateway 開啟 `PUSHGO_TOKEN` 時必填。 |

## 生命週期

```text
/event/create -> event_id
      |
      +-> /event/update  可呼叫多次
      |
      +-> /event/close   標記結束
```

## 通用欄位

| 欄位 | 型別 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 是 | 目標 Channel ID。 |
| `password` | `string` | 是 | Channel 密碼；先 trim，再按 8-128 位元組驗證。 |
| `op_id` | `string` | 必須省略 | 由 Gateway 產生並傳回；客戶端傳入會傳回 `400 op_id_not_allowed`。 |
| `thing_id` | `string` | 否 | 將事件歸入某個 Thing ID。Gateway 只驗證格式，不要求伺服器端已存在 Thing 記錄。 |
| `ciphertext` | `string` | 否 | 可選 E2EE 密文載重。 |

## 路由級必填欄位

| 路由 | 必填業務欄位 |
| :--- | :--- |
| `/event/create` | `event_time` |
| `/event/update` | `event_id`、`event_time` |
| `/event/close` | `event_id`、`event_time` |

## 欄位規則

| 欄位 | 型別 | 規則 |
| :--- | :--- | :--- |
| `event_id` | `string` | update/close 必填；create 時不得傳入；1-64 個字元，可用字母、數字、`_`、`:`、`-`。 |
| `title`、`description`、`status`、`message`、`severity` | `string` | 可選 patch 內容；1.3.0 不對 Event 套用 Message 的 severity 列舉限制。 |
| `event_time` | `number` 或數字字串 | 必填；接受 Unix 秒或毫秒並正規化為毫秒。 |
| `started_at` | `number` 或數字字串 | 可選且僅用於 create；未傳入時不寫入，也不會從 `event_time` 回填。 |
| `ended_at` | `number` 或數字字串 | 可選且僅用於 close；未傳入時不寫入，也不會從 `event_time` 回填；create/update 會拒絕。 |
| `tags`、`images` | `string[]` | 可選 patch 內容；不繼承 Message 的數量和長度限制。 |
| `attrs` | `object` | 可選 patch 內容。 |
| `metadata` | `object` | 自訂標量鍵值；key <= 64 位元組，非空標量文字 <= 512 位元組；拒絕巢狀物件、陣列和 null。 |

create 禁止 `event_id`，所有 Event 動作均禁止客戶端傳入 `op_id`。未知欄位會被忽略且不會生效。

## 建立事件

```bash
curl -X POST https://gateway.pushgo.cn/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "生產環境部署",
    "status": "running",
    "message": "部署任務已開始",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000,
    "attrs": {
      "service": "api",
      "revision": "8f3c2a1"
    }
  }'
```

響應：

```json
{
  "success": true,
  "data": {
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
}
```

儲存返回的 `event_id`，後續更新和關閉都需要它。

## 更新事件

```bash
curl -X POST https://gateway.pushgo.cn/event/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "publishing",
    "message": "映像已推送，正在釋出",
    "severity": "normal",
    "event_time": 1713750300000,
    "attrs": {
      "progress": 0.75
    }
  }'
```

`/event/update` 可以呼叫多次。每次更新都應該描述本次變化，而不是重複整段歷史。

## 關閉事件

```bash
curl -X POST https://gateway.pushgo.cn/event/close \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "success",
    "message": "生產環境部署完成",
    "severity": "normal",
    "event_time": 1713750600000,
    "ended_at": 1713750600000,
    "attrs": {
      "progress": 1
    }
  }'
```

失敗事件可以使用 `status=failed` 並提高 `severity`。

## 關聯 Thing

如果事件發生在某個長期實體上，傳入 `thing_id`。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
  "title": "資料庫延遲",
  "status": "open",
  "message": "從庫延遲超過 30 秒",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000
}
```

Thing 表示「哪個物件」，Event 表示「這個物件正在經歷什麼過程」。

## 回應語義

統一成功 envelope 表示 Gateway 已持久受理，不代表供應商投遞或裝置顯示成功。可用傳回的 `op_id` 查詢 `GET /send_status/{op_id}`。

## 常見錯誤

| 狀態碼 | 典型原因 |
| :--- | :--- |
| `400` | 路由級必填欄位缺失、ID/時間/metadata 無效、傳入 `op_id` 或動作禁止欄位。 |
| `401` | 私人 Gateway Bearer Token 缺失或錯誤。 |
| `404` | Channel 不存在或憑證不相符。 |
| `413` | 請求 body 超過 32 KiB（32,768 位元組）。 |
| `503` | Gateway 無法受理本次提交。 |
