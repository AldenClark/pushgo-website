---
title: 实体 API (Thing)
description: 使用 /thing/create、/thing/update、/thing/archive 和 /thing/delete 管理长期实体状态。
---

Thing API 用于表达长期存在并反复更新的对象，例如服务器、房间、传感器、网络服务或长期任务。创建实体后，Gateway 返回 `thing_id`；后续更新、归档和删除都通过这个 ID 关联到同一个对象。

## Endpoints

```http
POST /thing/create
POST /thing/update
POST /thing/archive
POST /thing/delete
```

请求体必须是 JSON，未声明字段会被严格拒绝。私有 Gateway 如果启用了 `PUSHGO_TOKEN`，还需要 `Authorization: Bearer <token>`。

## 请求头

| Header | 必填 | 说明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 是 | 请求体格式。 |
| `Authorization: Bearer <token>` | 视网关配置而定 | 仅私有 Gateway 开启 `PUSHGO_TOKEN` 时必填。 |

## 生命周期

```text
/thing/create -> thing_id
      |
      +-> /thing/update   可调用多次
      |
      +-> /thing/archive  归档但保留历史
      |
      +-> /thing/delete   删除或退役
```

## 通用字段

| 字段 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 是 | 目标频道 ID。 |
| `password` | `string` | 是 | 频道密码，通常 8-128 个字符。 |
| `op_id` | `string` | 否 | 幂等键；不传则网关自动生成并在响应中返回。 |
| `ciphertext` | `string` | 否 | 可选 E2EE 密文载荷。 |

## 路由级必填字段

| 路由 | 必填业务字段 |
| :--- | :--- |
| `/thing/create` | `observed_at` |
| `/thing/update` | `thing_id`、`observed_at` |
| `/thing/archive` | `thing_id`、`observed_at` |
| `/thing/delete` | `thing_id`、`observed_at` |

## 字段规则

| 字段 | 类型 | 规则 |
| :--- | :--- | :--- |
| `thing_id` | `string` | 更新、归档和删除必填；创建时不能传，由 Gateway 生成。 |
| `title` | `string` | 创建时建议传；当前 Gateway 不因缺失 `title` 拒绝创建。 |
| `description` | `string` | 可选；空字符串按缺省处理。 |
| `tags` | `string[]` | 最多 32 项，每项最多 64 字符，trim 后去重。 |
| `primary_image` | `string` | 可选 URL，最大 2048 字符。 |
| `images` | `string[]` | 最多 32 项，每项最多 2048 字符，trim 后去重。 |
| `created_at` | `number` | 仅 create 允许；不传时回退为 `observed_at`。 |
| `deleted_at` | `number` | 仅 delete 允许；不传时回退为 `observed_at`。 |
| `observed_at` | `number` | 必填；本次状态观测时间，Unix 毫秒时间戳。 |
| `external_ids` | `object` | key 仅允许 `[A-Za-z0-9_:.\-]`，key <= 64；value 仅 `string` 或 `null`。 |
| `location_type` + `location_value` | `string` + `string` | 必须成对出现；`location_type` 仅允许 `physical`、`geo`、`cloud`、`datacenter`、`logical`。 |
| `attrs` | `object` | 对象补丁；value 为 `null` 表示删键；不允许数组；对象嵌套仅支持一层。 |
| `metadata` | `object` | 仅支持标量值；key <= 64，value <= 512。 |

## 创建实体

```bash
curl -X POST https://gateway.pushgo.cn/thing/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "家庭 NAS",
    "description": "客厅机柜中的主存储",
    "observed_at": 1713750000000,
    "tags": ["nas", "home"],
    "location_type": "physical",
    "location_value": "home/living-room",
    "attrs": {
      "online": true,
      "disk_used": 0.72,
      "temperature": 43.2
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
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

保存返回的 `thing_id`，后续更新、归档和删除都需要它。

## 更新实体

```bash
curl -X POST https://gateway.pushgo.cn/thing/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713750600000,
    "attrs": {
      "disk_used": 0.74,
      "temperature": 44.1
    }
  }'
```

`attrs` 是补丁，不需要每次都传完整状态。要删除某个键，可以传 `null`。

```json
{
  "attrs": {
    "temporary_alarm": null
  }
}
```

## 归档实体

归档适合“不再活跃，但仍希望保留历史”的对象。

```bash
curl -X POST https://gateway.pushgo.cn/thing/archive \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751200000,
    "attrs": {
      "online": false
    }
  }'
```

## 删除实体

删除或退役实体时使用 `/thing/delete`。

```bash
curl -X POST https://gateway.pushgo.cn/thing/delete \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751800000,
    "deleted_at": 1713751800000
  }'
```

## 关联 Message 和 Event

Thing 表示长期对象。相关告警可以用 Message 关联到 `thing_id`，相关过程可以用 Event 关联到 `thing_id`。

| 场景 | 推荐建模 |
| :--- | :--- |
| NAS 当前 CPU、温度、磁盘使用率 | Thing |
| NAS 磁盘快满的一次提醒 | Message + `thing_id` |
| NAS 备份从开始到完成 | Event + `thing_id` |

## 响应语义

Thing API 响应同样使用统一 envelope。`accepted=true` 表示 Gateway 已进入分发流程，不保证所有设备都已经展示系统通知。

## 常见错误

| 状态码 | 典型原因 |
| :--- | :--- |
| `400` | 缺少 `observed_at`、传了未知字段、`attrs` 或 `external_ids` 格式不合法。 |
| `401` | 私有 Gateway Bearer Token 缺失或错误。 |
| `404` | 频道或 `thing_id` 不存在。 |
| `413` | 请求体超过 32KB。 |
| `503` | 分发未完整成功。 |
