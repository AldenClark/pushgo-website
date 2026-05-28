---
title: 한계 및 오류
description: 공유 PushGo 게이트웨이 제한, 응답 봉투, 상태 코드 및 문제 해결 진입점.
---
이 페이지에는 API 전체에서 공유되는 규칙이 요약되어 있습니다. 필수 필드, 수명 주기 동작 및 모델별 의미 체계는 여전히 각 API 페이지에 속합니다.

## 공유 한도

| 아이템 | 한도 |
| :--- | :--- |
| 신체 사이즈 요청 | 최대 32KB. |
| 게이트웨이 생성 ID | 32개의 소문자 16진수 문자입니다. |
| Channel 비밀번호 | 일반적으로 8~128자입니다. |
| `op_id` | 1~128자; 문자, 숫자, `_`, `:`, `-`. |
| `thing_id` / `event_id` | 1-64자; 문자, 숫자, `_`, `:`, `-`. |
| `images` | 최대 32개의 URL, 각각 최대 2048자. |
| `tags` | 최대 32개의 태그(각각 최대 64자)를 잘라내고 중복을 제거했습니다. |
| `metadata` | scalar 값만 허용합니다. key 최대 64, 비어 있지 않은 scalar value 최대 512. 중첩 object와 array는 허용되지 않습니다. |
| `attrs` | object patch입니다. `null`은 key를 삭제합니다. array와 깊은 중첩은 거부됩니다. |
| `ttl` 및 API timestamp | 문서화된 필드는 Unix 초 또는 밀리초를 허용하며 밀리초로 정규화합니다. |
| 알 수 없는 필드 | 기본 Message, Event, Thing 및 MCP 도구 인수는 엄격합니다. 알 수 없는 필드가 400을 반환합니다. |

## 응답 봉투

성공:

```json
{
  "success": true,
  "data": {
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

실패:

```json
{
  "success": false,
  "data": null,
  "error": "human readable message",
  "error_code": "machine_readable_code"
}
```

자동화는 자연어 `error` 텍스트보다 `success` 및 `error_code`를 선호해야 합니다.

## `accepted`의 의미

`success=true`는 Gateway가 요청을 처리했음을 의미합니다. `accepted=true`는 발송에 들어갔다는 뜻입니다.

다음 사항을 보장하지 않습니다.

- 모든 디바이스가 온라인 상태입니다.
- APNs 또는 FCM가 알림을 표시했습니다.
- 실시간으로 전달되는 Android 개인교통수단.
- 사용자는 알림 권한, 집중 모드, 배터리 정책의 영향을 받지 않습니다.

`accepted`를 최종 디바이스 디스플레이 영수증이 아닌 Gateway 수락 및 발송 상태로 처리합니다.

## 일반적인 HTTP 상태 코드

| 상태 | 의미 | 일반적인 이유 | 해야 할 일 |
| :--- | :--- | :--- | :--- |
| `200` | Gateway가 요청을 처리했습니다 | `success=true`, 하지만 여전히 `accepted`를 확인하세요 | 반환된 ID와 `op_id`를 저장합니다. |
| `400` | 유효성 검사 실패 | 필수 필드 누락, 알 수 없는 필드, 잘못된 형식 | JSON를 API 필드 테이블과 비교하세요. |
| `401` | Gateway 인증 실패 | 개인용 Gateway는 `PUSHGO_TOKEN`를 사용합니다. Bearer 토큰이 없거나 잘못됨 | `Authorization: Bearer <token>`를 확인하세요. |
| `404` | 타겟 누락 | Channel, Event 또는 Thing이 존재하지 않습니다 | `channel_id`, `event_id`, `thing_id`를 확인하세요. |
| `413` | 요청 본문이 너무 큼 | JSON가 32KB를 초과합니다 | 이미지 URL을 사용하세요. 메타데이터 또는 속성을 줄입니다. |
| `503` | 발송이 완전히 허용되지 않음 | 공급자, private transport, 대기열 또는 다운스트림을 사용할 수 없음 | Gateway 로그, 통계, 대기열 용량을 검사합니다. |

## 시나리오별 문제 해결

### 요청은 400을 반환합니다.

- JSON가 유효해야 합니다.
- `event_id`를 `/event/create`로 보내거나 `thing_id`를 `/thing/create`로 보내지 마세요.
- 알 수 없는 필드를 제거합니다.
- `severity`는 `critical`, `high`, `normal` 또는 `low`여야 합니다.
- `attrs`는 배열이나 깊게 중첩된 구조가 아닌 객체 패치여야 합니다.

### 요청 반환 401

- 개인용 Gateway에 `PUSHGO_TOKEN`가 있는지 확인하세요.
- 헤더는 `Authorization: Bearer <token>`여야 합니다.
- 채널 비밀번호와 Gateway 토큰을 혼동하지 마세요.
- 역방향 프록시가 인증 헤더를 제거하지 않는지 확인하세요.

### 요청이 성공했지만 디바이스가 알림을 보내지 않음

- 클라이언트는 채널을 구독해야 합니다.
- 기기 알림 권한이 활성화되어 있어야 합니다.
- Apple 전달은 APNs, 포커스 모드 및 시스템 설정에 의해 영향을 받을 수 있습니다.
- Android 클라이언트는 올바른 `/gateway/profile`를 가져올 수 있어야 합니다.
- private transport 포트, 인증서, 외부 주소에 접근할 수 있어야 합니다.
- Gateway 로그에 공급자 또는 개인 디스패치 오류가 표시될 수 있습니다.

### Private transport를 사용할 수 없음

- `PUSHGO_PRIVATE_TRANSPORTS`를 활성화해야 합니다.
- WSS는 HTTPS 도메인을 통해 연결할 수 있어야 합니다.
- QUIC UDP 포트는 방화벽이나 프록시에 의해 차단될 수 있습니다.
- Raw TCP는 TLS 또는 TLS 오프로드를 올바르게 처리해야 합니다.
- 광고된 포트와 실제 바인딩 포트는 NAT 또는 포트 매핑에 따라 다를 수 있습니다.

### MCP 바인딩 실패

- `PUSHGO_MCP_ENABLED`를 활성화해야 합니다.
- `PUSHGO_PUBLIC_BASE_URL`는 외부 HTTPS URL이어야 합니다.
- 역방향 프록시는 `/.well-known/*`, `/oauth/*` 및 `/mcp`를 전달해야 합니다.
- DCR은 클라이언트 기능과 일치해야 합니다.
- 바인드 페이지 세션이 만료될 수 있습니다.

## 관련 페이지

- [인증](/ko/reference/auth/)
- [Message API](/ko/reference/api-message/)
- [Event API](/ko/reference/api-event/)
- [Thing API](/ko/reference/api-thing/)
- [셀프호스팅](/ko/guides/self-hosting/)