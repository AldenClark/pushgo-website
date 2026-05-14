---
title: 사용 사례
description: 실제 PushGo 시나리오를 통해 Message, Event, Thing에 대해 알아보세요.
---
이 페이지는 기능 목록이 아닌 모델링 요리책입니다. 각 시나리오에서는 사용할 모델과 모든 항목에 대해 일반 텍스트 알림을 보내는 것보다 더 명확한 이유를 설명합니다.

## 서버 및 NAS

### 디스크 경고: Message

디스크 사용량이 임계값을 초과하면 강력한 경고 하나만으로 충분합니다.

```bash
USAGE=$(df / | awk 'NR==2 { gsub("%", "", $5); print $5 }')

if [ "$USAGE" -ge 90 ]; then
  curl -X POST https://gateway.pushgo.dev/message \
    -H "Content-Type: application/json" \
    -d '{
      "channel_id": "YOUR_CHANNEL_ID",
      "password": "YOUR_CHANNEL_PASSWORD",
      "title": "Disk space warning",
      "body": "Root partition usage has reached '"$USAGE"'%.",
      "severity": "high",
      "tags": ["nas", "disk"]
    }'
fi
```

### 백업 작업: Event

백업에는 시작, 진행 및 결과가 있습니다. Event는 이러한 업데이트를 하나의 수명 주기로 유지합니다.

```bash
curl -X POST https://gateway.pushgo.dev/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "NAS backup",
    "status": "running",
    "message": "Backup started",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000
  }'
```

반환된 `event_id`를 저장한 다음 업로드, 확인, 완료 또는 실패 중에 `/event/update` 및 `/event/close`를 호출합니다.

### 호스트 상태 패널: Thing

시간 경과에 따른 서버의 현재 상태를 보려면 호스트를 Thing로 모델링하세요.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Home NAS",
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

## Home Assistant 및 IoT

### 공간 또는 센서: Thing

온도, 습도, 빛이 지속되는 상태입니다. 각 방이나 디바이스를 Thing로 모델링하고 `attrs`를 업데이트합니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Living room",
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

### 문 열림부터 닫힘까지: Event

열린 문은 문이 닫힐 때 끝나는 과정입니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Balcony door open",
  "status": "open",
  "message": "The balcony door has been open for more than 5 minutes.",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "tags": ["home", "door"]
}
```

### 모션 스냅샷: Message

하나의 스냅샷을 사용한 카메라 모션 감지는 Message입니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Motion detected",
  "body": "Entry camera detected motion.",
  "severity": "high",
  "images": ["https://example.com/snapshot.jpg"],
  "tags": ["camera", "security"]
}
```

## DevOps 및 자동화

### 배포 파이프라인: Event

배포에는 수명 주기 상태가 있습니다. 시작 시 생성하고, 주요 단계에서 업데이트하고, 성공 또는 실패로 종료됩니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Production deployment",
  "status": "building",
  "message": "Building image",
  "severity": "normal",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "attrs": {
    "service": "api",
    "revision": "8f3c2a1"
  }
}
```

실패하면 `severity`를 `critical`로 올리고 `status=failed`로 Event를 종료합니다.

### 서비스 상태: Thing

온라인 상태, 지연 시간, 버전은 현재 상태입니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "API service",
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

### 실패 경고: Message

Event가 배포 수명 주기를 기록하더라도 더 강력한 모바일 가시성을 위해 오류 지점에 Message를 보낼 수 있습니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Production deployment failed",
  "body": "The api service deployment failed. Check the pipeline logs.",
  "severity": "critical",
  "tags": ["deploy", "prod"]
}
```

## 개인 자동화

### 가격 모니터: Message

가격 임계값은 일반적으로 하나의 경고입니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Price dropped",
  "body": "The tracked product is now 199.",
  "severity": "normal",
  "url": "https://example.com/product"
}
```

### 긴 다운로드 또는 트랜스코딩 작업: Event

다운로드, 트랜스코딩 및 교육 작업은 시작, 업데이트, 종료되므로 Event입니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Video transcoding",
  "status": "running",
  "message": "45% complete",
  "severity": "normal",
  "event_time": 1713750000000,
  "attrs": {
    "progress": 0.45
  }
}
```

## 모델링 치트 시트

| 시나리오 | 모델 | 왜 |
| :--- | :--- | :--- |
| 실패, 성공, 가격 하락, 경고 | Message | 일회성 경고. |
| 배포, 백업, 트랜스코딩, 사고 | Event | 업데이트 및 결과를 처리합니다. |
| 서버, 센서, 룸, 서비스 | Thing | 현재 상태의 영구 객체입니다. |
| 특정 디바이스에 대한 경고 | Thing + Message | 엔터티와 경고는 연결된 상태로 유지됩니다. |
| 서비스 관련 사고 | Thing + Event | 서비스는 실체입니다. 사건은 수명 주기입니다. |