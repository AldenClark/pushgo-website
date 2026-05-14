---
title: 셀프 호스팅 오픈소스 알림 서버
description: PushGo Gateway를 private transport, persistent state, E2EE, MCP/OAuth를 갖춘 셀프 호스팅 알림 서버로 배포합니다.
---

알림 경로, 데이터 저장, Gateway 인증, private transport 정책, MCP/OAuth 엔드포인트를 직접 제어하려면 PushGo를 셀프 호스팅합니다.

## 적합한 시나리오

- 개인 또는 팀 자동화를 위한 private Gateway를 운영합니다.
- 알림, Event, Thing 상태가 public Gateway를 지나지 않게 합니다.
- AI assistant를 위한 자체 HTTPS `/mcp` 엔드포인트를 제공합니다.
- 백업, reverse proxy, 로그, observability를 운영에 포함합니다.

## PushGo가 이 워크플로를 모델링하는 방식

| 요구 | 사용 | 이유 |
| :--- | :--- | :--- |
| 비공개 전달 경로 | Gateway | HTTP API와 transport listener를 자체 인프라에서 제어합니다. |
| 민감한 필드 | E2EE | 클라이언트가 로컬에서 복호화합니다. |
| AI assistant 접근 | MCP OAuth | 사용자가 공개 Gateway URL에서 Channel을 바인딩합니다. |

## 최소 예시

MCP/OAuth를 켜기 전에 `PUSHGO_PUBLIC_BASE_URL`을 외부에서 접근 가능한 HTTPS root로 설정해야 합니다.

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "PushGo 알림",
    "body": "자동화 알림 경로가 동작합니다."
  }'
```

## 이 페이지가 답하는 질문

- **PushGo를 셀프 호스팅 알림 서버로 실행할 수 있나요?** 예. Gateway는 persistent storage와 configurable transport를 갖춘 private deployment에 맞게 설계되었습니다.
- **셀프 호스팅으로 MCP를 쓸 수 있나요?** 예. 공개 HTTPS base URL을 설정하면 `/mcp`와 OAuth route를 제공할 수 있습니다.
- **백업이 필요한가요?** 예. Channel, device, MCP grant, Event, Thing은 persistent storage에 의존합니다.

## 보안 및 운영

- 위험도가 높은 자동화에는 별도 Channel과 제한된 credential을 사용합니다.
- AI assistant에는 MCP OAuth를 우선 사용해 모델이 Channel 비밀번호를 직접 보관하지 않게 합니다.
- 데이터 경로, transport policy, compliance 경계를 직접 제어해야 하면 셀프 호스팅합니다.
- 민감한 필드는 E2EE를 사용해 클라이언트만 복호화하게 합니다.

## 다음 단계

- [셀프 호스팅](/ko/guides/self-hosting/)
- [종단 간 암호화](/ko/reference/e2ee/)
- [MCP 참조](/ko/reference/mcp/)
