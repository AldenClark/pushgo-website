---
title: 소개
description: PushGo가 무엇인지, 누구를 위한 것인지, 어디서 시작해야 하는지 알아보세요.
---
**PushGo**는 개인 자동화, 서버/NAS 모니터링, DevOps, IoT 및 AI 보조 워크플로를 위한 오픈 소스 알림 및 상태 동기화 시스템입니다. 클라이언트, Gateway 및 HTTP API로 구성됩니다. 공용 Gateway를 직접 사용하거나 직접 배포할 수 있습니다.

## PushGo가 해결하는 것

많은 알림 도구는 전화로만 문자를 보냅니다. 간단한 경고에는 충분하지만 작업 진행 상황, 사고 수명 주기, 디바이스 상태 또는 AI 보조 작업이 필요한 경우에는 지저분해집니다.

PushGo는 데이터를 세 가지 모델로 분리합니다.

| 모델 | 목적 | 예 |
| :--- | :--- | :--- |
| Message | 일회성 경고 | 백업 완료, 디스크가 거의 가득 참, 가격 인하 |
| Event | 업데이트 및 종료할 수 있는 프로세스 | 배치, 사고 처리, 문 열림부터 닫힘 |
| Thing | 지속 엔터티 상태 | NAS, 센서, 룸, 네트워크 서비스 |

결과적으로 경고, 프로세스 및 상태가 더 이상 동일한 텍스트 필드에 압축되지 않습니다. 클라이언트와 자동화는 이에 대해 보다 안정적으로 추론할 수 있습니다.

## 시스템 구성요소

```text
Script / Service / AI assistant
        |
        v
PushGo Gateway
        |
        +-- APNs -> Apple clients
        +-- FCM  -> Android clients
        +-- Private transport -> Android low-latency sync
```

Gateway는 인증, API 승인, 상태 저장 및 발송을 처리합니다. 클라이언트는 채널 구독을 수신, 표시, 해독 및 관리합니다.

## 누구를 위한 것인가

- 개인 사용자: 스크립트, 웹후크, 가격 모니터 및 장기 실행 작업.
- 홈 서버 및 NAS 사용자: 디스크, 백업, UPS 및 서비스 상태 모니터링.
- DevOps 사용자: 배포, 빌드, 인시던트 및 서비스 상태.
- IoT / Home Assistant 사용자: 객실, 센서, 보안 Event.
- 셀프 호스팅: 자신의 Gateway에서 데이터, 인증, private transport 및 MCP/OAuth를 제어합니다.

## 어디서부터 시작해야 할까요?

| 목표 | 읽기 |
| :--- | :--- |
| 첫 번째 알림 받기 | [시작하기](/ko/guides/getting-started/) |
| 시스템 작동 방식 이해 | [핵심 개념](/ko/guides/concepts/) |
| 올바른 데이터 모델 선택 | [데이터 모델](/ko/guides/data-models/) |
| 실제 통합 패턴 보기 | [사용 사례](/ko/guides/use-cases/) |
| ntfy, Bark 또는 ServerChan에서 마이그레이션 | [마이그레이션 가이드](/ko/guides/migration/) |
| 나만의 Gateway 배포 | [셀프호스팅](/ko/guides/self-hosting/) |
| AI 비서 통합 | [MCP 참조](/ko/reference/mcp/) |

아직 채널이 없다면 시작하기부터 시작하세요. 통합할 스크립트가 이미 있는 경우 데이터 모델 및 Message API를 읽어보세요.