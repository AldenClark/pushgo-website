---
title: 遷移現有推播指令碼
description: 從 ntfy、Bark、ServerChan 或普通 Webhook 遷移到 PushGo。
---
遷移到 PushGo 不需要一次重寫所有指令碼。建議分兩步驟：先用相容介面保持指令碼繼續運作，再把重要場景逐步升級為原生 Message、Event 或 Thing。

## 推薦路徑

1. **改 endpoint**：把原來的 ntfy、Bark 或 ServerChan 請求改到 PushGo 相容入口。
2. **替換 key**：使用 `<channel_id>:<password>` 作為相容 key。
3. **清理欄位**：把 priority、level、group、icon 等欄位整理為 `severity`、`tags`、`images` 或 `metadata`。
4. **升級模型**：一次提醒保留 Message；有生命週期的流程升級為 Event；長期狀態升級為 Thing。

## 相容介面

| 來源 | 方法 | PushGo 路徑 | 相容 key 位置 |
| :--- | :--- | :--- | :--- |
| ntfy | `POST` / `PUT` | `/ntfy/{topic}` | `{topic}` = `<channel_id>:<password>` |
| ServerChan | `GET` / `POST` | `/serverchan/{sendkey}` | `{sendkey}` = `<channel_id>:<password>` |
| Bark v1 | `GET` | `/bark/{device_key}/{body}` | `{device_key}` = `<channel_id>:<password>` |
| Bark v2 | `POST` | `/bark/push` | JSON 欄位 `device_key` |

相容介面的目標是降低遷移成本，不是覆蓋 PushGo 的完整資料模型。如果你需要 `thing_id`、Event 生命週期或完整 Thing 狀態，請使用原生 API。

## 從 ntfy 遷移

原來可能是：

```bash
curl -d "NAS backup completed" https://ntfy.example.com/my-topic
```

遷移到 PushGo 相容入口：

```bash
curl -X POST https://gateway.pushgo.cn/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: 備份完成" \
  -H "Priority: 3" \
  -d "NAS backup completed"
```

升級為原生 Message：

```bash
curl -X POST https://gateway.pushgo.cn/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "備份完成",
    "body": "NAS 備份任務已經完成。",
    "severity": "normal",
    "tags": ["nas", "backup"]
  }'
```

## 從 Bark 遷移

Bark 常見用法是把 device key 放進路徑。遷移時把 device key 換成 `<channel_id>:<password>`。

```bash
curl "https://gateway.pushgo.cn/bark/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD/伺服器告警?title=CPU%20High&level=timeSensitive"
```

如果你已經在使用 JSON 請求，建議直接改成原生 Message。原生 API 對 `images`、`tags`、`metadata`、`thing_id` 和 E2EE 更清楚。

## 從 ServerChan 遷移

```bash
curl -X POST https://gateway.pushgo.cn/serverchan/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -d "title=部署完成" \
  -d "desp=生產環境部署成功"
```

ServerChan 更偏一次性提醒。如果你的指令碼現在會連續傳送“開始”“進行中”“結束”，建議直接升級為 Event。

## 什麼時候升級為 Event

如果同一個任務會傳送多個階段性訊息，Event 更適合。

| 舊指令碼行為 | Event 表達 |
| :--- | :--- |
| 傳送「部署開始」 | `/event/create` |
| 傳送「建置完成」「釋出中」 | `/event/update` |
| 傳送「部署成功/失敗」 | `/event/close` |

這樣用戶端可以展示同一個事件的完整時間軸，而不是多個互不相關的 Message。

## 什麼時候升級為 Thing

如果你的指令碼反覆推送同一個物件的當前狀態，Thing 更合適。

| 舊指令碼行為 | Thing 表達 |
| :--- | :--- |
| 每分鐘傳送 CPU/記憶體 | `/thing/update` 更新 `attrs` |
| 每次傳送房間溫濕度 | 一個房間或感應器一個 `thing_id` |
| 服務上線/下線重複提醒 | Thing 表示服務，Message 或 Event 表示異常 |

## 相容介面限制

- 相容 key 含有 Channel 密碼，不要寫入公開日誌。
- ntfy 相容入口不支援 `thing_id`。
- 相容介面無法完整表達 Thing 生命週期。
- 不同服務的優先權和欄位名稱會被對映，無法保證所有原服務欄位一一保留。
- 複雜 metadata、E2EE 和實體關聯建議遷移到原生 API 後再使用。