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

请求体必须是 JSON。未知扩展字段会被忽略；动作明确禁止的已知字段仍会被拒绝。私有 Gateway 如果启用了 `PUSHGO_TOKEN`，还需要 `Authorization: Bearer <token>`。

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
| `password` | `string` | 是 | 频道密码；先 trim，再按 8-128 字节校验。 |
| `op_id` | `string` | 必须省略 | 由 Gateway 生成并返回；客户端传入会返回 `400 op_id_not_allowed`。 |
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
| `thing_id` | `string` | update/archive/delete 必填；create 时不得传入；1-64 个字符，可用字母、数字、`_`、`:`、`-`。 |
| `title`、`description` | `string` | 可选 patch 内容；创建时建议提供 `title`，但 Gateway 不因缺失而拒绝。 |
| `tags`、`images` | `string[]` | 可选 patch 内容；不继承 Message 的数量和长度限制。 |
| `primary_image`、`location_type`、`location_value` | `string` | 可选 patch 内容；1.3.0 不强制此前文档中的位置成对和格式规则。 |
| `created_at` | `number` 或数字字符串 | 可选且仅用于 create；未传入时不写入，也不会从 `observed_at` 回填。 |
| `deleted_at` | `number` 或数字字符串 | 可选且仅用于 delete；未传入时不写入，也不会从 `observed_at` 回填；create/update/archive 会拒绝。 |
| `observed_at` | `number` 或数字字符串 | 必填；接受 Unix 秒或毫秒并归一化为毫秒。 |
| `external_ids`、`attrs` | `object` | 可选 patch 内容；1.3.0 不强制此前文档中的结构限制。 |
| `metadata` | `object` | 自定义标量键值；key <= 64 字节，非空标量文本 <= 512 字节；拒绝嵌套对象、数组和 null。 |

create 禁止 `thing_id`；所有动作禁止客户端传入 `state` 和 `op_id`；`deleted_at` 仅用于 delete。未知字段会被忽略且不会生效。

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
    "op_id": "00191f23cc000-0123456789abcdef0123456789abcdef",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1"
  }
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

统一成功 envelope 表示 Gateway 已持久受理，不代表提供商投递或设备展示成功。可用返回的 `op_id` 查询 `GET /send_status/{op_id}`。

## 常见错误

| 状态码 | 典型原因 |
| :--- | :--- |
| `400` | 路由级必填字段缺失、ID/时间/metadata 无效、传入 `op_id` 或动作禁止字段。 |
| `401` | 私有 Gateway Bearer Token 缺失或错误。 |
| `404` | 频道不存在或凭据不匹配。 |
| `413` | 请求体超过 32 KiB（32,768 字节）。 |
| `503` | Gateway 无法受理本次提交。 |
