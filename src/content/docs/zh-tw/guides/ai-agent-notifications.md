---
title: 面向 AI Agent 的 MCP 通知
description: 透過 PushGo MCP 和 OAuth，讓 AI agent、聊天機器人和 MCP 用戶端傳送通知、更新事件並同步狀態。
---

當 AI agent、聊天機器人或 MCP 用戶端需要通知使用者、回報長任務進度，或更新服務/裝置/任務狀態時，可以用 PushGo 建立清楚的通知路徑，並避免讓模型直接持有 Channel 密碼。

## 適合場景

- Agent 完成長任務後通知使用者。
- 把 Agent 進度記錄為可更新的 Event。
- 當 Agent 改變服務、裝置或任務狀態時更新 Thing。
- 透過 OAuth Channel 綁定授權第三方 MCP 用戶端。

## PushGo 如何建模這個流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 一次完成提醒 | Message | 使用者只需要一條可見通知。 |
| 長時間執行的 Agent 任務 | Event | 同一個任務可以持續更新並關閉。 |
| 服務或任務目前狀態 | Thing | Agent 更新同一個持久物件。 |
| 助理授權 | MCP OAuth | 模型不需要在工具呼叫中持有 Channel 密碼。 |

## 最小範例

MCP 用戶端連接 `/mcp`，啟動 `pushgo.channel.bind.start`，使用者在瀏覽器裡授權 Channel，之後助理即可在該權限範圍內呼叫 `pushgo.message.send`、`pushgo.event.update` 或 `pushgo.thing.update`。

```text
pushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send
```

## 本頁直接回答的問題

- **AI agent 可以向我的手機傳送推播通知嗎？** 可以。PushGo 提供 MCP 工具，授權後的 AI agent 可以透過 Gateway 傳送 Message 通知。
- **聊天機器人應該保存我的 Channel 密碼嗎？** 不應該。生產環境應使用 MCP OAuth，由使用者在瀏覽器中綁定 Channel。
- **Agent 應該如何回報進度？** 長任務使用 Event，因為它可以建立、反覆更新，並在任務結束時關閉。

## 安全與維運

- 高風險自動化應使用獨立 Channel 和受限憑據。
- AI 助理應優先使用 MCP OAuth，避免模型直接持有 Channel 密碼。
- 當資料路徑、通道策略或合規邊界必須自行控制時，使用私人部署。
- 敏感欄位應使用 E2EE，讓用戶端本機解密。

## 下一步

- [MCP 參考](/zh-tw/reference/mcp/)
- [身分驗證](/zh-tw/reference/auth/)
- [資料模型](/zh-tw/guides/data-models/)
