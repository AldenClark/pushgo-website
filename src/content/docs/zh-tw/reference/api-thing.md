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

請求 body 必須是 JSON。未知擴充欄位會被忽略；動作明確禁止的已知欄位仍會被拒絕。私人 Gateway 如果啟用了 `PUSHGO_TOKEN`，還需要 `Authorization: Bearer <token>`。

## 請求頭

| Header | 必填 | 說明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 請求 body 格式。 |
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
| `password` | `string` | 是 | Channel 密碼；先 trim，再按 8-128 位元組驗證。 |
| `op_id` | `string` | 必須省略 | 由 Gateway 產生並傳回；客戶端傳入會傳回 `400 op_id_not_allowed`。 |
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
| `title`、`description` | `string` | 可選 patch 內容；建立時建議提供 `title`，但 Gateway 不因缺少而拒絕。 |
| `tags`、`images` | `string[]` | 可選 patch 內容；不繼承 Message 的數量和長度限制。 |
| `primary_image`、`location_type`、`location_value` | `string` | 可選 patch 內容；1.3.0 不強制先前文件中的位置成對和格式規則。 |
| `created_at` | `number` 或數字字串 | 可選且僅用於 create；未傳入時不寫入，也不會從 `observed_at` 回填。 |
| `deleted_at` | `number` 或數字字串 | 可選且僅用於 delete；未傳入時不寫入，也不會從 `observed_at` 回填；create/update/archive 會拒絕。 |
| `observed_at` | `number` 或數字字串 | 必填；接受 Unix 秒或毫秒並正規化為毫秒。 |
| `external_ids`、`attrs` | `object` | 可選 patch 內容；1.3.0 不強制先前文件中的結構限制。 |
| `metadata` | `object` | 自訂標量鍵值；key <= 64 位元組，非空標量文字 <= 512 位元組；拒絕巢狀物件、陣列和 null。 |

create 禁止 `thing_id`；所有動作禁止客戶端傳入 `state` 和 `op_id`；`deleted_at` 僅用於 delete。未知欄位會被忽略且不會生效。

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
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
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

統一成功 envelope 表示 Gateway 已持久受理，不代表供應商投遞或裝置顯示成功。可用傳回的 `op_id` 查詢 `GET /send_status/{op_id}`。

## 常見錯誤

| 狀態碼 | 典型原因 |
| :--- | :--- |
| `400` | 路由級必填欄位缺失、ID/時間/metadata 無效、傳入 `op_id` 或動作禁止欄位。 |
| `401` | 私人 Gateway Bearer Token 缺失或錯誤。 |
| `404` | Channel 不存在或憑證不相符。 |
| `413` | 請求 body 超過 32 KiB（32,768 位元組）。 |
| `503` | Gateway 無法受理本次提交。 |
