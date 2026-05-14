---
title: 身分驗證 (Authentication)
description: 瞭解 Channel 授權、Gateway 授權、相容 key 和 MCP OAuth 的差異。
---
PushGo 的驗證分為四種場景。先判斷你呼叫的是哪一類介面，再決定憑證放在哪裡。

## 驗證模式速查

| 場景 | 需要什麼 | 放在哪裡 | 適合 |
| :--- | :--- | :--- | :--- |
| 原生 API | `channel_id` + `password` | JSON 請求 body | `/message`、`/event/*`、`/thing/*` |
| 私人 Gateway Token | Bearer Token | `Authorization` Header | 自我託管 Gateway 限制呼叫方 |
| 相容介面 | `<channel_id>:<password>` | 路徑或相容欄位 | ntfy、Bark、ServerChan 遷移 |
| MCP OAuth | OAuth access token | MCP 用戶端自動攜帶 | AI 助理與第三方用戶端 |

Channel 授權和 Gateway 授權是兩層不同邊界。開啟私人 Gateway Token 後，請求仍需要 Channel ID 和 Channel 密碼。

## Channel 授權

原生 Message、Event 和 Thing API 都使用請求 body 中的 Channel 憑證。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "測試訊息"
}
```

| 欄位 | 說明 |
| :--- | :--- |
| `channel_id` | 目標 Channel。 |
| `password` | Channel 密碼，通常為 8-128 個字元。 |

Channel 密碼決定「誰能寫入這個 Channel」。它不是 Gateway 管理員密碼，也不應該寫入公開倉庫、日誌或前端程式碼。

## Gateway 級 Bearer Token

私人部署可以透過 `PUSHGO_TOKEN` 開啟 Gateway 級驗證。

```bash
PUSHGO_TOKEN=replace-with-gateway-token
```

開啟後，請求必須攜帶：

```http
Authorization: Bearer replace-with-gateway-token
```

完整請求範例：

```bash
curl -X POST https://gateway.example.com/message \
  -H "Authorization: Bearer replace-with-gateway-token" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "私人 Gateway 測試"
  }'
```

約束：

- Header 名稱使用標準寫法 `Authorization`。
- Token 型必須是 `Bearer`。
- Token 最大長度為 4096 個字元。
- `PUSHGO_TOKEN` 為空時不啟用 Gateway 級 Token 驗證。

## 公共 Gateway

公共 Gateway 仍會驗證 Channel ID 和 Channel 密碼。快速上手範例預設只展示 Channel 授權。公共服務的額外存取策略可能隨營運配置調整；如果某個公共端點要求 Bearer Token，以該端點目前說明為準。

## 相容介面驗證

相容介面使用 `<channel_id>:<password>` 作為 `compat_key`。

| 來源 | key 放置位置 |
| :--- | :--- |
| ntfy | `/ntfy/{topic}`，其中 `{topic}` 是 `compat_key` |
| ServerChan | `/serverchan/{sendkey}`，其中 `{sendkey}` 是 `compat_key` |
| Bark v1 | `/bark/{device_key}/{body}`，其中 `{device_key}` 是 `compat_key` |
| Bark v2 | JSON 欄位 `device_key` |

範例：

```bash
curl -X POST https://gateway.pushgo.cn/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: 備份完成" \
  -d "NAS backup completed"
```

相容 key 包含 Channel 密碼，應按金鑰處理。

## MCP OAuth

MCP OAuth 模式下，AI 助理不應該在工具呼叫裡傳 Channel 密碼。推薦流程是：

1. MCP 用戶端連線 `https://gateway.example.com/mcp`。
2. 使用者開啟繫結連結。
3. 使用者輸入 Channel ID 和密碼並確認授權。
4. Gateway 給 MCP 用戶端發放受 scope 限制的 OAuth token。
5. 工具呼叫透過 OAuth 授權存取已繫結 Channel。

Legacy MCP 模式仍允許每次工具呼叫傳 `password`，但只適合個人或受信任環境。生產整合優先使用 OAuth。

## 安全建議

- Channel 密碼、相容 key 和 Gateway Token 都不要寫入公開倉庫。
- 生產環境必須使用 HTTPS。
- 公共 Gateway 範例不要硬編碼真實 Channel 密碼。
- 自我託管 Gateway 建議開啟 `PUSHGO_TOKEN`，並把 HTTP listener 放在反向代理之後。
- AI 助理整合優先使用 MCP OAuth，避免讓模型直接持有 Channel 密碼。
- 定期輪換 Channel 密碼和 Gateway Token；兩者不要設定成同一個值。