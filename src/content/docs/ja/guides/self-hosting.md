---
title: セルフホスティング
description: 独自の PushGo ゲートウェイを最小限のセットアップから運用運用まで展開します。
---
セルフホスティングは、データ パス、認証ポリシー、データベース、プライベート トランスポート、および MCP/OAuth を制御したいユーザー向けです。 Gateway は Rust サービスです。 HTTP API、WSS、および MCP/OAuth は 1 つの HTTP リスナーを共有します。 QUIC と Raw TCP は別のリスニング アドレスを使用します。

## 必要なときに

- 通知、Event、またはエンティティの状態がパブリック Gateway を通過しないようにします。
- 独自のデータベース、バックアップ、ログ、監視、および容量ポリシーが必要です。
- 低遅延の Android プライベート トランスポート同期が必要な場合。
- 独自のドメインに MCP/OAuth が必要です。
- 発信者を制限するには、ゲートウェイ レベルの Bearer トークンが必要です。

PushGo のみを試したい場合は、公開されている Gateway を使用し、[Getting Started](/ja/guides/getting-started/) に従ってください。

## 導入レベル

|レベル |こんな方に最適 |主な構成 |
| :--- | :--- | :--- |
|最小限 |ローカルテスト、シングルユーザースクリプト | SQLite + HTTP API |
|生産拠点 |長期にわたって運営されているパブリック ドメイン | HTTPS リバース プロキシ + 永続データベース + Bearer トークン |
|プライベート交通機関 | Android の低遅延同期 | WSS、その後オプションの QUIC / Raw TCP |
| AIの統合 | MCP クライアントと AI アシスタント | MCP/OAuth + `PUSHGO_PUBLIC_BASE_URL` |

## 最小限の展開

最小限のセットアップに必要なのは、データベースと HTTP リスナーのみです。

```bash
mkdir -p /var/lib/pushgo

docker run -d --name pushgo-gateway \
  -p 6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='sqlite:///var/lib/pushgo/pushgo.db?mode=rwc' \
  -v /var/lib/pushgo:/var/lib/pushgo \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

テストしてみましょう:

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

最小限のセットアップは検証に役立ちます。公共のインターネットに直接公開しないでください。

## 生産拠点

実稼働環境では、少なくとも次のとおりです。

1. Gateway をローカルホストまたはプライベート ネットワークにバインドします。
2. Nginx、Caddy、またはロードバランサーを HTTPS の前に配置します。
3. ゲートウェイレベルの Bearer 認証に `PUSHGO_TOKEN` を設定します。
4. 永続ストレージを使用し、バックアップに含めます。
5. `PUSHGO_PUBLIC_BASE_URL` および `PUSHGO_TOKEN_SERVICE_URL` を明示的に設定します。

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

`PUSHGO_TOKEN` を設定した後、API リクエストには以下が必要です。

```http
Authorization: Bearer replace-with-gateway-token
```

チャネル ID とチャネル パスワードは引き続きリクエスト本文に含まれます。 2 つのレイヤーの違いについては、[認証](/ja/reference/auth/) を参照してください。

## パブリック領域エンドポイント

Gateway がトークン サービスを必要とする場合は、リージョンを明示的に構成します。

|地域 | Gateway |トークンサービス |
| :--- | :--- | :--- |
|グローバル | `https://gateway.pushgo.dev/` | `https://token.pushgo.dev/` |
|中国本土 | `https://gateway.pushgo.cn/` | `https://token.pushgo.cn/` |

プライベート Gateway は引き続きパブリック トークン サービスを使用するか、展開の進化に応じて別のサービスに切り替えることができます。

## リバースプロキシ

HTTP API、WSS、および MCP/OAuth は、HTTP リスナーを共有します。リバース プロキシは、通常の HTTP と WebSocket のアップグレードをサポートする必要があります。

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

`PUSHGO_PUBLIC_BASE_URL` は、外部からアクセス可能な HTTPS ルートである必要があります。それ以外の場合、MCP 発行者メタデータ、バインド リンク、およびクライアント プロファイル ヒントに内部アドレスが含まれる可能性があります。

## Android プライベート トランスポート

プライベートトランスポートは`PUSHGO_PRIVATE_TRANSPORTS`で有効になります。 `wss` から始めます。これは HTTPS を再利用し、最も複雑でないオプションです。

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

低遅延が必要な場合、または制御されたネットワークで動作する場合は、QUIC / Raw TCP を追加します。

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

