---
title: 입증
description: 채널 자격 증명, 게이트웨이 토큰, 호환성 키 및 MCP OAuth를 이해합니다.
---
PushGo 인증은 호출하는 API 표면에 따라 다릅니다. 먼저 모드를 식별한 다음 자격 증명을 올바른 위치에 배치하세요.

## 인증 모드

| 시나리오 | 필수 자격 증명 | 위치 | 사용하는 사람 |
| :--- | :--- | :--- | :--- |
| 네이티브 API | `channel_id` + `password` | JSON 본체 | `/message`, `/event/*`, `/thing/*` |
| 비공개 Gateway 토큰 | Bearer 토큰 | `Authorization` 헤더 | 호출자를 자체 호스팅 Gateway로 제한 |
| 호환성 엔드포인트 | `<channel_id>:<password>` | 경로 또는 호환성 필드 | ntfy, Bark, ServerChan 마이그레이션 |
| MCP OAuth | OAuth 액세스 토큰 | MCP 클라이언트에 의해 관리됨 | AI 비서 및 타사 클라이언트 |

Channel 인증과 게이트웨이 인증은 별도의 레이어입니다. 비공개 Gateway 토큰이 활성화된 경우 요청에는 여전히 채널 ID와 비밀번호가 필요합니다.

## Channel 인증

네이티브 Message, Event 및 Thing API는 JSON 본문의 채널 자격 증명을 사용합니다.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Test message"
}
```

| 필드 | 설명 |
| :--- | :--- |
| `channel_id` | 대상 채널. |
| `password` | Channel 비밀번호는 일반적으로 8-128자입니다. |

채널 비밀번호는 채널에 쓸 수 있는 사람을 제어합니다. 이는 Gateway 관리자 비밀번호가 아니므로 공개 저장소, 로그 또는 프런트엔드 코드에 배치하면 안 됩니다.

## Gateway Bearer Token

자체 호스팅 게이트웨이는 `PUSHGO_TOKEN`를 사용하여 게이트웨이 수준 인증을 활성화할 수 있습니다.

```bash
PUSHGO_TOKEN=replace-with-gateway-token
```

요청에는 다음이 필요합니다.

```http
Authorization: Bearer replace-with-gateway-token
```

전체 예:

```bash
curl -X POST https://gateway.example.com/message \
  -H "Authorization: Bearer replace-with-gateway-token" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Private Gateway test"
  }'
```

제약:

- 표준 헤더 이름 `Authorization`를 사용합니다.
- Token 유형은 `Bearer` 이어야 합니다.
- Token 길이는 4096자로 제한됩니다.
- `PUSHGO_TOKEN`가 비어 있으면 게이트웨이 수준 토큰 인증이 비활성화됩니다.

## 퍼블릭 게이트웨이

공개 Gateway는 여전히 채널 ID와 채널 비밀번호를 검증합니다. 시작하기 예시에서는 기본적으로 채널 인증만 보여줍니다. 추가 액세스 정책은 현재 공개 엔드포인트 구성에 따라 달라질 수 있습니다.

## 호환성 키

호환성 엔드포인트은 `<channel_id>:<password>`를 `compat_key`로 사용합니다.

| 소스 | 주요 위치 |
| :--- | :--- |
| ntfy | `/ntfy/{topic}`, 여기서 `{topic}`는 `compat_key` |
| ServerChan | `/serverchan/{sendkey}`, 여기서 `{sendkey}`는 `compat_key` |
| Bark v1 | `/bark/{device_key}/{body}`, 여기서 `{device_key}`는 `compat_key` |
| Bark v2 | JSON 필드 `device_key` |

예:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -d "NAS backup completed"
```

호환성 키에는 채널 비밀번호가 포함되어 있으며 비밀로 취급되어야 합니다.

## MCP OAuth

MCP OAuth 모드에서는 AI 보조자가 도구 호출 시 채널 비밀번호를 전달해서는 안 됩니다. 권장되는 흐름은 다음과 같습니다.

1. MCP 클라이언트가 `https://gateway.example.com/mcp`에 연결됩니다.
2. 사용자가 바인드 링크를 엽니다.
3. 사용자는 채널 ID와 비밀번호를 입력하고 인증을 확인합니다.
4. Gateway는 범위가 제한된 OAuth 토큰을 MCP 클라이언트에 발급합니다.
5. 도구 호출은 바인딩된 채널에 대해 OAuth 인증을 사용합니다.

레거시 MCP 모드는 여전히 각 도구 호출에서 `password`를 전달할 수 있지만 개인 또는 신뢰할 수 있는 환경에 가장 적합합니다. 프로덕션 통합에서는 OAuth를 선호합니다.

## 보안 권장 사항

- 채널 비밀번호, 호환성 키 또는 Gateway 토큰을 커밋하지 마세요.
- 제작시에는 HTTPS를 사용하세요.
- 공개 예시에서 실제 채널 비밀번호를 하드코딩하지 마세요.
- 자체 호스팅 게이트웨이의 경우 `PUSHGO_TOKEN`를 활성화하고 HTTP 수신기를 역방향 프록시 뒤에 배치합니다.
- AI 보조자 통합의 경우 모델이 채널 비밀번호를 직접 보유하지 않도록 MCP OAuth를 선호합니다.
- 채널 비밀번호와 Gateway 토큰을 독립적으로 순환합니다. 동일한 값으로 설정하지 마십시오.