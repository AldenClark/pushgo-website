---
title: 简介
description: 了解 PushGo 是什么、适合谁，以及应该从哪里开始。
---

**PushGo** 是一个面向个人自动化、服务器/NAS 监控、DevOps、IoT 和 AI 助手工作流的开源通知与状态同步系统。它由客户端、Gateway 和一组 HTTP API 组成，可以直接使用公共网关，也可以部署到自己的基础设施。

## PushGo 解决什么问题

很多通知工具只处理“一段文本发到手机”。这在简单提醒里足够，但一旦你要表达任务进度、故障生命周期、设备状态或 AI 助手动作，就会变得混乱。

PushGo 把数据分成三类：

| 模型 | 用途 | 例子 |
| :--- | :--- | :--- |
| Message | 一次性提醒 | 备份完成、磁盘快满、价格下降 |
| Event | 可更新并最终结束的过程 | 部署流程、故障处理、门窗打开到关闭 |
| Thing | 长期存在的实体状态 | NAS、传感器、房间、网络服务 |

这样做的好处是：提醒是提醒，过程是过程，状态是状态。客户端和自动化脚本都能更稳定地理解这些数据。

## 系统组成

```text
脚本 / 服务 / AI 助手
        |
        v
PushGo Gateway
        |
        +-- APNs -> Apple 平台客户端
        +-- FCM  -> Android 客户端
        +-- 私有通道 -> Android 低延迟同步
```

Gateway 负责鉴权、受理 API、维护状态并分发到已订阅设备。客户端负责接收、展示、解密和管理频道。

## 适合谁

- 个人用户：把脚本、Webhook、价格监控、下载任务推送到手机。
- 家庭服务器和 NAS 用户：监控磁盘、备份、UPS、服务在线状态。
- DevOps 用户：跟踪部署、构建、故障和服务健康状态。
- IoT / Home Assistant 用户：同步房间、传感器和安全事件。
- 自托管用户：在自己的 Gateway 上控制数据、鉴权、私有通道和 MCP/OAuth。

## 从哪里开始

| 目标 | 推荐阅读 |
| :--- | :--- |
| 收到第一条通知 | [快速上手](/zh/guides/getting-started/) |
| 理解系统工作方式 | [核心概念](/zh/guides/concepts/) |
| 选择正确数据模型 | [数据模型](/zh/guides/data-models/) |
| 看实际集成案例 | [典型场景](/zh/guides/use-cases/) |
| 从 ntfy、Bark 或 ServerChan 迁移 | [迁移指南](/zh/guides/migration/) |
| 部署自己的 Gateway | [私有部署](/zh/guides/self-hosting/) |
| 接入 AI 助手 | [MCP 参考](/zh/reference/mcp/) |

如果你还没有频道，先从快速上手开始；如果你已经有脚本要接入，先看数据模型和 Message API。
