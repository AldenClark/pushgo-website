---
title: 實體 API (Thing)
description: 使用 /thing/create、/thing/update、/thing/archive 和 /thing/delete 管理長期實體狀態。
---
Thing API 用於表達長期存在並重複更新的物件，例如伺服器、房間、感測器、網路服務或長期任務。建立實體後，Gateway 傳回 `thing_id`；後續更新、歸檔和刪除都透過這個 ID 關聯到同一個物件。

## Endpoints

```http
POST /thing/create
POST /thing/update
POST /thing/archive
POST /thing/delete
```

請求 body必須是 JSON，未宣告欄位會被嚴格拒絕。私人 Gateway 如果啟用了 `PUSHGO_TOKEN`，還需要 `Authorization: Bearer <token>`。

## 請求頭

| Header | 必填 | 說明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 請求 body格式。 |
| `Authorization: Bearer <token>` | 視 Gateway 設定而定 | 僅私人 Gateway 開啟 `PUSHGO_TOKEN` 時必填。 |

## 生命週期

```text
/thing/create -> thing_id
      |
      +-> /thing/update   可呼叫多次
      |
      +-> /thing/archive  歸檔但保留歷史
      |
      +-> /thing/delete   刪除或退役
```

## 通用欄位

| 欄位 | 型別 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 是 | 目標 Channel ID。 |
| `password` | `string` | 是 | Channel 密碼，通常 8-128 個字元。 |
| `op_id` | `string` | 否 | 冪等鍵；不傳則 Gateway 會自動產生並在回應中傳回。 |
| `ciphertext` | `string` | 否 | 可選 E2EE 密文載重。 |

## 路由級必填欄位

| 路由 | 必填業務欄位 |
| :--- | :--- |
| `/thing/create` | `observed_at` |
| `/thing/update` | `thing_id`、`observed_at` |
| `/thing/archive` | `thing_id`、`observed_at` |
| `/thing/delete` | `thing_id`、`observed_at` |

## 欄位規則

| 欄位 | 型別 | 規則 |
| :--- | :--- | :--- |
| `thing_id` | `string` | update/archive/delete 必填；create 時不得傳入；1-64 個字元，可用字母、數字、`_`、`:`、`-`。 |
| `title` | `string` | 建立時建議傳；當前 Gateway 不因缺少 `title` 拒絕建立。 |
| `description` | `string` | 可選；空字串依預設處理。 |
| `tags` | `string[]` | 最多 32 項，每項最多 64 字元，trim 後去重。 |
| `primary_image` | `string` | 可選 URL，最大 2048 字元。 |
| `images` | `string[]` | 最多 32 項，每項最多 2048 字元，trim 後去重。 |
| `created_at` | `number` | 僅 create 允許；不傳時回退為 `observed_at`。 |
| `deleted_at` | `number` | 僅 delete 允許；不傳時回退為 `observed_at`。 |
| `observed_at` | `number` | 必填；本次狀態觀測時間；接受 Unix 秒或毫秒，並歸一化為毫秒。 |
| `external_ids` | `object` | key 格式 `[A-Za-z0-9_:.-]`、<= 64 並會轉小寫；value 為非空 `string` <= 256，或用 `null` 刪除。 |
| `location_type` + `location_value` | `string` + `string` | 必須同時出現；type 為 `physical`、`geo`、`cloud`、`datacenter` 或 `logical`。格式：`geo` 為 `lat,lng`，`cloud` 為 `provider:region[:zone]`，`datacenter` 為 `site[:room[:rack]]`，`logical` 為斜線分隔 token。 |
| `attrs` | `object` | 物件補丁；value 為 `null` 表示刪鍵；不允許陣列；物件巢狀僅支援一層。 |
| `metadata` | `object` | 否 | 自訂標量鍵值；key <= 64，非空標量 value <= 512；拒絕巢狀物件和陣列。 |

## 建立實體

```bash
curl -X POST https://gateway.pushgo.cn/thing/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "家庭 NAS",
    "description": "客廳機櫃中的主儲存",
    "observed_at": 1713750000000,
    "tags": ["nas", "home"],
    "location_type": "physical",
    "location_value": "home/living-room",
    "attrs": {
      "online": true,
      "disk_used": 0.72,
      "temperature": 43.2
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
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

儲存傳回的 `thing_id`，後續更新、歸檔和刪除都需要它。

## 更新實體

```bash
curl -X POST https://gateway.pushgo.cn/thing/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713750600000,
    "attrs": {
      "disk_used": 0.74,
      "temperature": 44.1
    }
  }'
```

`attrs` 是補丁，不需要每次都傳完整狀態。要刪除某個鍵，可以傳 `null`。

```json
{
  "attrs": {
    "temporary_alarm": null
  }
}
```

## 歸檔實體

歸檔適合「不再活躍，但仍希望保留歷史」的物件。

```bash
curl -X POST https://gateway.pushgo.cn/thing/archive \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751200000,
    "attrs": {
      "online": false
    }
  }'
```

## 刪除實體

刪除或退役實體時使用 `/thing/delete`。

```bash
curl -X POST https://gateway.pushgo.cn/thing/delete \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751800000,
    "deleted_at": 1713751800000
  }'
```

## 關聯 Message 和 Event

Thing 表示長期物件。相關警告可以用 Message 關聯到 `thing_id`，相關過程可以用 Event 關聯到 `thing_id`。

| 場景 | 推薦建模 |
| :--- | :--- |
| NAS 目前 CPU、溫度、磁碟使用率 | Thing |
| NAS 磁碟快滿的一次提醒 | Message + `thing_id` |
| NAS 備份從開始到完成 | Event + `thing_id` |

## 回應語義

Thing API 回應同樣使用統一 envelope。 `accepted=true` 表示 Gateway 已進入分發流程，不保證所有裝置都已經展示系統通知。

## 常見錯誤

| 狀態碼 | 典型原因 |
| :--- | :--- |
| `400` | 缺少 `observed_at`、傳了未知欄位、`attrs` 或 `external_ids` 格式不合法。 |
| `401` | 私人 Gateway Bearer Token 缺失或錯誤。 |
| `404` | Channel 或 `thing_id` 不存在。 |
| `413` | 請求 body超過 32KB。 |
| `503` | 分發未完整成功。 |