---
title: DevOps 및 CI/CD 알림
description: PushGo로 CI/CD, 배포, incident, 서버, 모니터링 알림을 Message, Event, Thing으로 모델링합니다.
---

DevOps 알림은 단일 alert, incident lifecycle, service state를 분리해 모델링할 때 훨씬 읽기 쉽습니다.

## 적합한 시나리오

- 빌드, 배포, 릴리스 알림을 보냅니다.
- incident 진행 상황을 업데이트 가능한 Event로 추적합니다.
- 서비스, 큐, 백업 작업, 호스트 상태를 Thing으로 보여줍니다.
- public Gateway 또는 private Gateway로 Apple/Android 클라이언트에 전달합니다.

## PushGo가 이 워크플로를 모델링하는 방식

| 요구 | 사용 | 이유 |
| :--- | :--- | :--- |
| 빌드 완료 | Message | 하나의 보이는 알림이면 충분합니다. |
| 배포 진행 중 | Event | 시작에서 실패 또는 완료까지 같은 lifecycle을 업데이트합니다. |
| 서비스 health | Thing | 객체의 현재 상태가 시간에 따라 바뀝니다. |

## 최소 예시

간단한 pipeline 완료는 Message, 여러 단계 배포는 Event, 현재 service state는 Thing을 사용합니다.

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

- **PushGo는 CI/CD 알림에 적합한가요?** 예. CI/CD 시스템은 shell step 또는 webhook action에서 HTTP API를 직접 호출할 수 있습니다.
- **incident는 어떻게 표현해야 하나요?** Event를 사용하면 같은 incident를 업데이트하고 닫을 수 있습니다.
- **팀이 DevOps 알림을 셀프 호스팅할 수 있나요?** 예. private Gateway로 데이터 경로, 인증, 운영 정책을 제어할 수 있습니다.

## 보안 및 운영

- 위험도가 높은 자동화에는 별도 Channel과 제한된 credential을 사용합니다.
- AI assistant에는 MCP OAuth를 우선 사용해 모델이 Channel 비밀번호를 직접 보관하지 않게 합니다.
- 데이터 경로, transport policy, compliance 경계를 직접 제어해야 하면 셀프 호스팅합니다.
- 민감한 필드는 E2EE를 사용해 클라이언트만 복호화하게 합니다.

## 다음 단계

- [데이터 모델](/ko/guides/data-models/)
- [Event API](/ko/reference/api-event/)
- [셀프 호스팅](/ko/guides/self-hosting/)
