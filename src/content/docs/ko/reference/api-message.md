---
title: Message API
description: /message를 사용하여 일회성 알림을 보내고 필드, 응답 및 발송 의미를 이해하세요.
---
Message API는 최상위 임시 알림을 보냅니다. 알림, 완료 Message, 이미지 스냅샷, 가격 알림 및 추후 업데이트나 종료가 필요하지 않은 기타 콘텐츠에 사용하세요.

## 엔드포인트

```http
POST /message
```

요청 본문은 JSON여야 하며 알 수 없는 필드는 거부됩니다. 프라이빗 Gateway가 `PUSHGO_TOKEN`를 활성화하는 경우 `Authorization: Bearer <token>`를 포함합니다.

## HTTP 헤더

| 헤더 | 필수 | 설명 |
| :--- | :--- | :--- |
| `Content-Type: application/json` | 예 | 본문 형식을 요청합니다. |
| `Authorization: Bearer <token>` | 게이트웨이 종속 | 비공개 Gateway가 `PUSHGO_TOKEN`를 활성화하는 경우에만 필요합니다. |

## 요청 필드

| 필드 | 유형 | 필수 | 설명 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | 예 | 대상 채널 ID. |
| `password` | `string` | 예 | Channel 비밀번호는 일반적으로 8-128자입니다. |
| `title` | `string` | 예 | Message 제목은 비워둘 수 없습니다. |
| `body` | `string` | 아니요 | Message 본체, Markdown가 지원됩니다. |
| `op_id` | `string` | 아니요 | 멱등성 키, 1~128자, 문자/숫자/`_`/`:`/`-`. |
| `thing_id` | `string` | 아니요 | 기존 Thing에 연결합니다. 1-64자, 문자/숫자/`_`/`:`/`-`. |
| `occurred_at` | `number` | 아니요 | 메시지 발생 시간입니다. Unix 초 또는 밀리초를 허용합니다. `thing_id`가 있으면 필수입니다. |
| `severity` | `string` | 아니요 | `critical`, `high`, `normal`, `low`; 알 수 없는 값은 `normal`로 정규화됩니다. |
| `ttl` | `number` | 아니요 | Unix-밀리초 만료 시간. 공급자 TTL은 약 28일로 제한됩니다. |
| `url` | `string` | 아니요 | 선택적 클릭연결 URL입니다. |
| `images` | `string[]` | 아니요 | 최대 32개의 이미지 URL, 각각 최대 2048자. |
| `tags` | `string[]` | 아니요 | 최대 32개의 태그, 각각 최대 64자, 잘라내기 및 중복 제거. |
| `ciphertext` | `string` | 아니요 | 선택적 E2EE 암호문 페이로드. |
| `metadata` | `object` | 아니요 | 사용자 지정 scalar key-value입니다. key <= 64, 비어 있지 않은 scalar value <= 512. 중첩 object와 array는 거부됩니다. |

## 심각도 매핑

| `severity` | APNs 중단 수준 | FCM 우선순위 |
| :--- | :--- | :--- |
| `critical` | `critical` | `HIGH` |
| `high` | `time-sensitive` | `HIGH` |
| `normal` | `active` | `HIGH` |
| `low` | `passive` | `NORMAL` |

## 최소 예시

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The daily NAS backup has finished.",
    "severity": "normal"
  }'
```

## Thing과 연결

경고가 지속 엔터티에 속하는 경우 `thing_id`를 전달합니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
  "title": "Home NAS disk warning",
  "body": "volume1 usage has reached 92%.",
  "severity": "high",
  "tags": ["nas", "disk"]
}
```

## 성공 응답

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true`는 Gateway가 요청을 처리했음을 의미합니다. `accepted=true`는 요청이 발송을 입력했음을 의미합니다. 최종 표시는 여전히 플랫폼 푸시 서비스, 디바이스 상태 및 private transport에 따라 달라집니다.

## 일반적인 오류

| 상태 | 일반적인 이유 |
| :--- | :--- |
| `400` | 필수 필드 누락, 알 수 없는 필드, 비어 있는 `title`, 잘못된 `op_id`. |
| `401` | 비공개 Gateway에는 Bearer 토큰이 필요하지만 헤더가 누락되었거나 잘못되었습니다. |
| `404` | Channel이 존재하지 않거나 자격 증명이 일치하지 않습니다. |
| `413` | 요청 본문이 32KB를 초과합니다. |
| `503` | Gateway가 디스패치를 완전히 시작할 수 없습니다. 응답에는 `accepted=false`가 포함될 수 있습니다. |

공유 제한은 [제한 및 오류](/ko/reference/limits-errors/)를 참조하세요.

## 호환성 엔드포인트

PushGo는 마이그레이션을 위한 ntfy, Bark 및 ServerChan 호환성 엔드포인트도 제공합니다. 해당 분야의 적용 범위는 제한되어 있습니다. `thing_id`, E2EE 또는 전체 PushGo 의미 체계가 필요한 경우 기본 `/message`를 사용하세요. [마이그레이션 가이드](/ko/guides/migration/)를 참조하세요.