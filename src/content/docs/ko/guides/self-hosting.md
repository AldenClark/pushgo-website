---
title: 셀프 호스팅
description: 최소한의 설정부터 프로덕션 운영까지 자체 PushGo 게이트웨이를 배포하세요.
---
셀프 호스팅은 데이터 경로, 인증 정책, 데이터베이스, private transport 및 MCP/OAuth를 제어하려는 사용자를 위한 것입니다. Gateway는 Rust 서비스입니다. HTTP API, WSS 및 MCP/OAuth는 하나의 HTTP 수신기를 공유합니다. QUIC 및 Raw TCP는 별도의 수신 주소를 사용합니다.

## 필요할 때

- 알림, Event 또는 엔터티 상태가 공개 Gateway를 통과하는 것을 원하지 않습니다.
- 자신만의 데이터베이스, 백업, 로그, 모니터링, 용량 정책이 필요합니다.
- 지연 시간이 짧은 Android private transport 동기화를 원합니다.
- 자신의 도메인에 MCP/OAuth를 원합니다.
- 발신자를 제한하려면 게이트웨이 수준의 Bearer 토큰이 필요합니다.

PushGo만 사용해보고 싶다면 공개 Gateway를 사용하고 [시작하기](/ko/guides/getting-started/)를 따르세요.

## 배포 수준

| 레벨 | | 주요 구성 |
| :--- | :--- | :--- |
| 최소 | 로컬 테스트, 단일 사용자 스크립트 | SQLite + HTTP API |
| 생산기지 | 장기 공개 도메인 | HTTPS 역방향 프록시 + 영구 데이터베이스 + Bearer 토큰 |
| Private transport | Android 저지연 동기화 | WSS, 이후 옵션 QUIC / Raw TCP |
| AI 통합 | MCP 클라이언트 및 AI 보조자 | MCP/OAuth + `PUSHGO_PUBLIC_BASE_URL` |

## 최소 배포

최소 설정에는 데이터베이스와 HTTP 리스너만 필요합니다.

```bash
mkdir -p /var/lib/pushgo

docker run -d --name pushgo-gateway \
  -p 6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='sqlite:///var/lib/pushgo/pushgo.db?mode=rwc' \
  -v /var/lib/pushgo:/var/lib/pushgo \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

테스트해보세요:

```bash
curl -X POST http://127.0.0.1:6666/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Private Gateway test",
    "body": "This message came from your own Gateway."
  }'
```

최소 설정은 검증에 유용합니다. 공용 인터넷에 직접 노출하지 마세요.

## 생산기지

프로덕션의 경우 최소한 다음을 수행하십시오.

1. Gateway를 로컬 호스트 또는 개인 네트워크에 바인딩합니다.
2. HTTPS 앞에 Nginx, Caddy 또는 로드 밸런서를 배치합니다.
3. 게이트웨이 수준 Bearer 인증을 위해 `PUSHGO_TOKEN`를 설정합니다.
4. 영구 저장소를 사용하고 이를 백업에 포함합니다.
5. `PUSHGO_PUBLIC_BASE_URL` 및 `PUSHGO_TOKEN_SERVICE_URL`를 명시적으로 설정합니다.

```bash
docker run -d --name pushgo-gateway \
  -p 127.0.0.1:6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='postgres://user:pass@db:5432/pushgo' \
  -e PUSHGO_TOKEN='replace-with-gateway-token' \
  -e PUSHGO_PUBLIC_BASE_URL='https://gateway.example.com' \
  -e PUSHGO_TOKEN_SERVICE_URL='https://token.pushgo.dev' \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

`PUSHGO_TOKEN`를 설정한 후 API 요청에는 다음이 필요합니다.

```http
Authorization: Bearer replace-with-gateway-token
```

채널 ID와 채널 비밀번호는 여전히 요청 본문에 속합니다. 두 레이어의 차이점은 [인증](/ko/reference/auth/)을 참조하세요.

