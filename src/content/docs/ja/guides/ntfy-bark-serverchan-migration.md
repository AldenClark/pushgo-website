---
title: ntfy、Bark、ServerChan からの移行
description: 既存の ntfy、Bark、ServerChan、Webhook 通知スクリプトを互換エンドポイントとネイティブモデルで PushGo へ移行します。
---

PushGo は既存の通知ワークフローを受け止めながら、重要な経路を Message、Event、Thing へ段階的に移行できます。

## 適した場面

- 評価中も単純なスクリプトを動かし続ける。
- すべてを書き換えず、通知経路ごとに移行する。
- 必要な箇所だけテキスト通知を構造化されたライフサイクルや状態へ置き換える。
- 機密ワークフローでは E2EE とセルフホストを組み合わせる。

## PushGo でこのワークフローを表す方法

| 目的 | 使うモデル | 理由 |
| :--- | :--- | :--- |
| 単純な移行通知 | Message | 従来の通知は一度きりの Message として扱う。 |
| 状態変化のあるワークフロー | Event | 繰り返し更新は一つのライフサイクルに属する。 |
| 長期監視対象 | Thing | 同じエンティティを更新し続けられる。 |

## 最小例

まず低リスクのスクリプトを互換エンドポイントへ移し、より豊かな意味が必要なものを `/message`、`/event/*`、`/thing/*` へ移行します。

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "PushGo からの通知",
    "body": "自動化通知の経路が動作しています。"
  }'
```

## このページで答える質問

- **すべてのスクリプトをすぐ書き換える必要がありますか？** いいえ。互換エンドポイントを使い、価値の高いワークフローから移行できます。
- **単なるテキスト通知で足りないのはいつですか？** 進捗、終了、現在状態、画像、メタデータ、セキュリティ要件があるときです。
- **これは直接比較ですか？** いいえ。移行はモデリングの判断です。

## セキュリティと運用

- リスクの高い自動化には、分離した Channel と限定された認証情報を使います。
- AI アシスタントでは MCP OAuth を優先し、モデルに Channel パスワードを持たせません。
- データ経路、transport policy、コンプライアンス境界を管理する必要がある場合はセルフホストします。
- 機密フィールドは E2EE を使い、クライアントだけが復号します。

## 次のステップ

- [移行ガイド](/ja/guides/migration/)
- [Message API](/ja/reference/api-message/)
- [データモデル](/ja/guides/data-models/)
