---
title: 종단 간 암호화
description: 클라이언트가 민감한 PushGo 필드를 로컬에서 해독할 수 있도록 암호문을 사용하세요.
---
PushGo E2EE는 민감한 비즈니스 분야를 보호합니다. 발신자는 필드를 `ciphertext`로 암호화하고, Gateway는 해당 암호문을 중계하며, 클라이언트는 키가 구성된 후 로컬로 암호를 해독합니다.

## 보호하는 것

| 내용 | E2EE로 보호됨 | 참고 |
| :--- | :--- | :--- |
| `ciphertext` 내부 사업 분야 | 예 | Gateway는 일반 텍스트를 읽을 수 없습니다. |
| 일반 요청 필드 | 아니요 | `channel_id`, `password`, `severity` 및 경로 ID는 일반 요청 필드입니다. |
| HTTP 헤더 | 아니요 | E2EE가 아닌 HTTPS/TLS로 보호됩니다. |
| 전달 메타데이터 | 아니요 | Gateway에는 인증, 라우팅 및 발송을 위한 기본 메타데이터가 여전히 필요합니다. |

E2EE는 Gateway 인증을 대체하지 않습니다. 여전히 채널 자격 증명, 선택적 Gateway Bearer 토큰 및 HTTPS가 필요합니다.

## 암호화 형식

PushGo 클라이언트는 AES-GCM을 지원합니다. 키 길이에 따라 AES 변형이 결정됩니다.

| 키 길이 | 알고리즘 | 논스/IV | 인증 태그 |
| :--- | :--- | :--- | :--- |
| 16바이트 | AES-128-GCM | 12바이트 | 16바이트 |
| 24바이트 | AES-192-GCM | 12바이트 | 16바이트 |
| 32바이트 | AES-256-GCM | 12바이트 | 16바이트 |

바이너리 레이아웃:

```text
[ ciphertext (N bytes) ][ auth tag (16 bytes) ][ nonce / iv (12 bytes) ]
```

전체 바이너리 blob을 Base64로 인코딩하여 API `ciphertext` 필드에 배치합니다.

## 암호화 가능한 필드

암호 해독 후 `ciphertext`에는 JSON 객체가 포함되어야 합니다. 클라이언트는 다음 표준 필드를 인식하고 이를 알림 페이로드에 다시 씁니다.

### Message 필드

| 필드 | 유형 | 행동 |
| :--- | :--- | :--- |
| `title` | `string` | 알림 제목을 재정의합니다. |
| `body` | `string` | Message 본문을 재정의합니다. |
| `url` | `string` | 클릭연결 URL을 재정의합니다. |
| `images` | `string[]` 또는 JSON 문자열 | 이미지 목록을 재정의합니다. |
| `tags` | `string[]` 또는 JSON 문자열 | 태그 목록을 재정의합니다. |
| `metadata` | `object` 또는 JSON 문자열 | 메타데이터를 재정의합니다. |

### Event 필드

| 필드 | 유형 | 행동 |
| :--- | :--- | :--- |
| `description` | `string` | Event 설명을 재정의합니다. |
| `status` | `string` | Event 상태를 재정의합니다. |
| `message` | `string` | Event Message를 재정의합니다. |
| `started_at` | `number` | Event 시작 시간을 재정의합니다. |
| `ended_at` | `number` | Event 종료 시간을 재정의합니다. |
| `attrs` | `object` 또는 JSON 문자열 | Event 속성 패치를 재정의합니다. |

### Thing 필드

| 필드 | 유형 | 행동 |
| :--- | :--- | :--- |
| `primary_image` | `string` | 기본 이미지를 재정의합니다. |
| `state` | `string` | 엔터티 상태를 재정의합니다. |
| `created_at` | `number` | 생성 시간을 재정의합니다. |
| `deleted_at` | `number` | 삭제 시간을 재정의합니다. |
| `external_ids` | `object` 또는 JSON 문자열 | 외부 ID를 재정의합니다. |
| `location_type` | `string` | 위치 유형을 재정의합니다. |
| `location_value` | `string` | 위치 값을 재정의합니다. |
| `location` | `object` 또는 JSON 문자열 | 위치 객체를 재정의합니다. |

:::note
`channel_id`, `password`, `event_id`, `thing_id`, `event_time`, `observed_at` 및 `severity`와 같이 라우팅 및 전달 우선 순위에 필요한 필드는 일반적으로 일반 텍스트로 유지되어야 합니다.
:::

## 파이썬 예제

```python
import base64
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_payload(key_hex, payload):
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    plaintext = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    cipher_and_tag = aesgcm.encrypt(nonce, plaintext, None)
    return base64.b64encode(cipher_and_tag + nonce).decode("utf-8")


payload = {
    "title": "Database lag",
    "body": "Replica lag exceeded 60 seconds.",
    "tags": ["encrypted", "database"],
    "metadata": {"source": "replica-monitor"}
}

key_hex = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
print(encrypt_payload(key_hex, payload))
```

`key_hex` 예제는 AES-256-GCM의 32바이트 키입니다. 프로덕션에서 안전하게 생성된 임의 키를 사용하고 클라이언트에서 로컬로 동일한 키를 구성합니다.

## API 사용법

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Encrypted message",
    "body": "Your client will try to decrypt ciphertext.",
    "severity": "normal",
    "ciphertext": "BASE64_ENCODED_CIPHERTEXT"
  }'
```

일반 `title` 및 `body`는 키가 없거나 암호 해독에 실패한 클라이언트에 대한 대체 표시가 될 수 있습니다. `ciphertext` 안에 정말 민감한 콘텐츠를 담으세요.

## 복호화 상태

| 상태 | 의미 |
| :--- | :--- |
| `decryptOk` | 암호 해독에 성공했으며 하나 이상의 필드가 적용되었습니다. |
| `decryptFailed` | 암호문이 존재하지만 암호 해독 또는 구문 분석에 실패했습니다. |
| `notConfigured` | 클라이언트에 구성된 사용 가능한 키가 없습니다. |
| `algMismatch` | 구성된 알고리즘이 페이로드와 일치하지 않습니다. |

## 문제 해결

| 문제 | 확인 |
| :--- | :--- |
| 암호 해독 실패 | 동일한 키, 완전한 Base64 및 바이너리 레이아웃 `ciphertext + tag + nonce`. |
| 클라이언트는 필드를 재정의하지 않습니다 | 복호화된 JSON는 객체여야 하며 필드 이름은 표준이어야 합니다. |
| Gateway는 여전히 제목을 볼 수 있습니다 | 일반 요청 필드는 E2EE로 보호되지 않습니다. `ciphertext`에 민감한 제목을 넣으세요. |
| `severity`는 암호화되지 않습니다 | Gateway 및 플랫폼 푸시 서비스에는 우선순위 정보가 필요하기 때문에 권장됩니다. |