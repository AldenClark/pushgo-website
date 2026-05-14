---
title: App 介紹與平台支援
description: 瞭解 PushGo 已發佈用戶端、系統需求和不同平台的投遞能力。
---
PushGo 目前對外發佈 Apple 平台用戶端、Android 用戶端和 Gateway。官網只描述已經可用的公開釋出內容；未發佈平台不會列為可下載或可用用戶端。

## 平台概覽

| 平台 | 取得方式 | 系統需求 | 主要投遞路徑 | 私人通道 |
| :--- | :--- | :--- | :--- | :--- |
| iOS | App Store | iOS 18+ | APNs | 否 |
| macOS | App Store | macOS 15+ | APNs | 否 |
| watchOS | App Store | watchOS 11+ | APNs | 否 |
| Android | GitHub Releases | Android 12+ | FCM + 私人通道 | 是，支援 QUIC / Raw TCP / WSS |

## Apple 平台用戶端

Apple 平台用戶端遵循系統推播模型，由 APNs 負責背景投遞。

適合：

- iPhone、Mac 和 Apple Watch 上接收個人通知。
- 使用系統通知優先順序和通知擴充功能處理富內容。
- 希望用戶端盡量貼近系統行為，而不是維持長期背景連線。

注意：

- Apple 平台不使用 PushGo Android 私人通道。
- 背景投遞可靠性由 APNs、系統通知許可權、專注模式和裝置網路共同決定。
- E2EE 欄位在用戶端本機設定金鑰後解密；未設定或解密失敗時會保留原始展示狀態。

## Android 用戶端

Android 用戶端同時支援廠商通道和 PushGo 私人通道。

適合：

- 需要更低延遲的狀態同步。
- 自我託管 Gateway，並希望讓裝置直連自己的同步入口。
- 使用 FCM 做背景喚醒，同時在活躍同步時走私人連結。

私人通道會根據 Gateway profile 和網路環境選擇可用傳輸：

| 傳輸 | 適用場景 |
| :--- | :--- |
| WSS | 最通用，複用 HTTPS 入口，最適合作為預設啟用項。 |
| QUIC | 延遲低，適合能開放 UDP 連線埠的部署。 |
| Raw TCP | 適用於受控網路或有專門四層入口的部署。 |

私人通道需要 Gateway 明確啟用對應傳輸，並正確配置憑證、連線埠和外部可存取位址。部署細節請參閱 [私人部署](/zh-tw/guides/self-hosting/)。

## Gateway

Gateway 是 PushGo 的服務端元件，負責：

- 校驗 Channel 密碼和選購的 Gateway Bearer Token。
- 受理 Message、Event 和 Thing 請求。
- 維護事件和實體狀態。
- 透過 APNs、FCM 或 Android 私人通道分發內容。
- 可選開啟 MCP/OAuth，讓 AI 助理在授權 Channel 內呼叫 PushGo 工具。

你可以直接使用公共 Gateway，也可以自架 Gateway，把資料面、驗證策略和維運能力控制在自己的基礎架構裡。

## 能力差異

| 能力 | Apple | Android | Gateway |
| :--- | :--- | :--- | :--- |
| 接收 Message | 是 | 是 | 負責分送 |
| 展示 Event / Thing | 是 | 是 | 負責狀態寫入與分發 |
| E2EE 欄位解密 | 是 | 是 | 僅透傳密文 |
| 私人通道 | 否 | 是 | 需要自架或配置可用入口 |
| MCP/OAuth | 不適用 | 不適用 | 可選啟用 |

如果你只是想開始接收通知，先安裝用戶端並完成 [快速上手](/zh-tw/guides/getting-started/)。如果你要控制資料路徑和私人通道，再繼續閱讀私人部署文件。