---
title: 快速上手
description: 從安裝用戶端到收到第一條 PushGo 通知的最短路徑。
---
本指南適合第一次使用 PushGo 的讀者。完成後，你將擁有一個可用 Channel，並能透過 HTTP API 傳送第一條 Message。

## 準備工作

- 已安裝 PushGo 用戶端的裝置。
- 一個可以運作 `curl` 的終端機。
- 一個 Channel ID 和 Channel 密碼。你可以在用戶端建立新 Channel，也可以訂閱別人分享給你的 Channel。

## 1. 安裝用戶端

先安裝一個已經對外發佈的用戶端。

| 平台 | 取得方式 | 系統需求 |
| :--- | :--- | :--- |
| iOS / macOS / watchOS | [App Store](https://apps.apple.com/cn/app/pushgo/id6757907675) | iOS 17+、macOS 14+、watchOS 10+ |
| Android | [GitHub Releases](https://github.com/AldenClark/pushgo-android/releases) | Android 9+ |

## 2. 建立或訂閱 Channel

Channel 是 PushGo 的傳送邊界。所有請求都會傳送到一個 Channel，所有訂閱該 Channel 的裝置都會成為投遞目標。

### 建立新 Channel

1. 開啟用戶端。
2. 點選新增入口。
3. 選擇建立 Channel。
4. 輸入一個容易辨識的名稱和 8-128 位元組的密碼。
5. 儲存產生的 Channel ID 和密碼。

### 訂閱已有 Channel

1. 開啟用戶端。
2. 選擇訂閱 Channel。
3. 輸入已有 Channel ID 和密碼。
4. 訂閱成功後，這台裝置會開始接收該 Channel 的內容。

## 3. 選擇公共 Gateway

公共 Gateway 適合快速測試，不需要先部署伺服器。

| 區域 | Gateway |
| :--- | :--- |
| 中國大陸 | `https://gateway.pushgo.cn` |
| Global | `https://gateway.pushgo.dev` |

選擇離你和接收裝置更近的區域。私人部署使用者請把範例中的位址替換成自己的 Gateway 位址；如果啟用了 `PUSHGO_TOKEN`，還需要加上 `Authorization: Bearer <token>`。

## 4. 傳送第一則訊息

```bash
curl -X POST https://gateway.pushgo.cn/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "來自 PushGo 的問候",
    "body": "這是一條測試通知。",
    "severity": "normal"
  }'
```

成功響應類似：

```json
{
  "success": true,
  "data": {
    "op_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "message_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02"
  }
}
```

`success=true` 表示 Gateway 已持久受理請求。儲存 `op_id` 可查詢 `GET /send_status/{op_id}`；最終顯示仍取決於 provider、裝置狀態、通知權限和私人通道。

## 常見問題

| 現象 | 檢查專案 |
| :--- | :--- |
| 傳回 `400` | 欄位名稱是否拼錯；`title`、`channel_id`、`password` 是否存在；請求 body 是否為 JSON。 |
| 返回 `401` | 私人 Gateway 是否啟用了 `PUSHGO_TOKEN`；Bearer Token 是否正確。 |
| 返回 `404` | Channel ID 是否正確；裝置是否已建立或訂閱該 Channel。 |
| 返回 `success=true` 但沒看到通知 | 裝置通知許可權、系統網路、Android 私人通道或 APNs/FCM 投遞狀態。 |
| 請求 body 過大 | 單次 JSON 請求最大 32 KiB（32,768 位元組），圖片請傳 URL，不要把二進位直接塞進 JSON。 |

更多狀態碼見 [限制與錯誤](/zh-tw/reference/limits-errors/)。

## 下一步

- 想理解 PushGo 為什麼有三類模型：閱讀 [核心概念](/zh-tw/guides/concepts/)。
- 想選擇 Message、Event 或 Thing：閱讀 [資料模型](/zh-tw/guides/data-models/)。
- 想把指令碼接入生產環境：閱讀 [典型場景](/zh-tw/guides/use-cases/)。
- 想部署自己的 Gateway：閱讀 [私人部署](/zh-tw/guides/self-hosting/)。
