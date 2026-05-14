---
title: 典型场景
description: 通过可直接套用的场景理解 PushGo 的 Message、Event 和 Thing。
---

本页不是功能清单，而是建模手册。每个场景都会说明应该用哪种模型，以及为什么这样比单纯发送一条文本通知更清晰。

## 服务器与 NAS

### 磁盘空间告警：Message

磁盘超过阈值时，只需要一次强提醒，用 Message 最合适。

```bash
USAGE=$(df / | awk 'NR==2 { gsub("%", "", $5); print $5 }')

if [ "$USAGE" -ge 90 ]; then
  curl -X POST https://gateway.pushgo.cn/message \
    -H "Content-Type: application/json" \
    -d '{
      "channel_id": "YOUR_CHANNEL_ID",
      "password": "YOUR_CHANNEL_PASSWORD",
      "title": "磁盘空间预警",
      "body": "根分区使用率已达到 '"$USAGE"'%。",
      "severity": "high",
      "tags": ["nas", "disk"]
    }'
fi
```

### 备份任务：Event

备份有开始、进度和结果。用 Event 可以把多次状态变化合并成一个生命周期。

```bash
CREATE_RESPONSE=$(curl -s -X POST https://gateway.pushgo.cn/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "NAS 备份",
    "status": "running",
    "message": "备份任务已开始",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000
  }')
```

后续脚本保存返回的 `event_id`，在上传、校验、完成或失败时调用 `/event/update` 和 `/event/close`。

### 主机状态面板：Thing

如果你希望长期看到某台服务器的当前状态，用 Thing 表示主机本身。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "家庭 NAS",
  "observed_at": 1713750000000,
  "tags": ["nas", "home"],
  "attrs": {
    "online": true,
    "cpu": 0.18,
    "disk_used": 0.72,
    "temperature": 43.2
  }
}
```

## Home Assistant 与 IoT

### 房间或传感器：Thing

温度、湿度、照度这类数据是持续状态。建议把每个房间或设备建成 Thing，然后定期更新 `attrs`。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "客厅环境",
  "observed_at": 1713750000000,
  "external_ids": {
    "home_assistant": "sensor.living_room_temperature"
  },
  "location_type": "physical",
  "location_value": "home/living-room",
  "attrs": {
    "temperature": 22.5,
    "humidity": 0.46
  }
}
```

### 门窗打开到关闭：Event

门窗打开不是一个长期实体的全部状态，而是一段过程。创建 Event，门关闭时 close。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "阳台门打开",
  "status": "open",
  "message": "阳台门已打开超过 5 分钟",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "tags": ["home", "door"]
}
```

### 带截图的运动检测：Message

摄像头检测到一次运动并附带快照，用 Message 即可。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "检测到运动",
  "body": "玄关摄像头检测到运动。",
  "severity": "high",
  "images": ["https://example.com/snapshot.jpg"],
  "tags": ["camera", "security"]
}
```

## DevOps 和自动化流程

### 部署流水线：Event

部署任务天然有生命周期。建议在流水线开始时 create，关键阶段 update，最终 close。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "生产环境部署",
  "status": "building",
  "message": "镜像构建中",
  "severity": "normal",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "attrs": {
    "service": "api",
    "revision": "8f3c2a1"
  }
}
```

失败时可以把 `severity` 提升到 `critical`，并用 `/event/close` 标记结束。

### 服务健康状态：Thing

服务是否在线、延迟多少、当前版本是什么，属于当前状态。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "API 服务",
  "observed_at": 1713750000000,
  "location_type": "cloud",
  "location_value": "prod",
  "attrs": {
    "healthy": true,
    "latency_ms": 83,
    "version": "1.8.4"
  }
}
```

### 失败强提醒：Message

即使已经有 Event 记录部署过程，也可以在失败节点额外发送一条 Message，让移动端优先提醒。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "生产部署失败",
  "body": "api 服务部署失败，请检查流水线日志。",
  "severity": "critical",
  "tags": ["deploy", "prod"]
}
```

## 个人自动化

### 价格监控：Message

价格触发阈值通常是一次性提醒。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "价格下降",
  "body": "目标商品已降至 199 元。",
  "severity": "normal",
  "url": "https://example.com/product"
}
```

### 长时间下载或转码：Event

下载、转码、训练模型都适合 Event。它们有明确开始和结束，中间还可能更新进度。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "视频转码",
  "status": "running",
  "message": "进度 45%",
  "severity": "normal",
  "event_time": 1713750000000,
  "attrs": {
    "progress": 0.45
  }
}
```

## 建模速查

| 场景 | 推荐模型 | 理由 |
| :--- | :--- | :--- |
| 失败、成功、降价、告警 | Message | 单次提醒，读完即可。 |
| 部署、备份、转码、故障处理 | Event | 有过程，有多次更新，有最终结果。 |
| 服务器、传感器、房间、服务 | Thing | 长期存在，需要反复更新当前状态。 |
| 某台设备上的告警 | Thing + Message | 告警关联到实体，历史更容易追踪。 |
| 某个服务的一次故障 | Thing + Event | 服务是实体，故障是生命周期事件。 |
