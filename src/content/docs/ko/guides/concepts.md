---
title: 핵심 개념
description: PushGo의 Channel, Gateway, 클라이언트, 세 가지 데이터 모델을 이해합니다.
---
PushGo는 스크립트, 서비스, 디바이스에서 Channel을 구독한 클라이언트까지 이어지는 동기화 경로로 볼 수 있습니다. 단순히 텍스트를 시스템 알림으로 바꾸는 도구가 아니라, Event의 수명 주기와 Thing의 현재 상태를 보존해 기록, 필터링, 자동화가 구조를 잃지 않도록 합니다.

## 개념 모델

```text
Sender -> Gateway -> Channel -> Subscribed devices
                  |
                  +-> Message / Event / Thing
```

- **Sender**: 스크립트, 서버, Home Assistant, CI/CD 파이프라인, AI 어시스턴트.
- **Gateway**: 요청을 검증하고, 상태를 저장하며, 전달 경로를 선택해 데이터를 디스패치합니다.
- **Channel**: 하나 이상의 디바이스가 구독하는 통신 공간입니다. 요청에는 `channel_id`와 `password`가 필요합니다.
- **클라이언트**: Apple 클라이언트는 APNs로 알림을 받습니다. Android 클라이언트는 FCM과 private transport를 함께 사용할 수 있습니다.
- **데이터 모델**: PushGo는 일회성 알림, 수명 주기가 있는 프로세스, 지속 상태를 서로 다른 객체로 다룹니다.

## Channel: 권한과 구독의 경계

Channel은 PushGo의 기본 경계입니다. 여러 디바이스가 하나의 Channel을 구독할 수 있고, 여러 Sender가 자격 증명을 알고 있다면 같은 Channel에 쓸 수 있습니다.

| 개념 | 역할 |
| :--- | :--- |
| `channel_id` | 요청을 보낼 대상 Channel을 식별합니다. |
| `password` | 해당 Channel에 대한 쓰기를 승인합니다. |
| 구독한 디바이스 | Channel에 수락된 콘텐츠를 받습니다. |

Channel 비밀번호는 Gateway 관리자 비밀번호가 아닙니다. 공개 Gateway와 private Gateway 모두 Channel 수준 인증을 사용하며, private Gateway는 여기에 Gateway 수준 Bearer 토큰을 추가할 수 있습니다.

## Gateway: 수락, 상태, 전달

Gateway가 요청을 받으면 다음 순서로 처리합니다.

1. 요청 형식, Channel 자격 증명, 선택적인 Gateway Bearer 토큰을 검증합니다.
2. Message, Event, Thing 상태를 생성하거나 업데이트합니다.
3. APNs, FCM, Android private transport를 통해 구독한 디바이스로 콘텐츠를 전달합니다.

HTTP 응답은 Gateway가 요청을 수락했는지를 나타냅니다. 실제 시스템 알림 전달은 비동기로 진행되므로, `accepted`는 요청이 디스패치 경로에 들어갔다는 뜻이지 모든 디바이스가 이미 알림을 표시했다는 뜻은 아닙니다.

## 세 가지 데이터 모델

PushGo의 핵심은 알림 필드를 계속 늘리는 것이 아니라, 표현하려는 대상에 맞는 모델을 고르는 것입니다.

| 모델 | 의미 | 예 | 주요 API |
| :--- | :--- | :--- | :--- |
| Message | 일회성 알림 | 디스크 경고, 백업 완료, 가격 하락 | `POST /message` |
| Event | 업데이트와 종료가 있는 프로세스 | 배포, 장애 처리, 문 열림에서 닫힘까지 | `/event/create`, `/event/update`, `/event/close` |
| Thing | 지속 엔터티의 현재 상태 | NAS, 센서, 방, 네트워크 서비스 | `/thing/create`, `/thing/update`, `/thing/archive`, `/thing/delete` |

모델을 고르기 전에 먼저 질문해 보세요. 한 번 알려야 하는 일인가요, 진행 과정을 추적해야 하나요, 아니면 객체의 현재 상태를 동기화해야 하나요?

## 전달 경로

PushGo는 모든 플랫폼에 같은 백그라운드 연결 방식을 강제하지 않습니다.

| 플랫폼 | 기본 경로 | 참고 |
| :--- | :--- | :--- |
| Apple 플랫폼 | APNs | iOS, macOS, watchOS에서 시스템이 관리하는 전달 경로입니다. |
| Android | FCM + private transport | FCM은 디바이스를 깨우는 데 쓰고, private transport는 더 낮은 지연 시간의 동기화에 사용합니다. |
| 자체 호스팅 Gateway | 배포 구성에 따라 다름 | Android private transport를 위해 WSS, QUIC, Raw TCP를 활성화할 수 있습니다. |

클라이언트 기능은 [앱 및 플랫폼 지원](/ko/guides/apps/)을 참조하세요.

## 보안 계층

| 계층 | 보호하는 것 |
| :--- | :--- |
| Channel 비밀번호 | Channel에 대한 무단 쓰기를 막습니다. |
| Gateway Bearer 토큰 | private Gateway 인스턴스를 호출할 수 있는 주체를 제한합니다. |
| HTTPS/TLS | 전송 중인 자격 증명과 요청을 보호합니다. |
| E2EE `ciphertext` | Gateway는 암호문만 중계하고, 민감한 필드는 클라이언트가 로컬에서 복호화하게 합니다. |
| MCP OAuth | AI 어시스턴트가 Channel 비밀번호를 직접 보유하지 않고도 승인된 Channel 범위 안에서 동작할 수 있게 합니다. |

첫 테스트 알림을 보내는 단계라면 Channel과 Message만 이해해도 충분합니다. 장기 상태나 자체 Gateway가 필요해질 때 데이터 모델, 인증, 자체 호스팅 문서를 이어서 읽으면 됩니다.
