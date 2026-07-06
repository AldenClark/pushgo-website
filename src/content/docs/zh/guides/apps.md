---
title: App 介绍与平台支持
description: 了解 PushGo 已发布客户端、系统要求和不同平台的投递能力。
---

PushGo 目前对外发布 Apple 平台客户端、Android 客户端和 Gateway。官网只描述已经可用的公开发布内容；未发布平台不会列为可下载或可用客户端。

## 平台概览

| 平台 | 获取方式 | 系统要求 | 主要投递路径 | 私有通道 |
| :--- | :--- | :--- | :--- | :--- |
| iOS | App Store | iOS 18+ | APNs | 否 |
| macOS | App Store | macOS 15+ | APNs | 否 |
| watchOS | App Store | watchOS 11+ | APNs | 否 |
| Android | GitHub Releases | Android 9+ | FCM + 私有通道 | 是，支持 QUIC / Raw TCP / WSS |

## Apple 平台客户端

Apple 平台客户端遵循系统推送模型，由 APNs 负责后台投递。

适合：

- iPhone、Mac 和 Apple Watch 上接收个人通知。
- 使用系统通知优先级和通知扩展处理富内容。
- 希望客户端尽量贴近系统行为，而不是维持长期后台连接。

注意：

- Apple 平台不使用 PushGo Android 私有通道。
- 后台投递可靠性由 APNs、系统通知权限、专注模式和设备网络共同决定。
- E2EE 字段在客户端本地配置密钥后解密；未配置或解密失败时会保留原始展示状态。

## Android 客户端

Android 客户端同时支持厂商通道和 PushGo 私有通道。

适合：

- 需要更低延迟的状态同步。
- 自托管 Gateway，并希望让设备直连自己的同步入口。
- 使用 FCM 做后台唤醒，同时在活跃同步时走私有链路。

私有通道会根据 Gateway profile 和网络环境选择可用传输：

| 传输 | 适用场景 |
| :--- | :--- |
| WSS | 最通用，复用 HTTPS 入口，最适合作为默认启用项。 |
| QUIC | 延迟低，适合能开放 UDP 端口的部署。 |
| Raw TCP | 适合受控网络或有专门四层入口的部署。 |

私有通道需要 Gateway 明确启用对应传输，并正确配置证书、端口和外部可访问地址。部署细节见 [私有部署](/zh/guides/self-hosting/)。

## Gateway

Gateway 是 PushGo 的服务端组件，负责：

- 校验频道密码和可选的网关 Bearer Token。
- 受理 Message、Event 和 Thing 请求。
- 维护事件和实体状态。
- 通过 APNs、FCM 或 Android 私有通道分发内容。
- 可选开启 MCP/OAuth，让 AI 助手在授权频道内调用 PushGo 工具。

你可以直接使用公共 Gateway，也可以自托管 Gateway，把数据面、鉴权策略和运维能力控制在自己的基础设施里。

## 能力差异

| 能力 | Apple | Android | Gateway |
| :--- | :--- | :--- | :--- |
| 接收 Message | 是 | 是 | 负责分发 |
| 展示 Event / Thing | 是 | 是 | 负责状态写入和分发 |
| E2EE 字段解密 | 是 | 是 | 仅透传密文 |
| 私有通道 | 否 | 是 | 需要自托管或配置可用入口 |
| MCP/OAuth | 不适用 | 不适用 | 可选启用 |

如果你只是想开始接收通知，先安装客户端并完成 [快速上手](/zh/guides/getting-started/)。如果你要控制数据路径和私有通道，再继续阅读私有部署文档。
