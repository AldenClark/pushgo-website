---
title: 마이그레이션 가이드
description: 기존 ntfy, Bark, ServerChan 또는 webhook 스크립트를 PushGo로 마이그레이션하세요.
---
PushGo로 마이그레이션할 때 모든 스크립트를 한 번에 다시 작성할 필요는 없습니다. 기존 스크립트가 계속 작동하도록 호환성 엔드포인트로 시작한 다음 중요한 워크플로를 기본 Message, Event 또는 Thing API로 업그레이드하세요.

## 추천 경로

1. **엔드포인트 변경**: ntfy, Bark 또는 ServerChan 요청이 PushGo 호환성 엔드포인트를 가리키도록 합니다.
2. **키 교체**: `<channel_id>:<password>`를 호환 키로 사용합니다.
3. **필드 정규화**: 우선순위, 수준, 그룹, 아이콘 및 유사한 필드를 `severity`, `tags`, `images` 또는 `metadata`에 매핑합니다.
4. **업그레이드 모델**: 일회성 경고를 Message로 유지합니다. 라이프사이클을 Event로 업그레이드합니다. 영구 상태를 Thing로 업그레이드합니다.

## 호환성 엔드포인트

| 소스 | 방법 | PushGo 경로 | 주요 위치 |
| :--- | :--- | :--- | :--- |
| ntfy | `POST` / `PUT` | `/ntfy/{topic}` | `{topic}` = `<channel_id>:<password>` |
| ServerChan | `GET` / `POST` | `/serverchan/{sendkey}` | `{sendkey}` = `<channel_id>:<password>` |
| Bark v1 | `GET` | `/bark/{device_key}/{body}` | `{device_key}` = `<channel_id>:<password>` |
| Bark v2 | `POST` | `/bark/push` | JSON 필드 `device_key` |

호환성 엔드포인트은 마이그레이션 비용을 줄여줍니다. 전체 PushGo 데이터 모델을 표현하지 않습니다. `thing_id`, Event 수명 주기 또는 전체 Thing 상태가 필요한 경우 기본 API를 사용하세요.

## ntfy에서

이전 요청:

```bash
curl -d "NAS backup completed" https://ntfy.example.com/my-topic
```

PushGo 호환성 엔드포인트:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -H "Priority: 3" \
  -d "NAS backup completed"
```

기본 Message:

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The NAS backup task has finished.",
    "severity": "normal",
    "tags": ["nas", "backup"]
  }'
```

## Bark에서

Bark는 일반적으로 경로에 디바이스 키를 넣습니다. 해당 키를 `<channel_id>:<password>`로 교체하세요.

```bash
curl "https://gateway.pushgo.dev/bark/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD/Server%20alert?title=CPU%20High&level=timeSensitive"
```

이미 JSON 요청을 사용하고 있다면 기본 Message로 직접 마이그레이션하는 것이 좋습니다. 기본 API는 `images`, `tags`, `metadata`, `thing_id` 및 E2EE를 더 명확하게 표현합니다.

## ServerChan에서

```bash
curl -X POST https://gateway.pushgo.dev/serverchan/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -d "title=Deployment completed" \
  -d "desp=Production deployment succeeded"
```

ServerChan는 대부분 일회성 경고 모델입니다. 스크립트가 "시작됨", "실행 중" 및 "완료됨"을 보내는 경우 Event로 직접 업그레이드하세요.

## Event로 업그레이드해야 하는 경우

동일한 작업이 여러 단계 업데이트를 보내는 경우 Event가 더 적합합니다.

| 이전 스크립트 동작 | Event 표현 |
| :--- | :--- |
| "배포 시작됨" 보내기 | `/event/create` |
| "빌드 완료" 또는 "게시" 보내기 | `/event/update` |
| "배포 성공/실패" 보내기 | `/event/close` |

이를 통해 클라이언트는 관련 없는 Message 대신 일관된 하나의 타임라인을 표시할 수 있습니다.

## Thing로 업그레이드해야 하는 경우

스크립트가 동일한 객체의 현재 상태를 반복적으로 보고하는 경우 Thing를 사용하세요.

| 이전 스크립트 동작 | Thing 표현 |
| :--- | :--- |
| 1분마다 CPU/참고리 보내기 | `/thing/update` 및 `attrs` |
| 실내온도를 반복적으로 전송 | `thing_id`당 하나의 공간 또는 센서 |
| 서비스 온라인/오프라인 알림 | 서비스용 Thing, 인시던트용 Message 또는 Event |

## 호환성 제한

- 호환성 키에는 채널 비밀번호가 포함되어 있습니다. 공개 로그에 기록하지 마십시오.
- ntfy 호환성 엔드포인트은 `thing_id`를 지원하지 않습니다.
- 호환성 엔드포인트은 전체 Thing 수명 주기를 표현할 수 없습니다.
- 제공자별 우선순위 및 필드 이름은 매핑되며 일대일로 보존되지 않을 수 있습니다.
- 네이티브 API로 마이그레이션한 후 복잡한 메타데이터, E2EE 및 엔터티 관계가 더 명확해졌습니다.