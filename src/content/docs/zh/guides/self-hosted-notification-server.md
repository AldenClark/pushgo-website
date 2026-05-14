---
title: 开源自托管通知服务器
description: 将 PushGo Gateway 部署为自托管通知服务器，支持私有通道、持久状态、E2EE 和 MCP/OAuth。
---

当你希望通知路径、数据存储、Gateway 鉴权、私有通道策略和 MCP/OAuth 入口都由自己控制时，可以私有部署 PushGo。

## 适合场景

- 为个人或团队自动化运行私有通知 Gateway。
- 避免通知、事件和实体状态经过公共 Gateway。
- 在自己的域名下暴露 HTTPS `/mcp` 端点。
- 把备份、反向代理、日志和可观测性纳入生产运维。

## PushGo 如何建模这个流程

| 需求 | 使用 | 原因 |
| :--- | :--- | :--- |
| 私有投递路径 | Gateway | 你的基础设施控制 HTTP API 和通道监听。 |
| 敏感字段 | E2EE | 客户端在本地解密敏感字段。 |
| AI 助手访问 | MCP OAuth | 用户通过公开 Gateway URL 绑定 Channel。 |

## 最小示例

启用 MCP/OAuth 前，先把 `PUSHGO_PUBLIC_BASE_URL` 设置为外部可访问的 HTTPS 根地址，否则 issuer 元数据和绑定链接可能包含内部地址。

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "来自 PushGo 的通知",
    "body": "自动化通知路径已经打通。"
  }'
```

## 本页直接回答的问题

- **PushGo 可以作为自托管通知服务器运行吗？** 可以。Gateway 面向私有部署设计，支持持久存储和可配置通道。
- **自托管后可以启用 MCP 吗？** 可以。配置外部 HTTPS 根地址后，私有 Gateway 可以开放 `/mcp` 和 OAuth 路由。
- **还需要备份吗？** 需要。Channel、设备、MCP 授权、Event 和 Thing 状态都依赖持久化存储。

## 安全与运维

- 高风险自动化应使用独立 Channel 和受限凭据。
- AI 助手应优先使用 MCP OAuth，避免模型直接持有 Channel 密码。
- 当数据路径、通道策略或合规边界必须自行控制时，使用私有部署。
- 敏感字段应使用 E2EE，让客户端本地解密。

## 下一步

- [私有部署](/zh/guides/self-hosting/)
- [端到端加密](/zh/reference/e2ee/)
- [MCP 参考](/zh/reference/mcp/)
