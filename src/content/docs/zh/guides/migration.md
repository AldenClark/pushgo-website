---
title: 迁移现有推送脚本
description: 从 ntfy、Bark、ServerChan 或普通 Webhook 迁移到 PushGo。
---

迁移到 PushGo 不需要一次性重写所有脚本。推荐分两步：先用兼容接口保持脚本继续工作，再把重要场景逐步升级为原生 Message、Event 或 Thing。

## 推荐路径

1. **改 endpoint**：把原来的 ntfy、Bark 或 ServerChan 请求改到 PushGo 兼容入口。
2. **替换 key**：使用 `<channel_id>:<password>` 作为兼容 key。
3. **清理字段**：把 priority、level、group、icon 等字段整理为 `severity`、`tags`、`images` 或 `metadata`。
4. **升级模型**：一次性提醒保留 Message；有生命周期的流程升级为 Event；长期状态升级为 Thing。

## 兼容接口

| 来源 | 方法 | PushGo 路径 | 兼容 key 位置 |
| :--- | :--- | :--- | :--- |
| ntfy | `POST` / `PUT` | `/ntfy/{topic}` | `{topic}` = `<channel_id>:<password>` |
| ServerChan | `GET` / `POST` | `/serverchan/{sendkey}` | `{sendkey}` = `<channel_id>:<password>` |
| Bark v1 | `GET` | `/bark/{device_key}/{body}` | `{device_key}` = `<channel_id>:<password>` |
| Bark v2 | `POST` | `/bark/push` | JSON 字段 `device_key` |

兼容接口的目标是降低迁移成本，不是覆盖 PushGo 的完整数据模型。如果你需要 `thing_id`、Event 生命周期或完整 Thing 状态，请使用原生 API。

## 从 ntfy 迁移

原来可能是：

```bash
curl -d "NAS backup completed" https://ntfy.example.com/my-topic
```

迁移到 PushGo 兼容入口：

```bash
curl -X POST https://gateway.pushgo.cn/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: 备份完成" \
  -H "Priority: 3" \
  -d "NAS backup completed"
```

升级为原生 Message：

```bash
curl -X POST https://gateway.pushgo.cn/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "备份完成",
    "body": "NAS 备份任务已经完成。",
    "severity": "normal",
    "tags": ["nas", "backup"]
  }'
```

## 从 Bark 迁移

Bark 常见用法是把 device key 放进路径。迁移时把 device key 换成 `<channel_id>:<password>`。

```bash
curl "https://gateway.pushgo.cn/bark/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD/服务器告警?title=CPU%20High&level=timeSensitive"
```

如果你已经在使用 JSON 请求，建议直接改成原生 Message。原生 API 对 `images`、`tags`、`metadata`、`thing_id` 和 E2EE 更清晰。

## 从 ServerChan 迁移

```bash
curl -X POST https://gateway.pushgo.cn/serverchan/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -d "title=部署完成" \
  -d "desp=生产环境部署成功"
```

ServerChan 更偏一次性提醒。如果你的脚本现在会连续发送“开始”“进行中”“结束”，建议直接升级为 Event。

## 什么时候升级为 Event

如果同一个任务会发送多条阶段性消息，Event 更合适。

| 旧脚本行为 | Event 表达 |
| :--- | :--- |
| 发送“部署开始” | `/event/create` |
| 发送“构建完成”“发布中” | `/event/update` |
| 发送“部署成功/失败” | `/event/close` |

这样客户端可以展示同一个事件的完整时间轴，而不是多条互不相关的 Message。

## 什么时候升级为 Thing

如果你的脚本反复推送同一个对象的当前状态，Thing 更合适。

| 旧脚本行为 | Thing 表达 |
| :--- | :--- |
| 每分钟发送 CPU/内存 | `/thing/update` 更新 `attrs` |
| 每次发送房间温湿度 | 一个房间或传感器一个 `thing_id` |
| 服务上线/下线反复提醒 | Thing 表示服务，Message 或 Event 表示异常 |

## 兼容接口限制

- 兼容 key 含有频道密码，不要写入公开日志。
- ntfy 兼容入口不支持 `thing_id`。
- 兼容接口无法完整表达 Thing 生命周期。
- 不同服务的优先级和字段名会被映射，无法保证所有原服务字段一一保留。
- 复杂 metadata、E2EE 和实体关联建议迁移到原生 API 后再使用。