## 공개 지역 엔드포인트

Gateway에 토큰 서비스가 필요한 경우 지역을 명시적으로 구성하세요.

| 지역 | Gateway | 토큰 서비스 |
| :--- | :--- | :--- |
| 글로벌 | `https://gateway.pushgo.dev/` | `https://token.pushgo.dev/` |
| 중국 본토 | `https://gateway.pushgo.cn/` | `https://token.pushgo.cn/` |

비공개 Gateway는 계속해서 공개 토큰 서비스를 사용하거나 배포가 발전함에 따라 다른 서비스로 전환할 수 있습니다.

## 역방향 프록시

HTTP API, WSS 및 MCP/OAuth는 HTTP 수신기를 공유합니다. 역방향 프록시는 일반 HTTP 및 WebSocket 업그레이드를 지원해야 합니다.

```nginx
server {
    listen 443 ssl http2;
    server_name gateway.example.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:6666;
    }
}
```

`PUSHGO_PUBLIC_BASE_URL`는 외부에서 접근 가능한 HTTPS 루트여야 합니다. 그렇지 않으면 MCP 발급자 메타데이터, 바인드 링크 및 클라이언트 프로필 힌트에 내부 주소가 포함될 수 있습니다.

## Android Private transport

`PUSHGO_PRIVATE_TRANSPORTS`를 사용하면 private transport이 활성화됩니다. `wss`로 시작하세요. HTTPS를 재사용하며 가장 덜 복잡한 옵션입니다.

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

낮은 대기 시간이 필요하거나 제어된 네트워크에서 작동하려면 QUIC / Raw TCP를 추가하세요.

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

| 설정 | 설명 |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`, `true`, `none` 또는 `wss` 또는 `quic,tcp,wss`와 같은 명시적 목록입니다. |
| `PUSHGO_PRIVATE_QUIC_BIND` | Gateway가 수신하는 로컬 UDP 주소입니다. |
| `PUSHGO_PRIVATE_QUIC_PORT` | QUIC 포트가 클라이언트에 알려졌습니다. |
| `PUSHGO_PRIVATE_TCP_BIND` | Gateway가 수신 대기하는 로컬 TCP 주소입니다. |
| `PUSHGO_PRIVATE_TCP_PORT` | Raw TCP 포트가 클라이언트에 알려졌습니다. |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | QUIC에 필요합니다. TLS가 오프로드되지 않는 한 Raw TCP에도 필요합니다. |
| `PUSHGO_PRIVATE_TCP_TLS_OFFLOAD` | 엣지 인프라가 Raw TCP TLS를 처리하는지 여부. |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Raw TCP 진입점이 PROXY 프로토콜 v1을 예상하는지 여부입니다. |

PushGo QUIC는 사용자 지정 ALPN(`pushgo-quic`)을 사용하며 단순히 동일한 UDP/443 진입점을 HTTP/3과 공유할 수 없습니다. 별도의 UDP 포트를 사용하거나 에지 프록시가 프로토콜별로 올바르게 라우팅할 수 있는지 확인하세요.

## MCP / OAuth

다음을 사용하여 MCP를 활성화합니다.

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

일반 설정:

| 환경 변수 | 기본값 | 설명 |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | 동적 클라이언트 등록을 활성화합니다. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | 없음 | `client_id:client_secret` 형식의 사전 정의된 OAuth 클라이언트입니다. |
| `PUSHGO_MCP_ACCESS_TOKEN_TTL_SECS` | `900` | 액세스 토큰 수명. |
| `PUSHGO_MCP_REFRESH_TOKEN_ABSOLUTE_TTL_SECS` | `2592000` | 토큰 절대 수명을 새로 고칩니다. |
| `PUSHGO_MCP_REFRESH_TOKEN_IDLE_TTL_SECS` | `604800` | 토큰 유휴 수명을 새로 고칩니다. |
| `PUSHGO_MCP_BIND_SESSION_TTL_SECS` | `600` | Channel 바인드 페이지 세션 수명. |

도구 및 인증 흐름은 [MCP 참조](/ko/reference/mcp/)를 참조하세요.

## 핵심 구성

| CLI / 환경 변수 | 기본값 | 설명 |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | HTTP API, WSS 및 MCP/OAuth 리스너. |
| `--db-url` / `PUSHGO_DB_URL` | 필수 | 데이터베이스 URL; SQLite, PostgreSQL 및 MySQL를 지원합니다. |
| `--token` / `PUSHGO_TOKEN` | 없음 | 게이트웨이 수준 Bearer 토큰. 비어 있으면 비활성화됨을 의미합니다. |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `https://token.pushgo.dev` | 토큰 서비스 URL. 프로덕션에서 명시적으로 설정합니다. |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | 없음 | 외부 HTTPS 루트 URL. |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | APNs 샌드박스 엔드포인트를 포함한 샌드박스 모드. |
| `--observability-profile` / `PUSHGO_OBSERVABILITY_PROFILE` | `prod_min` | 관측 가능성 프로필: `prod_min`, `ops`, `incident`, `debug`. |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | 기본 추적 로그 수준입니다. |

