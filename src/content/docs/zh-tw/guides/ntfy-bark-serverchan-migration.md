---
title: 從 ntfy、Bark 或 ServerChan 遷移
description: 透過相容介面和原生模型，把現有 ntfy、Bark、ServerChan 或 Webhook 通知指令碼遷移到 PushGo。
---

PushGo 可以先接住現有通知式流程，再逐步把重要路徑遷移到原生 Message、Event 和 Thing 模型。

## 適合場景

- 評估 PushGo 時先保持簡單指令碼繼續工作。
- 一次遷移一條告警路徑，而不是重寫所有自動化。
- 把純文字訊息升級為結構化生命週期或實體狀態。
- 在敏感流程中結合 E2EE 和私人部署。

## PushGo 如何建模這個流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 簡單遷移告警 | Message | 舊通知保持為一次性訊息。 |
| 有狀態變化的流程 | Event | 多次更新應屬於同一個生命週期。 |
| 長期監控物件 | Thing | 同一個實體可以隨時間更新。 |

## 最小範例

先把低風險指令碼遷移到相容介面；需要更強語義的流程，再遷移到原生 `/message`、`/event/*` 或 `/thing/*` API。

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

- **必須馬上重寫所有指令碼嗎？** 不需要。可以先使用相容介面，優先遷移高價值流程。
- **什麼時候不該繼續用純文字通知？** 當流程有進度、關閉、目前狀態、圖片、中繼資料或安全要求時，應升級到原生模型。
- **這是直接功能比較嗎？** 不是。遷移應按建模需求判斷：簡單提醒保持簡單，需要結構的流程再升級。

## 安全與維運

- 高風險自動化應使用獨立 Channel 和受限憑據。
- AI 助理應優先使用 MCP OAuth，避免模型直接持有 Channel 密碼。
- 當資料路徑、通道策略或合規邊界必須自行控制時，使用私人部署。
- 敏感欄位應使用 E2EE，讓用戶端本機解密。

## 下一步

- [遷移指南](/zh-tw/guides/migration/)
- [訊息 API](/zh-tw/reference/api-message/)
- [資料模型](/zh-tw/guides/data-models/)
