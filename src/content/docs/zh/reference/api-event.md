---
title: 事件 API (Event)
description: 使用 /event/create、/event/update 和 /event/close 表达可更新的生命周期。
---

Event API 用于表达一个会持续变化并最终结束的过程。创建事件后，Gateway 返回 `event_id`；后续更新和关闭都通过这个 ID 关联到同一条生命周期。

## Endpoints

```http
POST /event/create
POST /event/update
POST /event/close
```

请求体必须是 JSON，未声明字段会被严格拒绝。私有 Gateway 如果启用了 `PUSHGO_TOKEN`，还需要 `Authorization: Bearer <token>`。

## 请求头

| Header | 必填 | 说明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 请求体格式。 |
| `Authorization: Bearer <token>` | 视网关配置而定 | 仅私有 Gateway 开启 `PUSHGO_TOKEN` 时必填。 |

## 生命周期

```text
/event/create -> event_id
      |
      +-> /event/update  可调用多次
      |
      +-> /event/close   标记结束
```

## 通用字段

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 是 | 目标频道 ID。 |
| `password` | `string` | 是 | 频道密码，通常 8-128 个字符。 |
| `op_id` | `string` | 否 | 幂等键；不传则网关自动生成并在响应中返回。 |
| `thing_id` | `string` | 否 | 关联到已有 Thing，仅作用于本次事件分发和上下文。 |
| `ciphertext` | `string` | 否 | 可选 E2EE 密文载荷。 |

## 路由级必填字段

| 路由 | 必填业务字段 |
| :--- | :--- |
| `/event/create` | `title`、`status`、`message`、`severity`、`event_time` |
| `/event/update` | `event_id`、`status`、`message`、`severity`、`event_time` |
| `/event/close` | `event_id`、`status`、`message`、`severity`、`event_time` |

## 字段规则

| 字段 | 类型 | 规则 |
| :--- | :--- | :--- |
| `event_id` | `string` | update/close 必填；create 时不得传入；1-64 个字符，可用字母、数字、`_`、`:`、`-`。 |
| `title` | `string` | 创建必填；更新和关闭可选。 |
| `description` | `string` | 可选；空字符串按缺省处理。 |
| `status` | `string` | 必填；非空，最大 24 字符。 |
| `message` | `string` | 必填；非空，最大 512 字符。 |
| `severity` | `string` | 必填；仅允许 `critical`、`high`、`normal`、`low`。 |
| `event_time` | `number` | 必填；本次更新发生时间；接受 Unix 秒或毫秒，并归一化为毫秒。 |
| `started_at` | `number` | 仅 create；省略时默认为 `event_time`，update/close 会拒绝。 |
| `ended_at` | `number` | 仅 close；省略时默认为 `event_time`，create/update 会拒绝。 |
| `tags` | `string[]` | 最多 32 项，每项最多 64 字符，trim 后去重。 |
| `images` | `string[]` | 最多 32 项，每项最多 2048 字符，trim 后去重。 |
| `attrs` | `object` | 对象补丁；value 为 `null` 表示删键；不允许数组。 |
| `metadata` | `object` | 否 | 自定义标量键值；key <= 64，非空标量 value <= 512；拒绝嵌套对象和数组。 |

## 创建事件

```bash
curl -X POST https://gateway.pushgo.cn/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "生产环境部署",
    "status": "running",
    "message": "部署任务已开始",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000,
    "attrs": {
      "service": "api",
      "revision": "8f3c2a1"
    }
  }'
```

响应：

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

保存返回的 `event_id`，后续更新和关闭都需要它。

## 更新事件

```bash
curl -X POST https://gateway.pushgo.cn/event/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "publishing",
    "message": "镜像已推送，正在发布",
    "severity": "normal",
    "event_time": 1713750300000,
    "attrs": {
      "progress": 0.75
    }
  }'
```

`/event/update` 可以调用多次。每次更新都应该描述本次变化，而不是重复整段历史。

## 关闭事件

```bash
curl -X POST https://gateway.pushgo.cn/event/close \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "success",
    "message": "生产环境部署完成",
    "severity": "normal",
    "event_time": 1713750600000,
    "ended_at": 1713750600000,
    "attrs": {
      "progress": 1
    }
  }'
```

失败事件可以使用 `status=failed` 并提高 `severity`。

## 关联 Thing

如果事件发生在某个长期实体上，传入 `thing_id`。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
  "title": "数据库延迟",
  "status": "open",
  "message": "从库延迟超过 30 秒",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000
}
```

Thing 表示“哪个对象”，Event 表示“这个对象正在经历什么过程”。

## 响应语义

Event API 响应同样使用统一 envelope。`accepted=true` 表示 Gateway 已进入分发流程，不保证所有设备都已经展示系统通知。

## 常见错误

| 状态码 | 典型原因 |
| :--- | :--- |
| `400` | 缺少路由级必填字段、传了未知字段、`severity` 不合法、`attrs` 不是对象补丁。 |
| `401` | 私有 Gateway Bearer Token 缺失或错误。 |
| `404` | 频道或 `event_id` 不存在。 |
| `413` | 请求体超过 32KB。 |
| `503` | 分发未完整成功。 |
