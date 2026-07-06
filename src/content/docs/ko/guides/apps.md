---
title: 앱 및 플랫폼 지원
description: 출시된 PushGo 클라이언트, 시스템 요구 사항 및 플랫폼 제공 경로를 이해하세요.
---
PushGo는 현재 Apple 플랫폼 클라이언트, Android 클라이언트 및 Gateway를 게시하고 있습니다. 이 웹사이트에서는 공개적으로 사용 가능한 릴리스에 대해서만 설명합니다.

## 플랫폼 개요

| 플랫폼 | 다운로드 | 요구 사항 | 기본 전달 경로 | Private transport |
| :--- | :--- | :--- | :--- | :--- |
| iOS | 앱 스토어 | iOS 18 이상 | APNs | 아니요 |
| macOS | 앱 스토어 | 맥OS 15+ | APNs | 아니요 |
| 워치OS | 앱 스토어 | watchOS 11+ | APNs | 아니요 |
| Android | GitHub 릴리스 | Android 9 이상 | FCM + Private transport | 예, QUIC / Raw TCP / WSS |

## Apple 클라이언트

Apple 클라이언트는 시스템 푸시 모델을 따릅니다. APNs는 백그라운드 전달을 처리합니다.

잘 맞는다:

- iPhone, Mac, Apple Watch에서 개인 알림을 받습니다.
- 리치 콘텐츠에 대한 시스템 알림 우선순위 및 알림 확장 기능을 사용합니다.
- 장기간 실행되는 백그라운드 연결을 유지하는 대신 클라이언트 동작을 운영 체제에 가깝게 유지합니다.

참고:

- Apple 클라이언트는 PushGo Android private transport를 사용하지 않습니다.
- 백그라운드 전달은 APNs, 알림 권한, 집중 모드 및 디바이스 네트워크 상태에 따라 다릅니다.
- E2EE 필드는 키가 구성된 후 로컬로 해독됩니다. 키가 구성되지 않거나 암호 해독이 실패하면 클라이언트는 대체 표시 상태를 유지합니다.

## Android 클라이언트

Android 클라이언트는 공급자 전달과 PushGo private transport를 모두 지원합니다.

잘 맞는다:

- 대기 시간이 짧은 상태 동기화.
- 디바이스가 자체 동기화 진입점에 연결되는 자체 호스팅 Gateway 배포.
- 활성 동기화가 필요할 때 private transport과 결합된 FCM 깨우기.

private transport은 Gateway 프로필과 현재 네트워크 상태에서 선택됩니다.

| Transport | 사용 사례 |
| :--- | :--- |
| WSS | 가장 보편적인; HTTPS를 재사용하며 최고의 기본 private transport입니다. |
| QUIC | UDP 포트가 노출될 수 있으면 대기 시간이 줄어듭니다. |
| Raw TCP | 제어된 네트워크 또는 전용 레이어 4 진입점. |

private transport에는 일치하는 전송을 활성화하고 연결 가능한 포트, 인증서 및 공개 기본 URL을 알리기 위해 Gateway가 필요합니다. [셀프 호스팅](/ko/guides/self-hosting/)을 참조하세요.

## Gateway

Gateway는 PushGo의 서버 구성 요소입니다. 그것:

- 채널 비밀번호 및 선택적 게이트웨이 Bearer 토큰의 유효성을 검사합니다.
- Message, Event 및 Thing 요청을 허용합니다.
- Event 및 엔터티 상태를 유지합니다.
- APNs, FCM 또는 Android private transport를 통해 전달됩니다.
- 승인된 채널 범위 내에서 작동하는 AI 보조자에 대해 MCP/OAuth를 활성화할 수 있습니다.

공용 Gateway 또는 자체 호스트를 사용하여 데이터 경로, 인증 정책 및 작업을 제어할 수 있습니다.

## 기능 매트릭스

| 능력 | Apple | Android | Gateway |
| :--- | :--- | :--- | :--- |
| Message 수신 | 예 | 예 | 파견 |
| 디스플레이 Event / Thing | 예 | 예 | 상태를 저장하고 발송합니다 |
| E2EE 필드 암호 해독 | 예 | 예 | 암호문만 중계 |
| Private transport | 아니요 | 예 | 활성화된 private endpoint 필요 |
| MCP/OAuth | 해당 없음 | 해당 없음 | 선택사항 |

알림만 받고 싶다면 클라이언트를 설치하고 [시작하기](/ko/guides/getting-started/)를 따르세요. 데이터 경로 제어 및 private transport이 필요한 경우 자체 호스팅을 계속하십시오.
