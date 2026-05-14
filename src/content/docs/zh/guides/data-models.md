---
title: 数据模型
description: 判断什么时候使用 Message、Event 或 Thing，并理解它们的字段边界。
---

PushGo 的三类数据模型对应三种不同的业务语义。选对模型之后，客户端展示、历史记录、状态合并和后续自动化都会更清楚。

## 选择矩阵

| 你想表达的是 | 应使用 | 原因 |
| :--- | :--- | :--- |
| “发生了一件事，提醒我一下” | Message | 没有持续状态，发送后独立存在。 |
| “一件事从开始到结束，中间可能多次变化” | Event | 同一个 `event_id` 可以多次更新，最后关闭。 |
| “一个设备、服务、房间或任务的当前状态” | Thing | 同一个 `thing_id` 可以长期更新属性。 |
| “某个实体上发生了一次告警” | Thing + Message | Thing 表示实体，Message 关联 `thing_id` 表示本次提醒。 |
| “某个实体正在经历一个过程” | Thing + Event | Thing 表示对象，Event 关联 `thing_id` 表示过程。 |

## Message：一次性提醒

Message 是最直接的通知模型。它适合不需要后续合并或关闭的内容。

### 适合

- 磁盘空间超过阈值。
- 备份任务已经完成。
- 价格监控发现降价。
- 摄像头检测到一次运动并附带截图。

### 不适合

- 部署任务的开始、构建、发布、完成全过程。
- 服务器、传感器、房间等长期对象的最新状态。
- 需要不断覆盖当前值的监控面板。

### 字段分组

| 分组 | 字段 |
| :--- | :--- |
| 认证与路由 | `channel_id`、`password`、`op_id`、`thing_id` |
| 展示内容 | `title`、`body`、`severity`、`url`、`images`、`tags` |
| 时效与安全 | `occurred_at`、`ttl`、`ciphertext` |
| 扩展数据 | `metadata` |

### 最小示例

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "备份完成",
  "body": "NAS 每日备份已经完成。",
  "severity": "normal"
}
```

## Event：可更新的生命周期

Event 表示一个过程，而不是一条孤立通知。创建后会得到 `event_id`，后续更新和关闭都围绕这个 ID 进行。

### 适合

- CI/CD 部署：开始、构建、发布、完成或失败。
- 故障处理：发现异常、排查中、已恢复。
- 门窗状态：打开后持续提醒，关闭时结束。
- 长任务：视频转码、数据同步、模型训练。

### 生命周期

```text
/event/create -> event_id
      |
      +-> /event/update  可调用多次
      |
      +-> /event/close   结束事件
```

### 字段分组

| 分组 | 字段 |
| :--- | :--- |
| 认证与路由 | `channel_id`、`password`、`op_id`、`thing_id` |
| 生命周期 | `event_id`、`event_time`、`started_at`、`ended_at` |
| 展示内容 | `title`、`description`、`status`、`message`、`severity`、`tags`、`images` |
| 扩展数据 | `attrs`、`metadata`、`ciphertext` |

### 建模建议

- `status` 用短状态，例如 `running`、`degraded`、`success`、`failed`。
- `message` 写本次变化，例如“镜像推送完成”。
- `event_time` 表示本次变化发生的时间。
- `started_at` 表示整个事件的开始时间，只在创建时需要。
- `ended_at` 表示整个事件的结束时间，只在关闭时需要。

## Thing：长期实体状态

Thing 表示一个长期存在的对象。它的价值在于“同一个对象被反复更新”，而不是每次都产生一个新通知对象。

### 适合

- 家庭 NAS、服务器、网络服务。
- 房间、传感器、摄像头、门锁。
- 长期任务或资产。
- 需要显示当前状态的面板。

### 生命周期

```text
/thing/create -> thing_id
      |
      +-> /thing/update   可调用多次
      |
      +-> /thing/archive  不再活跃但保留历史
      |
      +-> /thing/delete   删除或退役
```

### 字段分组

| 分组 | 字段 |
| :--- | :--- |
| 认证与路由 | `channel_id`、`password`、`op_id` |
| 身份与展示 | `thing_id`、`title`、`description`、`tags`、`primary_image`、`images` |
| 时间 | `created_at`、`observed_at`、`deleted_at` |
| 位置与外部系统 | `external_ids`、`location_type`、`location_value` |
| 状态数据 | `attrs`、`metadata`、`ciphertext` |

### 建模建议

- `title` 写人能识别的名字，例如“家庭 NAS”。
- `attrs` 写会变化的状态，例如 CPU、温度、在线状态。
- `metadata` 写不常参与展示的辅助信息，例如来源系统或版本。
- `external_ids` 用来关联外部系统的 ID，例如 Home Assistant entity ID。

## 组合使用

PushGo 的三类模型可以组合。

| 组合 | 用法 |
| :--- | :--- |
| Thing + Message | “家庭 NAS”这个实体上发生了一次“磁盘快满”提醒。 |
| Thing + Event | “生产数据库”这个实体正在经历一次“主从延迟”事件。 |
| Event + Message | Event 记录完整过程，Message 用于某个关键节点的强提醒。 |

如果你不确定该选哪个，先从 Message 开始；当你发现同一个脚本在反复发送“开始/更新/结束”或“当前值变化”时，再升级为 Event 或 Thing。
