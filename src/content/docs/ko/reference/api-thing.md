---
title: Thing API
description: 지속 엔터티 상태를 관리하려면 /thing/create, /thing/update, /thing/archive 및 /thing/delete를 사용하세요.
---
Thing API는 서버, 룸, 센서, 네트워크 서비스 또는 장기 실행 작업과 같이 시간이 지남에 따라 변경되는 장기적으로 유지되는 객체를 의미. Thing를 생성하면 `thing_id`가 반환됩니다. 이후 업데이트, 보관, 삭제 호출은 이 ID를 사용합니다.

## 엔드포인트

```http
POST /thing/create
POST /thing/update
POST /thing/archive
POST /thing/delete
```

요청 본문은 JSON여야 하며 알 수 없는 필드는 거부됩니다. 프라이빗 Gateway가 `PUSHGO_TOKEN`를 활성화하는 경우 `Authorization: Bearer <token>`를 포함합니다.

## HTTP 헤더

| 헤더 | 필수 | 설명 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 예 | 본문 형식을 요청합니다. |
| `Authorization: Bearer <token>` | 게이트웨이 종속 | 개인 Gateway가 `PUSHGO_TOKEN`를 활성화하는 경우에만 필요합니다. |

## 수명 주기

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

## 공통 필드

| 필드 | 유형 | 필수 | 설명 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 예 | 대상 채널 ID. |
| `password` | `string` | 예 | Channel 비밀번호는 일반적으로 8-128자입니다. |
| `op_id` | `string` | 아니요 | 멱등성 키 생략되면 생성되어 반환됩니다. |
| `ciphertext` | `string` | 아니요 | 선택적 E2EE 암호문 페이로드. |

## 라우트별 필수 필드

| 경로 | 필수업종 |
| :--- | :--- |
| `/thing/create` | `observed_at` |
| `/thing/update` | `thing_id`, `observed_at` |
| `/thing/archive` | `thing_id`, `observed_at` |
| `/thing/delete` | `thing_id`, `observed_at` |

## 필드 규칙

| 필드 | 유형 | 규칙 |
| :--- | :--- | :--- |
| `thing_id` | `string` | update/archive/delete에 필수이며 create에는 보내면 안 됩니다. 1-64자, 문자/숫자/`_`/`:`/`-`. |
| `title` | `string` | 생성 시 권장됩니다. Gateway는 현재 누락된 `title`를 거부하지 않습니다. |
| `description` | `string` | 선택 과목; 빈 문자열은 누락된 것으로 처리됩니다. |
| `tags` | `string[]` | 최대 32개 항목(각각 최대 64자)이 잘리고 중복이 제거됩니다. |
| `primary_image` | `string` | 선택적 URL, 최대 2048자. |
| `images` | `string[]` | 최대 32개의 이미지 URL, 각각 최대 2048자. |
| `created_at` | `number` | 생성만 가능합니다. 생략되면 `observed_at`로 대체됩니다. |
| `deleted_at` | `number` | 삭제만 가능합니다. 생략되면 `observed_at`로 대체됩니다. |
| `observed_at` | `number` | 필수. 이 상태 업데이트의 관찰 시간입니다. Unix 초 또는 밀리초를 허용하고 밀리초로 정규화합니다. |
| `external_ids` | `object` | key 패턴 `[A-Za-z0-9_:.-]`, key <= 64 및 소문자화. value는 비어 있지 않은 `string` <= 256 또는 삭제용 `null`. |
| `location_type` + `location_value` | `string` + `string` | 함께 제공해야 합니다. type은 `physical`, `geo`, `cloud`, `datacenter`, `logical`입니다. 형식: `geo`는 `lat,lng`, `cloud`는 `provider:region[:zone]`, `datacenter`는 `site[:room[:rack]]`, `logical`은 slash로 구분된 token입니다. |
| `attrs` | `object` | 객체 패치; `null`는 키를 제거합니다. 배열은 허용되지 않습니다. 중첩된 객체 수준은 하나만 있습니다. |
| `metadata` | `object` | 아니요 | 사용자 지정 scalar key-value입니다. key <= 64, 비어 있지 않은 scalar value <= 512. 중첩 object와 array는 거부됩니다. |

## Thing 만들기

```bash
curl -X POST https://gateway.pushgo.dev/thing/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Home NAS",
    "description": "Primary storage in the living room rack",
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

응답:

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

반환된 `thing_id`를 저장합니다. 업데이트, 보관 및 삭제 호출이 필요합니다.

## Thing 업데이트

```bash
curl -X POST https://gateway.pushgo.dev/thing/update \
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

`attrs`는 패치입니다. 매번 전체 상태를 보낼 필요는 없습니다. 키를 제거하려면 `null`를 전달하세요.

```json
{
  "attrs": {
    "temporary_alarm": null
  }
}
```

## Thing 보관

보관은 더 이상 활성 상태가 아니지만 기록을 유지해야 하는 객체를 위한 것입니다.

```bash
curl -X POST https://gateway.pushgo.dev/thing/archive \
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

## Thing 삭제

객체가 제거되거나 폐기될 때 `/thing/delete`를 사용하십시오.

```bash
curl -X POST https://gateway.pushgo.dev/thing/delete \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751800000,
    "deleted_at": 1713751800000
  }'
```

## Message 및 Event 연결

Thing은 영속 객체를 의미. 관련 경고는 `thing_id`와 함께 Message를 사용할 수 있습니다. 관련 프로세스에서는 Event와 `thing_id`를 사용할 수 있습니다.

| 시나리오 | 모델 |
| :--- | :--- |
| 현재 NAS CPU, 온도, 디스크 사용량 | Thing |
| NAS에 디스크 1개 경고 | Message + `thing_id` |
| NAS 백업 시작부터 완료까지 | Event + `thing_id` |

## 응답 의미

Thing API는 공유 응답 봉투를 사용합니다. `accepted=true`는 Gateway가 디스패치를 입력했음을 의미하지만 모든 디바이스에 시스템 알림이 표시되었다는 의미는 아닙니다.

## 일반적인 오류

| 상태 | 일반적인 이유 |
| :--- | :--- |
| `400` | `observed_at` 누락, 알 수 없는 필드, 잘못된 `attrs` 또는 `external_ids`. |
| `401` | 비공개 Gateway Bearer 토큰이 누락되었거나 잘못되었습니다. |
| `404` | Channel 또는 `thing_id`가 존재하지 않습니다. |
| `413` | 요청 본문이 32KB를 초과합니다. |
| `503` | 디스패치가 완전히 성공하지 못했습니다. |