---
title: 데이터 모델
description: Message, Event 또는 Thing을 언제 사용할지 결정하고 해당 필드 경계를 이해하십시오.
---
PushGo의 세 가지 데이터 모델은 서로 다른 비즈니스 의미를 전달합니다. 올바른 모델을 선택하면 클라이언트 프레젠테이션, 기록, 상태 병합 및 자동화를 더 쉽게 추론할 수 있습니다.

## 결정 매트릭스

| 표현해야 할 것 | 사용 | 왜 |
| :--- | :--- | :--- |
| "무슨 일이 일어났으니 한 번만 알려주세요" | Message | 지속적인 상태가 없습니다. 각 Message는 독립적입니다. |
| "뭔가 시작되었고, 시간이 지나면 변하고, 결국 끝난다" | Event | 하나의 `event_id`는 여러 번 업데이트된 후 닫힐 수 있습니다. |
| "이 디바이스, 서비스, 방 또는 작업은 현재 상태입니다." | Thing | 시간이 지남에 따라 하나의 `thing_id`가 업데이트될 수 있습니다. |
| "특정 엔터티에서 경고가 발생했습니다." | Thing + Message | Thing은 엔터티를 식별합니다. Message는 경고를 기록합니다. |
| "특정 객체가 프로세스를 진행하고 있습니다" | Thing + Event | Thing은 객체를 식별합니다. Event는 수명 주기를 기록합니다. |

## Message: 일회성 경고

Message는 가장 간단한 알림 모델입니다. 나중에 병합하거나 닫을 필요가 없는 콘텐츠에 사용하세요.

### 잘 맞는다

- 디스크 사용량이 임계값을 초과했습니다.
- 백업이 완료되었습니다.
- 가격이 떨어졌습니다.
- 카메라가 움직임을 감지하고 스냅샷을 포함합니다.

### 적합하지 않음

- 배포의 빌드, 게시 및 완료 수명 주기입니다.
- 서버, 센서 또는 공간의 최신 상태입니다.
- 시간이 지남에 따라 덮어써야 하는 대시보드 값입니다.

### 필드 그룹

| 그룹 | 필드 |
| :--- | :--- |
| 인증 및 라우팅 | `channel_id`, `password`, `op_id`, `thing_id` |
| 디스플레이 | `title`, `body`, `severity`, `url`, `images`, `tags` |
| 시간과 보안 | `occurred_at`, `ttl`, `ciphertext` |
| 확장 | `metadata` |

### 최소 예시

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Backup completed",
  "body": "The daily NAS backup has finished.",
  "severity": "normal"
}
```

## Event: 업데이트 가능한 수명 주기

Event는 하나의 프로세스를 표현합니다. 생성하면 `event_id`가 반환되며, 이후 업데이트와 최종 종료 호출은 이 ID를 기준으로 이어집니다.

### 잘 맞는다

- CI/CD 배포: 시작, 구축, 게시, 성공 또는 실패.
- 사고 처리: 감지, 조사, 복구.
- 문/창 상태: 열렸다가 닫힙니다.
- 장기 실행 작업: 트랜스코딩, 동기화, 모델 교육.

### 수명 주기

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   ends the event
```

### 필드 그룹

| 그룹 | 필드 |
| :--- | :--- |
| 인증 및 라우팅 | `channel_id`, `password`, `op_id`, `thing_id` |
| 수명 주기 | `event_id`, `event_time`, `started_at`, `ended_at` |
| 디스플레이 | `title`, `description`, `status`, `message`, `severity`, `tags`, `images` |
| 확장 | `attrs`, `metadata`, `ciphertext` |

### 모델링 팁

- `running`, `degraded`, `success` 또는 `failed`와 같은 짧은 `status` 값을 사용합니다.
- "이미지 푸시" 등 현재 업데이트에는 `message`를 사용하세요.
- `event_time`는 이번 업데이트가 발생한 시점입니다.
- `started_at`는 전체 Event 시작 시간이며 생성에 속합니다.
- `ended_at`는 전체 Event 종료 시간이며 마감에 속합니다.

## Thing: 지속 엔터티 상태

Thing은 수명이 긴 객체를 의미. 그 가치는 관련 없는 알림을 생성하는 대신 동일한 객체를 업데이트하는 데서 나옵니다.

### 잘 맞는다

- 홈 NAS, 서버 또는 네트워크 서비스.
- 방, 센서, 카메라 또는 잠금 디바이스.
- 장기 실행 자산 또는 작업.
- 현재 상태를 표시해야 하는 모든 것.

### 수명 주기

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

### 필드 그룹

| 그룹 | 필드 |
| :--- | :--- |
| 인증 및 라우팅 | `channel_id`, `password`, `op_id` |
| 아이덴티티와 디스플레이 | `thing_id`, `title`, `description`, `tags`, `primary_image`, `images` |
| 시간 | `created_at`, `observed_at`, `deleted_at` |
| 외부 시스템 | `external_ids`, `location_type`, `location_value` |
| 상태 | `attrs`, `metadata`, `ciphertext` |

### 모델링 팁

- "Home NAS"와 같이 사람이 읽을 수 있는 이름에는 `title`를 사용합니다.
- CPU, 온도, 온라인 상태 등의 값을 변경하려면 `attrs`를 사용하세요.
- 일반적으로 표시되지 않는 보조 데이터에는 `metadata`를 사용하십시오.
- `external_ids`를 사용하여 Home Assistant와 같은 시스템의 ID에 연결합니다.

## 모델 결합

| 조합 | 패턴 |
| :--- | :--- |
| Thing + Message | "Home NAS" 엔터티에서 "디스크가 거의 가득 참" 경고가 발생했습니다. |
| Thing + Event | "프로덕션 데이터베이스" 엔터티에 복제 지연 Event가 발생했습니다. |
| Event + Message | Event는 수명 주기를 기록합니다. Message는 중요한 지점에 강력한 경고를 보냅니다. |

확실하지 않은 경우 Message로 시작하세요. 스크립트가 "시작됨/업데이트됨/완료됨" 또는 "현재 값 변경됨"을 반복적으로 보내는 경우 Event 또는 Thing로 업그레이드하세요.