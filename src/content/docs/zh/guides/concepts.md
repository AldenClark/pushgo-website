---
title: 核心概念
description: 用一套清晰的心智模型理解 PushGo 的频道、网关、客户端和三类数据。
---

PushGo 可以简单理解为一条从你的脚本、服务或设备，到你已订阅客户端的同步链路。它不是只把一段文字转成系统通知；它还会保留事件生命周期和实体状态，让后续查看、筛选和自动化更有结构。

## 一句话模型

```text
发送方 -> Gateway -> Channel -> 已订阅设备
                    |
                    +-> Message / Event / Thing
```

- **发送方**：你的脚本、服务器、Home Assistant、CI/CD 或 AI 助手。
- **Gateway**：校验请求、写入状态、选择投递路径，并把数据下发给设备。
- **Channel**：一组设备共同订阅的通信空间。发送请求必须知道频道 ID 和频道密码。
- **客户端**：Apple 平台客户端通过 APNs 接收，Android 客户端可同时使用 FCM 和私有通道。
- **数据模型**：PushGo 把一次性提醒、生命周期过程和持久状态分成三类对象。

## Channel：权限和订阅边界

Channel 是 PushGo 的基本边界。一个频道可以被多台设备订阅，也可以被多个发送方使用。

| 概念 | 作用 |
| :--- | :--- |
| `channel_id` | 频道标识，决定请求发往哪里。 |
| `password` | 频道密码，决定发送方是否有权向该频道写入。 |
| 订阅设备 | 会收到该频道内被 Gateway 受理的内容。 |

频道密码不是网关管理员密码。公共网关和私有网关都仍然需要频道级授权；私有网关还可以额外开启网关级 Bearer Token。

## Gateway：受理、状态和投递

Gateway 收到请求后会做三件事：

1. 校验请求格式、频道授权和可选的网关 Bearer Token。
2. 为 Message、Event 或 Thing 生成或更新服务端状态。
3. 通过 APNs、FCM 或 Android 私有通道投递到订阅设备。

HTTP API 返回的是“网关是否受理”。真正的系统通知下发是异步过程，因此响应里的 `accepted` 表示 Gateway 已经进入分发流程，不等同于每台设备都已经展示通知。

## 三类数据模型

PushGo 的关键不是“通知字段很多”，而是用不同模型表达不同业务对象。

| 模型 | 适合表达 | 典型例子 | 主要 API |
| :--- | :--- | :--- | :--- |
| Message | 一次性提醒 | 磁盘快满、备份完成、价格下降 | `POST /message` |
| Event | 有开始、更新和结束的过程 | 部署流程、故障处理、门窗打开到关闭 | `/event/create`、`/event/update`、`/event/close` |
| Thing | 长期存在并反复更新的实体 | NAS、传感器、房间、网络服务 | `/thing/create`、`/thing/update`、`/thing/archive`、`/thing/delete` |

选择模型时先问一个问题：你是在通知一件事，记录一个过程，还是同步一个对象的当前状态？

## 投递路径

PushGo 不要求各客户端使用同一条后台连接。

| 平台 | 主要投递路径 | 说明 |
| :--- | :--- | :--- |
| Apple 平台 | APNs | 由系统负责后台投递，适合 iOS、macOS 和 watchOS。 |
| Android | FCM + 私有通道 | FCM 用于后台唤醒，私有通道用于更低延迟的同步。 |
| 自托管 Gateway | 由部署配置决定 | 可开启 WSS、QUIC、Raw TCP 等 Android 私有通道。 |

客户端支持能力见 [App 介绍与平台支持](/zh/guides/apps/)。

## 安全层次

PushGo 的安全边界分为几层：

| 层次 | 解决什么问题 |
| :--- | :--- |
| 频道密码 | 防止未经授权的发送方向频道写入。 |
| Gateway Bearer Token | 私有部署时限制谁能调用整个 Gateway。 |
| HTTPS / TLS | 保护传输过程中的请求和凭据。 |
| E2EE `ciphertext` | 让客户端本地解密敏感业务字段，Gateway 只透传密文。 |
| MCP OAuth | 让 AI 助手在用户授权的频道范围内调用工具，而不是直接拿到频道密码。 |

如果你只是发送第一条测试通知，先理解 Channel 和 Message 即可。需要建模长期状态或部署自己的网关时，再继续阅读数据模型、认证和私有部署文档。
