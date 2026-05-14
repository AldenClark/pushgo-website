---
title: 簡介
description: 瞭解 PushGo 是什麼、適合誰，以及應該從哪裡開始。
---
**PushGo** 是一個以個人自動化、伺服器/NAS 監控、DevOps、IoT 和 AI 助理工作流程的開源通知與狀態同步系統。它由用戶端、Gateway 和一組 HTTP API 組成，可以直接使用公共 Gateway，也可以部署到自己的基礎架構。

## PushGo 解決什麼問題

很多通知工具只處理「一段文字發到手機」。這在簡單提醒裡足夠，但一旦你要表達任務進度、故障生命週期、裝置狀態或 AI 助手動作，就會變得混亂。

PushGo 把資料分成三類：

| 模型 | 用途 | 例 |
| :--- | :--- | :--- |
| Message | 一次性提醒 | 備份完成、磁碟快滿、價格下降 |
| Event | 可更新並最終結束的流程 | 部署流程、故障處理、門窗開啟至關閉 |
| Thing | 長期存在的實體狀態 | NAS、感測器、房間、網路服務 |

這樣做的好處是：提醒是提醒，過程是過程，狀態是狀態。用戶端和自動化指令碼都能更穩定地理解這些資料。

## 系統組成

```text
指令碼 / 服務 / AI 助手
        |
        v
PushGo Gateway
        |
        +-- APNs -> Apple 平台用戶端
        +-- FCM  -> Android 用戶端
        +-- 私人通道 -> Android 低延遲同步
```

Gateway 負責驗證、受理 API、維護狀態並分發到已訂閱裝置。用戶端負責接收、展示、解密和管理 Channel。

## 適合誰

- 個人使用者：把指令碼、Webhook、價格監控、下載任務推播到手機。
- 家庭伺服器和 NAS 使用者：監控磁碟、備份、UPS、服務線上狀態。
- DevOps 使用者：追蹤部署、建置、故障和服務健康狀態。
- IoT / Home Assistant 使用者：同步房間、感應器和安全事件。
- 自我託管使用者：在自己的 Gateway 上控制資料、驗證、私人通道和 MCP/OAuth。

## 從哪裡開始

| 目標 | 推薦閱讀 |
| :--- | :--- |
| 收到第一條通知 | [快速上手](/zh-tw/guides/getting-started/) |
| 理解系統運作方式 | [核心概念](/zh-tw/guides/concepts/) |
| 選擇正確資料模型 | [資料模型](/zh-tw/guides/data-models/) |
| 看實際整合案例 | [典型場景](/zh-tw/guides/use-cases/) |
| 從 ntfy、Bark 或 ServerChan 遷移 | [遷移指南](/zh-tw/guides/migration/) |
| 部署自己的 Gateway | [私人部署](/zh-tw/guides/self-hosting/) |
| 接入 AI 助理 | [MCP 參考](/zh-tw/reference/mcp/) |

如果你還沒有 Channel，先從快速上手開始；如果你已經有指令碼要接入，先看資料模型和 Message API。