---
title: 核心概念
description: 用一套清楚的模型理解 PushGo 的 Channel、Gateway、用戶端與三類資料模型。
---
PushGo 可以理解為一條從指令碼、服務或裝置到已訂閱用戶端的同步路徑。它不只是把文字轉成系統通知，也會保留 Event 的生命週期與 Thing 的目前狀態，讓歷史記錄、篩選與自動化都能維持結構。

## 概念模型

```text
Sender -> Gateway -> Channel -> Subscribed devices
                  |
                  +-> Message / Event / Thing
```

- **Sender**：指令碼、伺服器、Home Assistant、CI/CD pipeline 或 AI 助理。
- **Gateway**：驗證請求、儲存狀態、選擇投遞路徑，並將資料分發給裝置。
- **Channel**：一組裝置共同訂閱的通訊空間。請求必須提供 `channel_id` 與 `password`。
- **用戶端**：Apple 平台用戶端透過 APNs 接收通知，Android 用戶端可同時使用 FCM 和私人通道。
- **資料模型**：PushGo 將一次性提醒、有生命週期的流程、持久狀態分成不同物件。

## Channel：權限與訂閱邊界

Channel 是 PushGo 的基本邊界。多台裝置可以訂閱同一個 Channel，多個 Sender 只要知道憑證，也可以寫入同一個 Channel。

| 概念 | 作用 |
| :--- | :--- |
| `channel_id` | 識別請求要送到哪個 Channel。 |
| `password` | 授權 Sender 寫入該 Channel。 |
| 已訂閱裝置 | 接收 Gateway 已受理的 Channel 內容。 |

Channel 密碼不是 Gateway 管理員密碼。公共 Gateway 和私人 Gateway 都仍然使用 Channel 層級授權；私人 Gateway 還可以額外啟用 Gateway 層級 Bearer Token。

## Gateway：受理、狀態與投遞

Gateway 收到請求後會依序處理：

1. 驗證請求格式、Channel 憑證，以及可選的 Gateway Bearer Token。
2. 建立或更新 Message、Event 或 Thing 狀態。
3. 透過 APNs、FCM 或 Android 私人通道投遞到已訂閱裝置。

HTTP 回應代表 Gateway 是否受理請求。真正的系統通知投遞是非同步流程，因此 `accepted` 只表示請求已進入分發路徑，不代表每台裝置都已經顯示通知。

## 三類資料模型

PushGo 的重點不是把通知欄位越做越多，而是針對不同物件使用不同模型。

| 模型 | 適合表達 | 典型例子 | 主要 API |
| :--- | :--- | :--- | :--- |
| Message | 一次性提醒 | 磁碟快滿、備份完成、價格下降 | `POST /message` |
| Event | 有開始、更新與結束的流程 | 部署流程、故障處理、門窗從開啟到關閉 | `/event/create`、`/event/update`、`/event/close` |
| Thing | 長期存在並反覆更新的實體 | NAS、感測器、房間、網路服務 | `/thing/create`、`/thing/update`、`/thing/archive`、`/thing/delete` |

選擇模型前，先問一個問題：你是要通知一件事、追蹤一段流程，還是同步某個物件的目前狀態？

## 投遞路徑

PushGo 不要求不同用戶端使用同一條背景連線。

| 平台 | 主要投遞路徑 | 說明 |
| :--- | :--- | :--- |
| Apple 平台 | APNs | 由系統負責背景投遞，適用於 iOS、macOS 和 watchOS。 |
| Android | FCM + 私人通道 | FCM 用於背景喚醒，私人通道用於更低延遲的同步。 |
| 自我託管 Gateway | 由部署設定決定 | 可啟用 WSS、QUIC、Raw TCP 等 Android 私人通道。 |

用戶端支援能力請見 [App 介紹與平台支援](/zh-tw/guides/apps/)。

## 安全層次

PushGo 的安全邊界分成幾層：

| 層次 | 解決的問題 |
| :--- | :--- |
| Channel 密碼 | 防止未授權 Sender 寫入 Channel。 |
| Gateway Bearer Token | 私人部署時限制誰能呼叫整個 Gateway。 |
| HTTPS/TLS | 保護傳輸中的請求與憑證。 |
| E2EE `ciphertext` | 讓用戶端在本地解密敏感欄位，Gateway 只透傳密文。 |
| MCP OAuth | 讓 AI 助理在使用者授權的 Channel 範圍內呼叫工具，不需要直接持有 Channel 密碼。 |

如果只是要送出第一則測試通知，先理解 Channel 和 Message 即可。需要建模長期狀態或部署自己的 Gateway 時，再繼續閱讀資料模型、驗證和私人部署文件。
