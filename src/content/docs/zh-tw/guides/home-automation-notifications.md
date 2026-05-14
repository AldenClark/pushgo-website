---
title: NAS、IoT 與 Home Assistant 通知
description: 用 PushGo 處理 NAS 告警、IoT 裝置、Home Assistant 自動化和長期裝置狀態更新。
---

家庭自動化和裝置監控通常不只是一次提醒。PushGo 可以傳送通知、追蹤事件，並維護裝置或服務的目前狀態。

## 適合場景

- 把 NAS 磁碟、備份和服務告警傳送到手機和桌面端。
- 透過 webhook 風格的 HTTP 請求接入 Home Assistant 自動化。
- 把裝置、感測器、備份任務或媒體服務建模為 Thing。
- 當家庭資料需要自己掌控時使用私人 Gateway。

## PushGo 如何建模這個流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 門鈴快照或磁碟告警 | Message | 內容是一條單次提醒。 |
| 備份或媒體掃描進度 | Event | 進度可以持續更新到完成。 |
| 感測器或裝置狀態 | Thing | 最新狀態比每次歷史更新更重要。 |

## 最小範例

NAS 指令碼可以用 `/message` 傳送磁碟告警；備份任務可以建立 Event，並持續更新到成功或失敗。

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "來自 PushGo 的通知",
    "body": "自動化通知路徑已經打通。"
  }'
```

## 本頁直接回答的問題

- **PushGo 可以接收 Home Assistant webhook 通知嗎？** 可以。Home Assistant 自動化可以透過 webhook 或 REST action 呼叫 PushGo HTTP API。
- **如何避免重複的過期裝置通知？** 用 Thing 表達裝置或服務狀態，讓用戶端顯示同一個物件的目前狀態。
- **可以在私人網路裡執行嗎？** 可以。需要控制資料路徑或通道策略時，可以私人部署 Gateway。

## 安全與維運

- 高風險自動化應使用獨立 Channel 和受限憑據。
- AI 助理應優先使用 MCP OAuth，避免模型直接持有 Channel 密碼。
- 當資料路徑、通道策略或合規邊界必須自行控制時，使用私人部署。
- 敏感欄位應使用 E2EE，讓用戶端本機解密。

## 下一步

- [典型場景](/zh-tw/guides/use-cases/)
- [實體 API](/zh-tw/reference/api-thing/)
- [私人部署](/zh-tw/guides/self-hosting/)
