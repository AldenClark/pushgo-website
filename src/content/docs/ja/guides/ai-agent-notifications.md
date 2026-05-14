---
title: MCP による AI Agent 通知
description: PushGo MCP と OAuth を使い、AI agent やチャットボットから通知、Event、状態更新を送信します。
---

AI agent、チャットボット、MCP クライアントがユーザーへ通知したり、長いタスクの進捗を報告したり、サービスやデバイスの状態を更新したりする場合に PushGo を使えます。モデルへ Channel パスワードを渡す必要はありません。

## 適した場面

- Agent の長いタスク完了をユーザーへ通知する。
- Agent の進捗を更新可能な Event として扱う。
- サービス、デバイス、タスクの状態を Thing として更新する。
- OAuth の Channel バインドで MCP クライアントに限定権限を付与する。

## PushGo でこのワークフローを表す方法

| 目的 | 使うモデル | 理由 |
| :--- | :--- | :--- |
| 一度きりの完了通知 | Message | ユーザーには一つの見える通知が必要です。 |
| 長時間の Agent タスク | Event | 同じタスクを更新し、最後に閉じられます。 |
| サービスやタスクの現在状態 | Thing | Agent が一つの永続オブジェクトを更新します。 |
| アシスタント認可 | MCP OAuth | モデルが tool call 内で Channel パスワードを持つ必要はありません。 |

## 最小例

MCP クライアントが `/mcp` に接続し、`pushgo.channel.bind.start` を開始します。ユーザーがブラウザで Channel を認可すると、アシスタントはその範囲内で `pushgo.message.send`、`pushgo.event.update`、`pushgo.thing.update` を呼び出せます。

```text
pushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send
```

## このページで答える質問

- **AI agent はスマートフォンへ通知できますか？** はい。認可された MCP ツールから PushGo Gateway 経由で Message を送信できます。
- **チャットボットに Channel パスワードを持たせるべきですか？** いいえ。本番では MCP OAuth を使い、ユーザーがブラウザで Channel をバインドします。
- **進捗報告には何を使いますか？** 長いタスクには Event が適しています。作成、反復更新、クローズができます。

## セキュリティと運用

- リスクの高い自動化には、分離した Channel と限定された認証情報を使います。
- AI アシスタントでは MCP OAuth を優先し、モデルに Channel パスワードを持たせません。
- データ経路、transport policy、コンプライアンス境界を管理する必要がある場合はセルフホストします。
- 機密フィールドは E2EE を使い、クライアントだけが復号します。

## 次のステップ

- [MCP リファレンス](/ja/reference/mcp/)
- [認証](/ja/reference/auth/)
- [データモデル](/ja/guides/data-models/)
