---
title: 시작하기
description: 클라이언트를 설치하고, 채널을 만들고, 첫 번째 PushGo 알림을 받으세요.
---
이 가이드는 PushGo를 처음 사용하는 사용자를 위한 것입니다. 마지막에는 사용 가능한 채널과 첫 번째 Message를 보내는 작동하는 HTTP 요청이 생성됩니다.

## 전제조건

- 출시된 PushGo 클라이언트가 설치된 디바이스입니다.
- `curl`를 실행할 수 있는 단말기입니다.
- 채널 ID와 채널 비밀번호. 클라이언트에서 새 채널을 생성하거나 다른 디바이스에서 공유하는 채널을 구독할 수 있습니다.

## 1. 클라이언트 설치

릴리스된 클라이언트 중 하나를 설치합니다.

| 플랫폼 | 다운로드 | 요구사항 |
| :--- | :--- | :--- |
| iOS/macOS/watchOS | [앱스토어](https://apps.apple.com/app/pushgo) | iOS 18+, macOS 15+, watchOS 11+ |
| Android | [GitHub 릴리스](https://github.com/AldenClark/pushgo-android/releases) | Android 12 이상 |

## 2. Channel 생성 또는 구독

채널은 PushGo 쓰기 경계입니다. 요청은 채널로 이동하고 구독된 디바이스는 전달 대상이 됩니다.

### 새 Channel 만들기

1. 클라이언트를 엽니다.
2. 추가 작업을 사용합니다.
3. 채널 생성을 선택하세요.
4. 인식할 수 있는 이름과 8~128자의 비밀번호를 입력합니다.
5. 생성된 채널 ID와 비밀번호를 저장하세요.

### 기존 Channel 구독

1. 클라이언트를 엽니다.
2. 구독채널을 선택하세요.
3. 채널 ID와 비밀번호를 입력하세요.
4. 구독 후 기기는 해당 채널의 콘텐츠를 수신하게 됩니다.

## 3. 공개 Gateway를 선택하세요

공용 게이트웨이는 서버를 배포하지 않고 테스트하는 데 유용합니다.

| 지역 | Gateway |
| :--- | :--- |
| 글로벌 | `https://gateway.pushgo.dev` |
| 중국 본토 | `https://gateway.pushgo.cn` |

귀하와 수신 디바이스에 가장 가까운 지역을 선택하십시오. 자체 호스팅하는 경우 예시 URL을 자체 Gateway URL로 바꾸세요. Gateway가 `PUSHGO_TOKEN`를 사용하는 경우 `Authorization: Bearer <token>`를 추가하세요.

## 4. 첫 번째 Message 보내기

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Hello from PushGo",
    "body": "This is a test notification.",
    "severity": "normal"
  }'
```

성공적인 응답은 다음과 같습니다.

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "message_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true`는 Gateway가 요청을 수락했음을 의미합니다. `accepted=true`는 발송에 들어갔다는 의미입니다. 최종 알림 표시는 여전히 디바이스 상태, 플랫폼 푸시 서비스 및 private transport 상태에 따라 달라집니다.

## 일반적인 문제

| 증상 | 확인 |
| :--- | :--- |
| `400` 응답 | JSON 유효성, 필드 이름 및 필수 `title`, `channel_id`, `password`. |
| `401` 응답 | 개인 Gateway `PUSHGO_TOKEN` 및 `Authorization: Bearer <token>`. |
| `404` 응답 | Channel ID 및 디바이스가 채널을 생성 또는 구독했는지 여부. |
| `success=true`이지만 알림이 없습니다 | 디바이스 알림 권한, 네트워크 상태, Android private transport, APNs/FCM 전달. |
| 페이로드가 너무 큼 | JSON 본체 최대 크기는 32KB입니다. 바이너리 데이터를 삽입하는 대신 이미지 URL을 사용하세요. |

자세한 상태 코드는 [한계 및 오류](/ko/reference/limits-errors/)를 참조하세요.

## 다음 단계

- PushGo에 세 가지 모델이 있는 이유를 이해하려면 [핵심 개념](/ko/guides/concepts/)을 읽어보세요.
- Message, Event, Thing를 선택하려면 [데이터 모델](/ko/guides/data-models/)을 읽어보세요.
- 실제 스크립트를 통합하려면 [Use Cases](/ko/guides/use-cases/)를 읽어보세요.
- 직접 Gateway를 실행하려면 [셀프호스팅](/ko/guides/self-hosting/)을 읽어보세요.