## 작업

- 백업에 데이터베이스를 포함합니다. 채널, 디바이스, MCP 권한 부여 및 엔터티 상태는 영구 저장소에 따라 달라집니다.
- SQLite는 개인용 또는 간단한 배포에 적합합니다. 다중 사용자 또는 높은 동시성 사용에는 PostgreSQL를 선호합니다.
- 부하가 높은 경우 공급자 또는 데이터베이스 문제를 가정하기 전에 디스패치 대기열과 작업자를 검사하십시오.
- 생산 문제 해결을 위해 `PUSHGO_OBSERVABILITY_PROFILE=ops`를 사용하십시오. 더 깊은 조사를 위해 일시적으로 `incident` 또는 `debug`로 올립니다.
- Android private transport 문제의 경우 `/gateway/profile` 및 외부에서 연결할 수 있는 포트로 시작하세요.

용량 관련 설정:

| 환경 변수 | 설명 |
| :--- | :--- |
| `PUSHGO_DISPATCH_WORKER_COUNT` | 파견근로자 수를 재정의합니다. |
| `PUSHGO_DISPATCH_QUEUE_CAPACITY` | 디스패치 대기열 용량을 재정의합니다. |
| `PUSHGO_PRIVATE_FALLBACK_TASK_QUEUE_CAPACITY` | private transport 대체 작업 대기열 용량입니다. |
| `PUSHGO_PRIVATE_CONNECTION_QUEUE_CAPACITY` | 연결당 개인 전달 대기열 용량입니다. |
| `PUSHGO_APNS_MAX_IN_FLIGHT` | Max APNs는 프로세스별로 전송됩니다. |
| `PUSHGO_DISPATCH_TARGETS_CACHE_TTL_MS` | 디스패치 대상 캐시 TTL. |
| `PUSHGO_SQLITE_PAGE_CACHE_KIB` | SQLite 페이지 캐시 대상. |
| `PUSHGO_SQLITE_WAL_AUTOCHECKPOINT` | SQLite WAL 자동 체크포인트 페이지 수입니다. |

## 업그레이드 및 롤백

- 업그레이드하기 전에 데이터베이스 및 런타임 구성을 백업하십시오.
- Gateway 이미지/바이너리, 환경 변수 및 역방향 프록시 구성을 추적 가능하게 유지합니다.
- 테스트 채널에 대해 `/message`, `/event/create` 및 `/thing/create`를 검증합니다.
- private transport이 활성화된 경우 Android 클라이언트가 업데이트된 `/gateway/profile`를 가져올 수 있는지 확인하세요.
- MCP가 활성화된 경우 `/.well-known/*`, `/oauth/*` 및 `/mcp`가 여전히 외부 HTTPS 주소를 사용하는지 확인합니다.