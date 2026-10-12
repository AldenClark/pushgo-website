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

也支持 Thing 作用域别名：

```http
POST /thing/{thing_id}/event/create
POST /thing/{thing_id}/event/update
POST /thing/{thing_id}/event/close
```

路径参数会提供 `thing_id`；如果请求体也包含 `thing_id`，两者必须一致。

请求体必须是 JSON。未知扩展字段会被忽略；动作明确禁止的已知字段仍会被拒绝。私有 Gateway 如果启用了 `PUSHGO_TOKEN`，还需要 `Authorization: Bearer <token>`。

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
| `password` | `string` | 是 | 频道密码；先 trim，再按 8-128 字节校验。 |
| `op_id` | `string` | 必须省略 | 由 Gateway 生成并返回；客户端传入会返回 `400 op_id_not_allowed`。 |
| `thing_id` | `string` | 否 | 将事件归入某个 Thing ID。Gateway 只校验格式，不要求服务端已存在 Thing 记录。 |
| `ciphertext` | `string` | 否 | 可选 E2EE 密文载荷。 |

## 路由级必填字段

| 路由 | 必填业务字段 |
| :--- | :--- |
| `/event/create` | `event_time` |
| `/event/update` | `event_id`、`event_time` |
| `/event/close` | `event_id`、`event_time` |

## 字段规则

| 字段 | 类型 | 规则 |
| :--- | :--- | :--- |
| `event_id` | `string` | update/close 必填；create 时不得传入；1-64 个字符，可用字母、数字、`_`、`:`、`-`。 |
| `title`、`description`、`status`、`message`、`severity` | `string` | 可选 patch 内容；1.3.0 不对 Event 套用 Message 的 severity 枚举限制。 |
| `event_time` | `number` 或数字字符串 | 必填；接受 Unix 秒或毫秒并归一化为毫秒。 |
| `started_at` | `number` 或数字字符串 | 可选且仅用于 create；未传入时不写入，也不会从 `event_time` 回填。 |
| `ended_at` | `number` 或数字字符串 | 可选且仅用于 close；未传入时不写入，也不会从 `event_time` 回填；create/update 会拒绝。 |
| `tags`、`images` | `string[]` | 可选 patch 内容；不继承 Message 的数量和长度限制。 |
| `attrs` | `object` | 可选 patch 内容。 |
| `metadata` | `object` | 自定义标量键值；key <= 64 字节，非空标量文本 <= 512 字节；拒绝嵌套对象、数组和 null。 |

create 禁止 `event_id`，所有 Event 动作均禁止客户端传入 `op_id`。未知字段会被忽略且不会生效。

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
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
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

统一成功 envelope 表示 Gateway 已持久受理，不代表提供商投递或设备展示成功。可用返回的 `op_id` 查询 `GET /send_status/{op_id}`。

## 常见错误

| 状态码 | 典型原因 |
| :--- | :--- |
| `400` | 路由级必填字段缺失、ID/时间/metadata 无效、传入 `op_id` 或动作禁止字段。 |
| `401` | 私有 Gateway Bearer Token 缺失或错误。 |
| `404` | 频道不存在或凭据不匹配。 |
| `413` | 请求体超过 32 KiB（32,768 字节）。 |
| `503` | Gateway 无法受理本次提交。 |
