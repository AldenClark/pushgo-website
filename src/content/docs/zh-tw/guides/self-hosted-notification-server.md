---
title: 開源自託管通知伺服器
description: 將 PushGo Gateway 部署為自託管通知伺服器，支援私人通道、持久狀態、E2EE 和 MCP/OAuth。
---

當你希望通知路徑、資料儲存、Gateway 驗證、私人通道策略和 MCP/OAuth 入口都由自己控制時，可以私人部署 PushGo。

## 適合場景

- 為個人或團隊自動化執行私人通知 Gateway。
- 避免通知、事件和實體狀態經過公共 Gateway。
- 在自己的網域下暴露 HTTPS `/mcp` 端點。
- 把備份、反向代理、日誌和可觀測性納入生產維運。

## PushGo 如何建模這個流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 私人投遞路徑 | Gateway | 你的基礎設施控制 HTTP API 和通道監聽。 |
| 敏感欄位 | E2EE | 用戶端在本機解密敏感欄位。 |
| AI 助理存取 | MCP OAuth | 使用者透過公開 Gateway URL 綁定 Channel。 |

## 最小範例

啟用 MCP/OAuth 前，先把 `PUSHGO_PUBLIC_BASE_URL` 設定為外部可存取的 HTTPS 根位址，否則 issuer 中繼資料和綁定連結可能包含內部位址。

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

- **PushGo 可以作為自託管通知伺服器執行嗎？** 可以。Gateway 面向私人部署設計，支援持久儲存和可設定通道。
- **自託管後可以啟用 MCP 嗎？** 可以。設定外部 HTTPS 根位址後，私人 Gateway 可以開放 `/mcp` 和 OAuth 路由。
- **還需要備份嗎？** 需要。Channel、裝置、MCP 授權、Event 和 Thing 狀態都依賴持久化儲存。

## 安全與維運

- 高風險自動化應使用獨立 Channel 和受限憑據。
- AI 助理應優先使用 MCP OAuth，避免模型直接持有 Channel 密碼。
- 當資料路徑、通道策略或合規邊界必須自行控制時，使用私人部署。
- 敏感欄位應使用 E2EE，讓用戶端本機解密。

## 下一步

- [私人部署](/zh-tw/guides/self-hosting/)
- [端對端加密](/zh-tw/reference/e2ee/)
- [MCP 參考](/zh-tw/reference/mcp/)
