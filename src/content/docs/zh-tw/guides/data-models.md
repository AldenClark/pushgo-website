---
title: 資料模型
description: 判斷何時使用 Message、Event 或 Thing，並理解它們的欄位邊界。
---
PushGo 的三類資料模型對應三種不同的商業語意。選對模型之後，用戶端展示、歷史記錄、狀態合併和後續自動化都會更清楚。

## 選擇矩陣

| 你想表達的是 | 應使用 | 原因 |
| :--- | :--- | :--- |
| 「發生了一件事，提醒我一下」 | Message | 沒有持續狀態，傳送後獨立存在。 |
| 「一件事從開始到結束，中間可能多次變更」 | Event | 同一個 `event_id` 可以多次更新，最後關閉。 |
| 「一個裝置、服務、房間或任務的目前狀態」 | Thing | 同一個 `thing_id` 可以長期更新屬性。 |
| 「某個實體上發生了一次警告」 | Thing + Message | Thing 表示實體，Message 關聯 `thing_id` 表示此提醒。 |
| “某個實體正在經歷一個過程” | Thing + Event | Thing 表示物件，Event 關聯 `thing_id` 表示過程。 |

## Message：一次性提醒

Message 是最直接的通知模型。它適合不需要後續合併或關閉的內容。

### 適合

- 磁碟空間超過閾值。
- 備份任務已經完成。
- 價格監控發現降價。
- 攝影機偵測到一次運動並附帶截圖。

### 不適合

- 部署任務的開始、建置、發佈、完成全過程。
- 伺服器、感測器、房間等長期物件的最新狀態。
- 需要不斷覆蓋目前值的監控面板。

### 欄位分組

| 分組 | 欄位 |
| :--- | :--- |
| 驗證與路由 | `channel_id`、`password`、`op_id`、`thing_id` |
| 展示內容 | `title`、`body`、`severity`、`url`、`images`、`tags` |
| 時效與安全 | `occurred_at`、`ttl`、`ciphertext` |
| 擴充資料 | `metadata` |

### 最小範例

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "備份完成",
  "body": "NAS 每日備份已經完成。",
  "severity": "normal"
}
```

## Event：可更新的生命週期

Event 表示一個過程，而不是一條孤立通知。建立後會得到 `event_id`，後續更新和關閉都圍繞著這個 ID 進行。

### 適合

- CI/CD 部署：開始、建置、發佈、完成或失敗。
- 故障處理：發現異常、排除中、已恢復。
- 門窗狀態：開啟後持續提醒，關閉時結束。
- 長任務：影片轉碼、資料同步、模型訓練。

### 生命週期

```text
/event/create -> event_id
      |
      +-> /event/update  可呼叫多次
      |
      +-> /event/close   結束事件
```

### 欄位分組

| 分組 | 欄位 |
| :--- | :--- |
| 驗證與路由 | `channel_id`、`password`、`op_id`、`thing_id` |
| 生命週期 | `event_id`、`event_time`、`started_at`、`ended_at` |
| 展示內容 | `title`、`description`、`status`、`message`、`severity`、`tags`、`images` |
| 擴充資料 | `attrs`、`metadata`、`ciphertext` |

### 建模建議

- `status` 用短狀態，例如 `running`、`degraded`、`success`、`failed`。
- `message` 寫本次變化，例如「映象推送完成」。
- `event_time` 表示本次變更發生的時間。
- `started_at` 表示整個事件的開始時間，只在建立時需要。
- `ended_at` 表示整個事件的結束時間，只在關閉時需要。

## Thing：長期實體狀態

Thing 表示一個長期存在的物件。它的價值在於“同一個物件被反覆更新”，而不是每次都產生一個新通知物件。

### 適合

- 家庭 NAS、伺服器、網路服務。
- 房間、感應器、攝影機、門鎖。
- 長期任務或資產。
- 需要顯示目前狀態的面板。

### 生命週期

```text
/thing/create -> thing_id
      |
      +-> /thing/update   可呼叫多次
      |
      +-> /thing/archive  不再活躍但保留歷史
      |
      +-> /thing/delete   刪除或退役
```

### 欄位分組

| 分組 | 欄位 |
| :--- | :--- |
| 驗證與路由 | `channel_id`、`password`、`op_id` |
| 身份與展示 | `thing_id`、`title`、`description`、`tags`、`primary_image`、`images` |
| 時間 | `created_at`、`observed_at`、`deleted_at` |
| 位置與外部系統 | `external_ids`、`location_type`、`location_value` |
| 狀態資料 | `attrs`、`metadata`、`ciphertext` |

### 建模建議

- `title` 寫人能辨識的名字，例如「家庭 NAS」。
- `attrs` 寫入會改變的狀態，例如 CPU、溫度、線上狀態。
- `metadata` 寫不常參與展示的輔助訊息，例如來源系統或版本。
- `external_ids` 用來關聯外部系統的 ID，例如 Home Assistant entity ID。

## 組合使用

PushGo 的三類模型可以組合。

| 組合 | 用法 |
| :--- | :--- |
| Thing + Message | 「家庭 NAS」這個實體上發生了一次「磁碟快滿」提醒。 |
| Thing + Event | 「生產資料庫」這個實體正在經歷一次「主從延遲」事件。 |
| Event + Message | Event 記錄完整過程，Message 用於某個關鍵節點的強提醒。 |

如果你不確定該選哪一個，先從 Message 開始；當你發現同一個指令碼在反覆傳送“開始/更新/結束”或“當前值變化”時，再升級為 Event 或 Thing。