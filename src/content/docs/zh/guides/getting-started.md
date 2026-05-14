---
title: 快速上手
description: 从安装客户端到收到第一条 PushGo 通知的最短路径。
---

本指南适合第一次使用 PushGo 的读者。完成后，你会拥有一个可用频道，并能通过 HTTP API 发送第一条 Message。

## 准备工作

- 一台已安装 PushGo 客户端的设备。
- 一个可以运行 `curl` 的终端。
- 一个频道 ID 和频道密码。你可以在客户端里创建新频道，也可以订阅别人分享给你的频道。

## 1. 安装客户端

先安装一个已经对外发布的客户端。

| 平台 | 获取方式 | 系统要求 |
| :--- | :--- | :--- |
| iOS / macOS / watchOS | [App Store](https://apps.apple.com/app/pushgo) | iOS 18+、macOS 15+、watchOS 11+ |
| Android | [GitHub Releases](https://github.com/AldenClark/pushgo-android/releases) | Android 12+ |

## 2. 创建或订阅频道

频道是 PushGo 的发送边界。所有请求都会发往一个频道，所有订阅该频道的设备都会成为投递目标。

### 创建新频道

1. 打开客户端。
2. 点击新增入口。
3. 选择创建频道。
4. 输入一个容易识别的名称和 8-128 个字符的密码。
5. 保存生成的频道 ID 和密码。

### 订阅已有频道

1. 打开客户端。
2. 选择订阅频道。
3. 输入已有频道 ID 和密码。
4. 订阅成功后，这台设备会开始接收该频道的内容。

## 3. 选择公共网关

公共网关适合快速测试，不需要先部署服务器。

| 区域 | Gateway |
| :--- | :--- |
| 中国大陆 | `https://gateway.pushgo.cn` |
| Global | `https://gateway.pushgo.dev` |

选择离你和接收设备更近的区域。私有部署用户请把示例中的地址替换成自己的 Gateway 地址；如果启用了 `PUSHGO_TOKEN`，还需要加上 `Authorization: Bearer <token>`。

## 4. 发送第一条消息

```bash
curl -X POST https://gateway.pushgo.cn/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "来自 PushGo 的问候",
    "body": "这是一条测试通知。",
    "severity": "normal"
  }'
```

成功响应类似：

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "message_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` 表示 Gateway 接受了请求。`accepted=true` 表示 Gateway 已进入分发流程；系统通知展示仍由设备在线状态、系统推送服务和私有通道状态决定。

## 常见问题

| 现象 | 检查项 |
| :--- | :--- |
| 返回 `400` | 字段名是否拼错；`title`、`channel_id`、`password` 是否存在；请求体是否为 JSON。 |
| 返回 `401` | 私有 Gateway 是否启用了 `PUSHGO_TOKEN`；Bearer Token 是否正确。 |
| 返回 `404` | 频道 ID 是否正确；设备是否已经创建或订阅该频道。 |
| 返回 `success=true` 但没看到通知 | 设备通知权限、系统网络、Android 私有通道或 APNs/FCM 投递状态。 |
| 请求体过大 | 单次 JSON 请求最大 32KB，图片请传 URL，不要把二进制直接塞进 JSON。 |

更多状态码见 [限制与错误](/zh/reference/limits-errors/)。

## 下一步

- 想理解 PushGo 为什么有三类模型：阅读 [核心概念](/zh/guides/concepts/)。
- 想选择 Message、Event 或 Thing：阅读 [数据模型](/zh/guides/data-models/)。
- 想把脚本接入生产环境：阅读 [典型场景](/zh/guides/use-cases/)。
- 想部署自己的网关：阅读 [私有部署](/zh/guides/self-hosting/)。
