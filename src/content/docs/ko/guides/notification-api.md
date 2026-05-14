---
title: 스크립트와 서비스를 위한 푸시 알림 API
description: curl, Webhook, cron, CI/CD, NAS 알림, 자동화 스크립트에서 PushGo를 HTTP 알림 API로 사용합니다.
---

PushGo는 스크립트와 서비스 결과를 사용자에게 전달하면서 Event와 Thing 기반의 구조화된 상태도 유지할 수 있는 HTTP API를 제공합니다.

## 적합한 시나리오

- curl, cron, 셸 스크립트, Webhook에서 알림을 보냅니다.
- 작업 완료, 가격 알림, 이미지 스냅샷, 모니터링 결과를 전달합니다.
- 모든 것을 텍스트로 쌓지 않고 Event와 Thing으로 모델링합니다.
- 호환 엔드포인트에서 시작해 네이티브 PushGo API로 이전합니다.

## PushGo가 이 워크플로를 모델링하는 방식

| 요구 | 사용 | 이유 |
| :--- | :--- | :--- |
| 단일 스크립트 알림 | Message | 간단하고 일시적이며 curl로 테스트하기 쉽습니다. |
| 진행 상황이 있는 작업 | Event | 같은 Event를 완료까지 업데이트할 수 있습니다. |
| 기기 또는 서비스 현재 상태 | Thing | 오래된 알림 목록 대신 최신 상태를 보여줍니다. |

## 최소 예시

네이티브 `/message` 엔드포인트는 JSON을 받고 Gateway가 요청을 dispatch 흐름에 수락했는지 반환합니다.

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

- **curl로 알림을 보낼 수 있나요?** 예. Message API는 curl, 스크립트, 간단한 HTTP 클라이언트에서 호출하기 좋습니다.
- **PushGo는 휴대폰 알림 API뿐인가요?** 아닙니다. Event lifecycle과 Thing 현재 상태도 모델링합니다.
- **API를 셀프 호스팅할 수 있나요?** 예. 자체 Gateway로 인증, 저장소, transport, MCP/OAuth를 제어할 수 있습니다.

## 보안 및 운영

- 위험도가 높은 자동화에는 별도 Channel과 제한된 credential을 사용합니다.
- AI assistant에는 MCP OAuth를 우선 사용해 모델이 Channel 비밀번호를 직접 보관하지 않게 합니다.
- 데이터 경로, transport policy, compliance 경계를 직접 제어해야 하면 셀프 호스팅합니다.
- 민감한 필드는 E2EE를 사용해 클라이언트만 복호화하게 합니다.

## 다음 단계

- [시작하기](/ko/guides/getting-started/)
- [Message API](/ko/reference/api-message/)
- [셀프 호스팅](/ko/guides/self-hosting/)
