---
title: DevOps 與 CI/CD 通知
description: 用 PushGo 處理 CI/CD、部署、故障、伺服器和監控通知，並用 Message、Event、Thing 建模。
---

DevOps 通知如果全部寫成純文字，很容易變成不可讀的資訊流。PushGo 把一次性告警、故障生命週期和服務目前狀態分開建模。

## 適合場景

- 傳送建置、部署和發佈通知。
- 把故障處理過程記錄為可更新的 Event。
- 把服務、佇列、備份任務或主機狀態展示為 Thing。
- 透過公共 Gateway 或私人 Gateway 投遞到 Apple 和 Android 用戶端。

## PushGo 如何建模這個流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 建置完成 | Message | 只需要一條可見提醒。 |
| 部署進行中 | Event | 同一個生命週期可以從開始更新到失敗或完成。 |
| 服務健康狀態 | Thing | 物件有隨時間變化的目前狀態。 |

## 最小範例

管線完成用 Message；部署過程有多次狀態變化時用 Event；使用者更關心服務目前狀態時用 Thing。

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

- **PushGo 適合 CI/CD 通知嗎？** 適合。CI/CD 系統可以在 shell step 或 webhook action 中直接呼叫 HTTP API。
- **故障應該如何表達？** 用 Event，讓同一故障可以持續更新並關閉，而不是產生很多無關通知。
- **團隊可以私人部署 DevOps 通知嗎？** 可以。私人 Gateway 可以控制資料路徑、驗證和維運策略。

## 安全與維運

- 高風險自動化應使用獨立 Channel 和受限憑據。
- AI 助理應優先使用 MCP OAuth，避免模型直接持有 Channel 密碼。
- 當資料路徑、通道策略或合規邊界必須自行控制時，使用私人部署。
- 敏感欄位應使用 E2EE，讓用戶端本機解密。

## 下一步

- [資料模型](/zh-tw/guides/data-models/)
- [事件 API](/zh-tw/reference/api-event/)
- [私人部署](/zh-tw/guides/self-hosting/)
