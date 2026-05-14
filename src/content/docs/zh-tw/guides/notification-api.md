---
title: 面向指令碼和服務的推播通知 API
description: 把 PushGo 用作 curl、Webhook、cron、CI/CD、NAS 告警和自動化指令碼的 HTTP 通知 API。
---

PushGo 提供可直接呼叫的 HTTP API，適合把指令碼、服務和自動化結果可靠送達使用者，同時保留事件和狀態的結構化語義。

## 適合場景

- 從 curl、cron、Shell 指令碼或 Webhook 傳送通知。
- 回報任務完成、價格提醒、圖片快照或監控結果。
- 用 Event 和 Thing 取代不斷堆積的純文字通知。
- 先使用相容介面，再逐步遷移到 PushGo 原生 API。

## PushGo 如何建模這個流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 一次指令碼告警 | Message | 簡單、瞬時，適合用 curl 測試。 |
| 帶進度的任務 | Event | 同一個事件可以持續更新到完成。 |
| 裝置或服務目前狀態 | Thing | 用戶端看到最新狀態，而不是一串過期通知。 |

## 最小範例

原生 `/message` 端點接收 JSON，並回傳 Gateway 是否已將請求受理進分發流程。

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

- **可以用 curl 傳送通知嗎？** 可以。Message API 適合從 curl、指令碼和簡單 HTTP 用戶端呼叫。
- **PushGo 只是手機通知 API 嗎？** 不是。PushGo 還可以表達 Event 生命週期和 Thing 目前狀態。
- **這個 API 可以私人部署嗎？** 可以。你可以執行自己的 Gateway，並控制驗證、儲存、通道和 MCP/OAuth。

## 安全與維運

- 高風險自動化應使用獨立 Channel 和受限憑據。
- AI 助理應優先使用 MCP OAuth，避免模型直接持有 Channel 密碼。
- 當資料路徑、通道策略或合規邊界必須自行控制時，使用私人部署。
- 敏感欄位應使用 E2EE，讓用戶端本機解密。

## 下一步

- [快速上手](/zh-tw/guides/getting-started/)
- [訊息 API](/zh-tw/reference/api-message/)
- [私人部署](/zh-tw/guides/self-hosting/)
