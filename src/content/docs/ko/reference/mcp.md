---
title: 모델 컨텍스트 프로토콜(MCP)
description: MCP 및 OAuth2를 사용하여 PushGo를 AI 보조 워크플로에 통합하세요.
---
PushGo Gateway는 MCP HTTP 서버 역할을 할 수 있으므로 MCP 지원 AI 보조자가 Message를 보내고, Event를 관리하고, 승인된 채널 범위 내에서 Thing을 업데이트할 수 있습니다. 사용자가 모델에 채널 비밀번호를 제공하는 대신 브라우저에서 채널을 바인딩할 수 있도록 OAuth2 인증이 권장됩니다.

## 적합한 사용 사례

- 작업이 완료된 후 AI 보조자가 PushGo 알림을 보내도록 합니다.
- AI 보조자가 장기 실행 작업을 Event로 동기화하도록 하세요.
- AI 보조자이 서비스, 디바이스 또는 작업의 Thing을 업데이트하도록 합니다.
- 타사 MCP 클라이언트에 범위가 지정된 채널 액세스를 제공합니다.

MCP는 사용자 확인을 대체해서는 안 됩니다. 영향력이 큰 워크플로는 클라이언트 또는 오케스트레이션 계층에서 계속 확인을 유지해야 합니다.

## 엔드포인트

```text
https://your-gateway-domain/mcp
```

퍼블릭 Gateway가 MCP/OAuth를 활성화하는 경우 해당 지역의 `/mcp` 엔드포인트를 사용하세요. 자체 호스팅 배포에서는 외부에서 연결할 수 있는 `PUSHGO_PUBLIC_BASE_URL`를 설정해야 합니다.

## 개인 Gateway에서 MCP 활성화

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

일반 설정:

| 환경 변수 | 기본값 | 설명 |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | 동적 클라이언트 등록을 활성화합니다. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | 없음 | `client_id:client_secret` 형식의 사전 정의 OAuth 클라이언트입니다. 여러 클라이언트는 줄바꿈이나 세미콜론으로 구분합니다. |

클라이언트가 DCR을 지원하지 않으면 `PUSHGO_MCP_PREDEFINED_CLIENTS`를 사용하십시오.

## 인증 모드

| 모드 | Channel 비밀번호 | 적합한 용도 | 위험 |
| :--- | :--- | :--- | :--- |
| OAuth2 인증 | 도구 호출에서 전달되지 않음 | AI 비서, 제3자 클라이언트, 생산 | 범위 및 채널 부여로 제한됩니다. |
| 레거시 모드 | 모든 도구 호출에 통과됨 | 개인 스크립트, 신뢰할 수 있는 환경 | 발신자는 채널 비밀번호를 직접 보유합니다. |

프로덕션에서는 OAuth2 인증을 권장합니다.

## 사용자 바인딩 흐름

1. MCP 클라이언트가 `/mcp`에 연결됩니다.
2. 클라이언트는 OAuth 또는 DCR을 통해 OAuth2 클라이언트 ID를 얻습니다.
3. 보조자가 `pushgo.channel.bind.start`를 호출합니다.
4. 사용자는 반환된 `bind_url`를 엽니다.
5. 사용자는 채널 ID와 비밀번호를 입력하고 인증 범위를 확인합니다.
6. 어시스턴트는 `pushgo.channel.bind.status`를 폴링합니다.
7. 승인 후 보조자는 바인딩된 채널 범위 내에서 도구를 호출할 수 있습니다.

바인드 세션과 token 수명은 현재 Gateway 런타임 프로필이 관리합니다. v1.2.9에서는 공개 CLI/env 옵션이 아닙니다.

## 도구

### Message

| 도구 | 목적 |
| :--- | :--- |
| `pushgo.message.send` | 일회용 Message를 보냅니다. `title`, `body`, `url`, `images`, `severity`, `ttl`, `metadata`, `thing_id` 및 관련 필드를 지원합니다. |

### Event

| 도구 | 목적 |
| :--- | :--- |
| `pushgo.event.create` | 수명 주기 Event를 생성하고 `event_id`를 반환합니다. |
| `pushgo.event.update` | 기존 Event를 업데이트합니다. |
| `pushgo.event.close` | 기존 Event를 닫습니다. |

### Thing

| 도구 | 목적 |
| :--- | :--- |
| `pushgo.thing.create` | 지속 엔터티를 생성하고 `thing_id`를 반환합니다. |
| `pushgo.thing.update` | 엔터티 속성을 업데이트합니다. |
| `pushgo.thing.archive` | 엔터티를 보관합니다. |
| `pushgo.thing.delete` | 엔터티를 삭제하거나 폐기합니다. |

### Channel

| 도구 또는 자원 | 목적 |
| :--- | :--- |
| `pushgo.channel.bind.start` | 바인드 또는 취소 세션을 생성하고 `bind_url`를 반환합니다. |
| `pushgo.channel.bind.status` | 바인드 세션 상태를 확인합니다. |
| `pushgo.channel.list` | 현재 승인된 채널을 나열합니다. |
| `pushgo.channel.unbind` | 채널 승인을 취소합니다. |
| `pushgo://channels` | 승인된 채널 자원 목록. |
| `pushgo://channels/{channel_id}` | 한 채널의 기본 정보입니다. |

## 클라이언트 구성 참고 사항

- MCP 엔드포인트는 `https://your-gateway-domain/mcp`입니다.
- 역방향 프록시는 `Host` 및 `X-Forwarded-Proto`를 올바르게 전달해야 합니다.
- 자체 호스팅 배포에서는 `PUSHGO_PUBLIC_BASE_URL`를 외부에서 연결할 수 있는 HTTPS 루트 URL로 설정해야 합니다.
- OAuth 발급자 메타데이터 또는 바인드 링크에 내부 주소가 포함되어 있는 경우 먼저 `PUSHGO_PUBLIC_BASE_URL`를 확인하세요.
- 클라이언트가 DCR을 지원하지 않는 경우 사전 정의된 클라이언트를 사용하십시오.

## 작업

- MCP 부여는 지속됩니다. 데이터베이스나 저장소 디렉터리를 일회용 캐시로 취급하지 마십시오.
- v1.2.9에서 token 및 바인드 세션 수명은 프로필 소유 런타임 설정입니다. TTL 환경 변수를 설정하지 말고 적절한 런타임 프로필을 선택하세요.
- 사전 정의된 클라이언트 비밀을 정기적으로 교체합니다.
- 고위험 자동화를 위해 모든 것을 하나의 채널에 승인하는 대신 별도의 채널을 사용하십시오.
- 운영 디버깅을 위해 Gateway 구조화된 로그 및 통계를 사용합니다.

## 문제 해결

| 증상 | 확인 사항 |
| :--- | :--- |
| 클라이언트가 OAuth 메타데이터를 검색할 수 없습니다. | `PUSHGO_PUBLIC_BASE_URL`는 외부 HTTPS URL이어야 합니다. 역방향 프록시는 잘 알려진 경로를 전달해야 합니다. |
| 바인드 링크가 열리지 않음 | 공용 DNS, HTTPS 인증서, reverse proxy 경로, `PUSHGO_PUBLIC_BASE_URL`, 바인드 세션 만료 여부. |
| DCR 실패 | 클라이언트 DCR 지원 및 `PUSHGO_MCP_DCR_ENABLED`. |
| 도구 호출로 `password` 요청 | 레거시 모드에 있거나 OAuth 인증이 불완전할 수 있습니다. |
| 승인되었지만 Channel이 보이지 않음 | 바인딩 세션 완료 여부, scope, Channel 권한 취소 여부를 확인합니다. |