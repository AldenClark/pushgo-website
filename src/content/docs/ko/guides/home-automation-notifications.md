---
title: NAS, IoT, Home Assistant 알림
description: PushGo를 NAS alert, IoT device, Home Assistant automation, 장기 device state 업데이트에 사용합니다.
---

홈 자동화와 기기 모니터링은 단일 알림만으로 부족할 때가 많습니다. PushGo는 알림, Event, current state를 함께 다룹니다.

## 적합한 시나리오

- NAS 디스크, 백업, 서비스 alert를 보냅니다.
- Home Assistant를 HTTP 또는 Webhook 방식으로 연결합니다.
- 기기, 센서, 백업 작업, 미디어 서비스를 Thing으로 모델링합니다.
- 홈 데이터를 직접 제어해야 할 때 private Gateway를 사용합니다.

## PushGo가 이 워크플로를 모델링하는 방식

| 요구 | 사용 | 이유 |
| :--- | :--- | :--- |
| 도어벨 이미지 또는 디스크 경고 | Message | 내용은 단일 alert입니다. |
| 백업 또는 미디어 스캔 진행 | Event | 완료까지 진행 상황을 업데이트할 수 있습니다. |
| 센서 또는 기기 상태 | Thing | 각 과거 알림보다 최신 상태가 중요합니다. |

## 최소 예시

NAS 스크립트는 `/message`로 디스크 경고를 보내고, 백업 작업은 Event를 생성해 성공 또는 실패까지 업데이트할 수 있습니다.

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

- **PushGo가 Home Assistant webhook을 받을 수 있나요?** 예. Home Assistant automation은 webhook 또는 REST action으로 PushGo HTTP API를 호출할 수 있습니다.
- **오래된 기기 알림을 줄이는 방법은?** Thing을 사용해 같은 객체의 현재 상태를 표시합니다.
- **private network에서 실행할 수 있나요?** 예. 데이터 경로 또는 transport policy를 제어하려면 Gateway를 셀프 호스팅합니다.

## 보안 및 운영

- 위험도가 높은 자동화에는 별도 Channel과 제한된 credential을 사용합니다.
- AI assistant에는 MCP OAuth를 우선 사용해 모델이 Channel 비밀번호를 직접 보관하지 않게 합니다.
- 데이터 경로, transport policy, compliance 경계를 직접 제어해야 하면 셀프 호스팅합니다.
- 민감한 필드는 E2EE를 사용해 클라이언트만 복호화하게 합니다.

## 다음 단계

- [사용 사례](/ko/guides/use-cases/)
- [Thing API](/ko/reference/api-thing/)
- [셀프 호스팅](/ko/guides/self-hosting/)
