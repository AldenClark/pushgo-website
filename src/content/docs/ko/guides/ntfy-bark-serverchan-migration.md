---
title: ntfy, Bark, ServerChan에서 이전
description: 기존 ntfy, Bark, ServerChan, Webhook 알림 스크립트를 호환 엔드포인트와 네이티브 모델로 PushGo에 이전합니다.
---

PushGo는 기존 알림 워크플로를 먼저 수용하고, 중요한 경로를 Message, Event, Thing 모델로 단계적으로 이전할 수 있습니다.

## 적합한 시나리오

- 평가 중에도 간단한 스크립트를 계속 동작시킵니다.
- 전체 자동화를 한 번에 다시 쓰지 않고 alert 경로별로 이전합니다.
- 필요한 경우 텍스트 알림을 구조화된 lifecycle 또는 state로 바꿉니다.
- 민감한 워크플로에는 E2EE와 셀프 호스팅을 함께 사용합니다.

## PushGo가 이 워크플로를 모델링하는 방식

| 요구 | 사용 | 이유 |
| :--- | :--- | :--- |
| 단순 이전 알림 | Message | 기존 알림은 일회성 Message로 유지합니다. |
| 상태 변화가 있는 워크플로 | Event | 반복 업데이트는 하나의 lifecycle에 속합니다. |
| 장기 모니터링 객체 | Thing | 같은 entity를 계속 업데이트할 수 있습니다. |

## 최소 예시

낮은 위험의 스크립트는 호환 엔드포인트로 시작하고, 더 풍부한 의미가 필요한 흐름은 `/message`, `/event/*`, `/thing/*`로 이전합니다.

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

- **모든 스크립트를 즉시 다시 써야 하나요?** 아니요. 호환 엔드포인트를 사용하고 가치가 높은 워크플로부터 이전합니다.
- **언제 텍스트 알림만으로 부족한가요?** 진행, 종료, 현재 상태, 이미지, metadata, 보안 요구사항이 있을 때입니다.
- **직접적인 기능 비교인가요?** 아닙니다. 이전은 모델링 결정입니다.

## 보안 및 운영

- 위험도가 높은 자동화에는 별도 Channel과 제한된 credential을 사용합니다.
- AI assistant에는 MCP OAuth를 우선 사용해 모델이 Channel 비밀번호를 직접 보관하지 않게 합니다.
- 데이터 경로, transport policy, compliance 경계를 직접 제어해야 하면 셀프 호스팅합니다.
- 민감한 필드는 E2EE를 사용해 클라이언트만 복호화하게 합니다.

## 다음 단계

- [마이그레이션 가이드](/ko/guides/migration/)
- [Message API](/ko/reference/api-message/)
- [데이터 모델](/ko/guides/data-models/)
