---
title: モデルコンテキストプロトコル (MCP)
description: MCP と OAuth2 を使用して、PushGo を AI アシスタントのワークフローに統合します。
---
PushGo Gateway は、MCP HTTP サーバーとして機能できるため、MCP 対応 AI アシスタントは、承認されたチャネル スコープ内で Message の送信、Event の管理、Thing の更新を行うことができます。ユーザーがモデルにチャネルのパスワードを与えるのではなく、ブラウザでチャネルをバインドできるように、OAuth2 認証が推奨されます。

## 向いているケース

- タスクの完了後に AI アシスタントが PushGo 通知を送信できるようにします。
- AI アシスタントに Event として長時間実行される作業を同期させます。
- AI アシスタントにサービス、デバイス、またはタスクの Thing を更新させます。
- サードパーティの MCP クライアントに限定されたチャネル アクセスを提供します。

MCP はユーザー確認に代わるものではありません。影響の大きいワークフローでは、クライアントまたはオーケストレーション層での確認を維持する必要があります。

## エンドポイント

```text
https://your-gateway-domain/mcp
```

パブリック Gateway が MCP/OAuth を有効にする場合は、そのリージョンの `/mcp` エンドポイントを使用します。セルフホスト型展開では、外部からアクセス可能な `PUSHGO_PUBLIC_BASE_URL` を設定する必要があります。

## プライベート Gateway で MCP を有効にする

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

共通設定:

|環境変数 |デフォルト |説明 |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | 動的クライアント登録を有効にします。 |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` |なし | `client_id:client_secret` 形式の事前定義された OAuth クライアント。 |
バインドセッションとトークン寿命は現在の Gateway ランタイムプロファイルで管理されます。v1.2.9 では公開 CLI/env 設定ではありません。

クライアントが DCR をサポートしていない場合は、`PUSHGO_MCP_PREDEFINED_CLIENTS` を使用します。

## 認証モード

|モード | Channel パスワード |こんな方に最適 |リスク |
| :--- | :--- | :--- | :--- |
| OAuth2 認可 |ツール呼び出しでは渡されません | AI アシスタント、サードパーティ クライアント、プロダクション |スコープとチャネル許可によって制限されます。 |
|レガシーモード |すべてのツール呼び出しで渡されます |個人用スクリプト、信頼できる環境 |発信者はチャネルのパスワードを直接保持します。 |

運用環境では OAuth2 認証を優先します。

## ユーザーバインディングフロー

1. MCP クライアントは `/mcp` に接続します。
2. クライアントは、OAuth または DCR を通じて OAuth2 クライアント ID を取得します。
3. アシスタントは `pushgo.channel.bind.start` を呼び出します。
4. ユーザーは、返された `bind_url` を開きます。
5. ユーザーはチャネル ID とパスワードを入力し、認可範囲を確認します。
6. アシスタントは `pushgo.channel.bind.status` をポーリングします。
7. 承認後、アシスタントはバインドされたチャネル スコープ内でツールを呼び出すことができます。


## ツール

### Message

|ツール |目的 |
| :--- | :--- |
| `pushgo.message.send` |ワンオフの Message を送信します。 `title`、`body`、`url`、`images`、`severity`、`ttl`、`metadata`、`thing_id`、および関連フィールドをサポートします。 |

### Event

|ツール |目的 |
| :--- | :--- |
| `pushgo.event.create` |ライフサイクル Eventを作成し、`event_id` を返します。 |
| `pushgo.event.update` |既存のEventを更新します。 |
| `pushgo.event.close` |既存のEventを閉じます。 |

### Thing

|ツール |目的 |
| :--- | :--- |
| `pushgo.thing.create` |永続エンティティを作成し、`thing_id` を返します。 |
| `pushgo.thing.update` |エンティティの属性を更新します。 |
| `pushgo.thing.archive` |エンティティをアーカイブします。 |
| `pushgo.thing.delete` |エンティティを削除または廃止します。 |

### Channel

|ツールまたはリソース |目的 |
| :--- | :--- |
| `pushgo.channel.bind.start` |バインドまたは取り消しセッションを作成し、`bind_url` を返します。 |
| `pushgo.channel.bind.status` |バインドセッションのステータスを確認します。 |
| `pushgo.channel.list` |現在許可されているチャンネルをリストします。 |
| `pushgo.channel.unbind` |チャネルの認可を取り消します。 |
| `pushgo://channels` |認可されたチャネルリソースリスト。 |
| `pushgo://channels/{channel_id}` | 1チャンネルの基本情報。 |

## クライアント構成に関する注意事項

- MCP エンドポイントは `https://your-gateway-domain/mcp` です。
- リバース プロキシは、`Host` および `X-Forwarded-Proto` を正しく渡す必要があります。
- セルフホスト展開では、`PUSHGO_PUBLIC_BASE_URL` を外部からアクセス可能な HTTPS ルート URL に設定する必要があります。
- OAuth 発行者のメタデータまたはバインド リンクに内部アドレスが含まれている場合は、最初に `PUSHGO_PUBLIC_BASE_URL` を確認します。
- クライアントが DCR をサポートしていない場合は、事前定義されたクライアントを使用します。

## 操作

- MCP 許可は永続化されます。データベースまたはストレージ ディレクトリを使い捨てキャッシュとして扱わないでください。
- v1.2.9 では token とバインドセッションの寿命はプロファイル管理のランタイム設定です。TTL 環境変数ではなく適切なランタイムプロファイルを選択してください。
- 事前定義されたクライアント シークレットを定期的にローテーションします。
- リスクの高い自動化には、すべてを 1 つのチャネルに許可するのではなく、別のチャネルを使用します。
- 操作デバッグには、Gateway 構造化ログと統計を使用します。

## トラブルシューティング

| 症状 | 確認項目 |
| :--- | :--- |
| クライアントが OAuth メタデータを検出できない | `PUSHGO_PUBLIC_BASE_URL` は外部 HTTPS URL である必要があります。リバースプロキシが well-known ルートを転送しているか確認します。 |
| バインドリンクが開かない | 公開 DNS、HTTPS 証明書、リバースプロキシパス、`PUSHGO_PUBLIC_BASE_URL`、バインドセッションの期限切れ有無。 |
| DCR が失敗する |クライアント DCR サポートおよび `PUSHGO_MCP_DCR_ENABLED`。 |
|ツール呼び出しで `password` が要求される |レガシー モードであるか、OAuth 認証が不完全である可能性があります。 |
|承認されていますが、チャンネルが表示されません |バインド セッションの完了、スコープ、およびチャネル許可が取り消されたかどうか。 |