|設定 |説明 |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`、`true`、`none`、または `wss` や `quic,tcp,wss` などの明示的なリスト。 |
| `PUSHGO_PRIVATE_QUIC_BIND` | Gateway がリッスンするローカル UDP アドレス。 |
| `PUSHGO_PRIVATE_QUIC_PORT` | QUIC ポートがクライアントにアドバタイズされます。 |
| `PUSHGO_PRIVATE_TCP_BIND` | Gateway がリッスンするローカル TCP アドレス。 |
| `PUSHGO_PRIVATE_TCP_PORT` | Raw TCP ポートがクライアントにアドバタイズされます。 |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | QUIC には必須。 TLS がオフロードされていない限り、Raw TCP にも必要です。 |
| `PUSHGO_PRIVATE_TCP_TLS_OFFLOAD` |エッジ インフラストラクチャが Raw TCP TLS を処理するかどうか。 |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Raw TCP エントリポイントが PROXY プロトコル v1 を予期するかどうか。 |

PushGo QUIC はカスタム ALPN (`pushgo-quic`) を使用するため、同じ UDP/443 エントリポイントを HTTP/3 と単純に共有することはできません。別の UDP ポートを使用するか、エッジ プロキシがプロトコルによって正しくルーティングできることを確認してください。

## MCP / OAuth

次のコマンドで MCP を有効にします。

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

共通設定:

|環境変数 |デフォルト |説明 |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` |動的クライアント登録を有効にします。 |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` |なし | `client_id:client_secret` 形式の事前定義された OAuth クライアント。 |
バインドセッションとトークン寿命は現在の Gateway ランタイムプロファイルで管理されます。v1.2.9 では公開 CLI/env 設定ではありません。

ツールと認証フローについては、[MCP リファレンス](/ja/reference/mcp/) を参照してください。

## コア構成

| CLI / 環境変数 |デフォルト |説明 |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | HTTP API、WSS、および MCP/OAuth リスナー。 |
| `--db-url` / `PUSHGO_DB_URL` |必須 |データベースの URL。 SQLite、PostgreSQL、MySQLをサポートします。 |
| `--runtime-profile` / `PUSHGO_RUNTIME_PROFILE` | `small` | ランタイム容量プロファイル: プライベート/軽量デプロイは `small`、高負荷デプロイは `public`。 |
| `--token` / `PUSHGO_TOKEN` |なし |ゲートウェイレベルのBearerトークン。空は無効を意味します。 |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `https://token.pushgo.dev` |トークンサービス URL。本番環境で明示的に設定します。 |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` |なし |外部 HTTPS ルート URL。 |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | APNs サンドボックス エンドポイントを含むサンドボックス モード。 |
| `--observability-profile` / `PUSHGO_OBSERVABILITY_PROFILE` | `prod_min` |可観測性プロファイル: `prod_min`、`ops`、`incident`、`debug`。 |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` |ネイティブのトレース ログ レベル。 |

## 操作

- データベースをバックアップに含めます。チャネル、デバイス、MCP 許可、およびエンティティの状態は永続ストレージに依存します。
- SQLite は個人または小規模な導入に適しています。マルチユーザーまたは高同時使用の場合は、PostgreSQL を推奨します。
- 高負荷の場合は、プロバイダーまたはデータベースの問題を想定する前に、ディスパッチ キューとワーカーを検査します。
- 本番環境のトラブルシューティングには `PUSHGO_OBSERVABILITY_PROFILE=ops` を使用します。さらに詳しく調査するために、一時的に `incident` または `debug` に上げます。
- Android のプライベート トランスポートの問題については、`/gateway/profile` および外部から到達可能なポートから始めます。

ランタイム容量:

Gateway v1.2.9 ではランタイム容量はプロファイル管理です。プライベートまたは軽量デプロイには `PUSHGO_RUNTIME_PROFILE=small`、高負荷の公開デプロイには `PUSHGO_RUNTIME_PROFILE=public` を使います。キュー、ディスパッチ、プロバイダー、DB プール、SQLite の細かな調整値は公開環境変数ではなく、プロファイル内部の既定値です。

## アップグレードとロールバック

- アップグレードする前に、データベースとランタイム構成をバックアップします。
- Gateway イメージ/バイナリ、環境変数、およびリバース プロキシ構成を追跡可能に保ちます。
- テスト チャネルに対して `/message`、`/event/create`、および `/thing/create` を検証します。
- プライベート トランスポートが有効な場合は、Android クライアントが更新された `/gateway/profile` をフェッチできることを確認します。
- MCP が有効な場合は、`/.well-known/*`、`/oauth/*`、および `/mcp` が引き続き外部 HTTPS アドレスを使用していることを確認します。