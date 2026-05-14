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

請求 body必須是 JSON，未宣告欄位會被嚴格拒絕。私人 Gateway 如果啟用了 `PUSHGO_TOKEN`，還需要 `Authorization: Bearer <token>`。

## 請求頭

| Header | 必填 | 說明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 請求 body格式。 |
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
| `password` | `string` | 是 | Channel 密碼，通常 8-128 個字元。 |
| `op_id` | `string` | 否 | 冪等鍵；不傳則 Gateway 會自動產生並在回應中傳回。 |
| `thing_id` | `string` | 否 | 關聯到已有 Thing，僅作用於本次事件分發和上下文。 |
| `ciphertext` | `string` | 否 | 可選 E2EE 密文載重。 |

## 路由級必填欄位

| 路由 | 必填業務欄位 |
| :--- | :--- |
| `/event/create` | `title`、`status`、`message`、`severity`、`event_time` |
| `/event/update` | `event_id`、`status`、`message`、`severity`、`event_time` |
| `/event/close` | `event_id`、`status`、`message`、`severity`、`event_time` |

## 欄位規則

| 欄位 | 型別 | 規則 |
| :--- | :--- | :--- |
| `event_id` | `string` | 更新與關閉必填；建立時不能傳，由 Gateway 產生。 |
| `title` | `string` | 建立必填；更新和關閉可選。 |
| `description` | `string` | 可選；空字串依預設處理。 |
| `status` | `string` | 必填；非空，最大 24 字元。 |
| `message` | `string` | 必填；非空，最大 512 字元。 |
| `severity` | `string` | 必填；僅允許 `critical`、`high`、`normal`、`low`。 |
| `event_time` | `number` | 必填；本次變更發生時間，Unix 毫秒時間戳記。 |
| `started_at` | `number` | 僅 create 允許；整個事件開始時間。 |
| `ended_at` | `number` | 僅 close 允許；整個事件結束時間。 |
| `tags` | `string[]` | 最多 32 項，每項最多 64 字元，trim 後去重。 |
| `images` | `string[]` | 最多 32 項，每項最多 2048 字元，trim 後去重。 |
| `attrs` | `object` | 物件補丁；value 為 `null` 表示刪鍵；不允許陣列。 |
| `metadata` | `object` | 僅支援標量值；key <= 64，value <= 512。 |

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
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
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

Thing 表示“哪個物件”，Event 表示“這個物件正在經歷什麼過程”。

## 回應語義

Event API 回應同樣使用統一 envelope。 `accepted=true` 表示 Gateway 已進入分發流程，不保證所有裝置都已經展示系統通知。

## 常見錯誤

| 狀態碼 | 典型原因 |
| :--- | :--- |
| `400` | 缺少路由級必填欄位、傳了未知欄位、`severity` 不合法、`attrs` 不是物件修補程式。 |
| `401` | 私人 Gateway Bearer Token 缺失或錯誤。 |
| `404` | Channel 或 `event_id` 不存在。 |
| `413` | 請求 body超過 32KB。 |
| `503` | 分發未完整成功。 |