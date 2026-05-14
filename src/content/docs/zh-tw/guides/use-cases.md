---
title: 典型場景
description: 透過可直接套用的場景來理解 PushGo 的 Message、Event 和 Thing。
---
本頁不是功能清單，而是建模手冊。每個場景都會說明應該用哪種模型，以及為什麼這樣比單純傳送文字通知更清晰。

## 伺服器與 NAS

### 磁碟空間警告：Message

磁碟超過閾值時，只需要一次強提醒，用 Message 最適合。

```bash
USAGE=$(df / | awk 'NR==2 { gsub("%", "", $5); print $5 }')

if [ "$USAGE" -ge 90 ]; then
  curl -X POST https://gateway.pushgo.cn/message \
    -H "Content-Type: application/json" \
    -d '{
      "channel_id": "YOUR_CHANNEL_ID",
      "password": "YOUR_CHANNEL_PASSWORD",
      "title": "磁碟空間預警",
      "body": "根分割槽使用率已達到 '"$USAGE"'%。",
      "severity": "high",
      "tags": ["nas", "disk"]
    }'
fi
```

### 備份任務：Event

備份有開始、進度和結果。用 Event 可以把多次狀態變化合併成一個生命週期。

```bash
CREATE_RESPONSE=$(curl -s -X POST https://gateway.pushgo.cn/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "NAS 備份",
    "status": "running",
    "message": "備份任務已開始",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000
  }')
```

後續指令碼儲存傳回的 `event_id`，在上傳、校驗、完成或失敗時呼叫 `/event/update` 和 `/event/close`。

### 主機狀態面板：Thing

如果你希望長期看到某台伺服器的目前狀態，用 Thing 表示主機本身。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "家庭 NAS",
  "observed_at": 1713750000000,
  "tags": ["nas", "home"],
  "attrs": {
    "online": true,
    "cpu": 0.18,
    "disk_used": 0.72,
    "temperature": 43.2
  }
}
```

## Home Assistant 與 IoT

### 房間或感應器：Thing

溫度、濕度、照度這類資料是持續狀態。建議把每個房間或裝置建成 Thing，然後定期更新 `attrs`。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "客廳環境",
  "observed_at": 1713750000000,
  "external_ids": {
    "home_assistant": "sensor.living_room_temperature"
  },
  "location_type": "physical",
  "location_value": "home/living-room",
  "attrs": {
    "temperature": 22.5,
    "humidity": 0.46
  }
}
```

### 門窗開啟至關閉：Event

門窗開啟不是一個長期實體的全部狀態，而是一段過程。建立 Event，門關閉時 close。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "陽台門開啟",
  "status": "open",
  "message": "陽台門已開啟超過 5 分鐘",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "tags": ["home", "door"]
}
```

### 帶截圖的運動偵測：Message

相機偵測到一次運動並附帶快照，用 Message 即可。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "檢測到運動",
  "body": "玄關攝像頭檢測到運動。",
  "severity": "high",
  "images": ["https://example.com/snapshot.jpg"],
  "tags": ["camera", "security"]
}
```

## DevOps 與自動化流程

### 部署管線：Event

部署任務天然有生命週期。建議在管線開始時 create，關鍵階段 update，最終 close。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "生產環境部署",
  "status": "building",
  "message": "映像構建中",
  "severity": "normal",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "attrs": {
    "service": "api",
    "revision": "8f3c2a1"
  }
}
```

失敗時可以把 `severity` 提升到 `critical`，並用 `/event/close` 標記結束。

### 服務健康狀態：Thing

服務是否線上上、延遲多少、目前版本是什麼，屬於目前狀態。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "API 服務",
  "observed_at": 1713750000000,
  "location_type": "cloud",
  "location_value": "prod",
  "attrs": {
    "healthy": true,
    "latency_ms": 83,
    "version": "1.8.4"
  }
}
```

### 失敗強提醒：Message

即使已經有 Event 記錄部署過程，也可以在失敗節點額外傳送一條 Message，讓行動端優先提醒。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "生產部署失敗",
  "body": "api 服務部署失敗，請檢查流水線日誌。",
  "severity": "critical",
  "tags": ["deploy", "prod"]
}
```

## 個人自動化

### 價格監控：Message

價格觸發閾值通常是一次性提醒。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "價格下降",
  "body": "目標商品已降至 199 元。",
  "severity": "normal",
  "url": "https://example.com/product"
}
```

### 長時間下載或轉碼：Event

下載、轉碼、訓練模型都適用於 Event。它們有明確開始和結束，中間還可能更新進度。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "影片轉碼",
  "status": "running",
  "message": "進度 45%",
  "severity": "normal",
  "event_time": 1713750000000,
  "attrs": {
    "progress": 0.45
  }
}
```

## 建模速查

| 場景 | 推薦模型 | 理由 |
| :--- | :--- | :--- |
| 失敗、成功、降價、警告 | Message | 單次提醒，讀完即可。 |
| 部署、備份、轉碼、故障處理 | Event | 有過程，有多次更新，有最終結果。 |
| 伺服器、感測器、房間、服務 | Thing | 長期存在，需要反覆更新目前狀態。 |
| 某台裝置上的警告 | Thing + Message | 警告關聯到實體，歷史更容易追蹤。 |
| 某服務的一次故障 | Thing + Event | 服務是實體，故障是生命週期事件。 |