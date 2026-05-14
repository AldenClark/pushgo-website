---
title: Event API
description: /event/create, /event/update 및 /event/close를 사용하여 업데이트 가능한 수명 주기를 모델링하세요.
---
Event API는 시간이 지남에 따라 변경되고 결국 종료되는 프로세스를 의미. Event를 생성하면 `event_id`가 반환됩니다. 업데이트 및 종료 호출은 해당 ID를 사용하여 동일한 수명 주기에 연결됩니다.

## 엔드포인트

```http
POST /event/create
POST /event/update
POST /event/close
```

요청 본문은 JSON여야 하며 알 수 없는 필드는 거부됩니다. 비공개 Gateway가 `PUSHGO_TOKEN`를 활성화하는 경우 `Authorization: Bearer <token>`를 포함합니다.

## HTTP 헤더

| 헤더 | 필수 | 설명 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 예 | 본문 형식을 요청합니다. |
| `Authorization: Bearer <token>` | 게이트웨이 종속 | 개인 Gateway가 `PUSHGO_TOKEN`를 활성화하는 경우에만 필요합니다. |

## 수명 주기

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   marks the event as ended
```

## 공통 필드

| 필드 | 유형 | 필수 | 설명 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 예 | 대상 채널 ID. |
| `password` | `string` | 예 | Channel 비밀번호는 일반적으로 8-128자입니다. |
| `op_id` | `string` | 아니요 | 멱등성 키 생략되면 생성되어 반환됩니다. |
| `thing_id` | `string` | 아니요 | 이 Event 디스패치를 기존 Thing과 연결합니다. |
| `ciphertext` | `string` | 아니요 | 선택적 E2EE 암호문 페이로드. |

## 라우트별 필수 필드

| 경로 | 필수업종 |
| :--- | :--- |
| `/event/create` | `title`, `status`, `message`, `severity`, `event_time` |
| `/event/update` | `event_id`, `status`, `message`, `severity`, `event_time` |
| `/event/close` | `event_id`, `status`, `message`, `severity`, `event_time` |

## 필드 규칙

| 필드 | 유형 | 규칙 |
| :--- | :--- | :--- |
| `event_id` | `string` | 업데이트 및 종료에 필요합니다. 생성 시 전송되어서는 안 됩니다. |
| `title` | `string` | 생성 시 필요합니다. 업데이트 및 닫기 시 선택 사항입니다. |
| `description` | `string` | 선택 과목; 빈 문자열은 누락된 것으로 처리됩니다. |
| `status` | `string` | 필수의; 비어 있지 않으며 최대 24자입니다. |
| `message` | `string` | 필수의; 비어 있지 않으며 최대 512자입니다. |
| `severity` | `string` | 필수의; `critical`, `high`, `normal`, `low`만 해당됩니다. |
| `event_time` | `number` | 필수의; 이 업데이트가 발생했을 때 Unix는 밀리초입니다. |
| `started_at` | `number` | 생성만 가능합니다. 전체 Event 시작 시간. |
| `ended_at` | `number` | 닫기만 가능합니다. 전체 Event 종료 시간. |
| `tags` | `string[]` | 최대 32개 항목(각각 최대 64자)이 잘리고 중복이 제거됩니다. |
| `images` | `string[]` | 최대 32개의 이미지 URL, 각각 최대 2048자. |
| `attrs` | `object` | 객체 패치; `null`는 키를 제거합니다. 배열은 허용되지 않습니다. |
| `metadata` | `object` | 스칼라 값만; 키 <= 64, 값 <= 512. |

## Event 만들기

```bash
curl -X POST https://gateway.pushgo.dev/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Production deployment",
    "status": "running",
    "message": "Deployment started",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000,
    "attrs": {
      "service": "api",
      "revision": "8f3c2a1"
    }
  }'
```

응답:

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

반환된 `event_id`를 저장합니다. 업데이트 및 종료 호출이 필요합니다.

## Event 업데이트

```bash
curl -X POST https://gateway.pushgo.dev/event/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "publishing",
    "message": "Image pushed, publishing release",
    "severity": "normal",
    "event_time": 1713750300000,
    "attrs": {
      "progress": 0.75
    }
  }'
```

`/event/update`는 여러 번 호출될 수 있습니다. 각 업데이트는 전체 기록을 반복하는 것이 아니라 현재 변경 사항을 설명해야 합니다.

## Event 닫기

```bash
curl -X POST https://gateway.pushgo.dev/event/close \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "success",
    "message": "Production deployment completed",
    "severity": "normal",
    "event_time": 1713750600000,
    "ended_at": 1713750600000,
    "attrs": {
      "progress": 1
    }
  }'
```

오류가 발생하면 `status=failed`를 사용하고 적절한 경우 `severity`를 발생시킵니다.

## Thing과 연결

Event가 지속 엔터티에서 발생하는 경우 `thing_id`를 포함합니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
  "title": "Database lag",
  "status": "open",
  "message": "Replica lag exceeded 30 seconds",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000
}
```

Thing은 객체를 식별합니다. Event는 이에 발생하는 프로세스를 설명합니다.

## 응답 의미

Event API는 공유 응답 봉투를 사용합니다. `accepted=true`는 Gateway가 디스패치를 입력했음을 의미하지만 모든 디바이스에 시스템 알림이 표시되었다는 의미는 아닙니다.

## 일반적인 오류

| 상태 | 일반적인 이유 |
| :--- | :--- |
| `400` | 경로 필수 필드 누락, 알 수 없는 필드, 잘못된 `severity`, 잘못된 `attrs`. |
| `401` | 비공개 Gateway Bearer 토큰이 누락되었거나 잘못되었습니다. |
| `404` | Channel 또는 `event_id`가 존재하지 않습니다. |
| `413` | 요청 본문이 32KB를 초과합니다. |
| `503` | 디스패치가 완전히 성공하지 못했습니다. |