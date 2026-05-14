---
title: DevOps と CI/CD 通知
description: PushGo で CI/CD、デプロイ、インシデント、サーバー、監視通知を Message、Event、Thing として扱います。
---

DevOps 通知は、一度きりのアラート、インシデントのライフサイクル、サービスの現在状態を分けて表現すると読みやすくなります。

## 適した場面

- ビルド、デプロイ、リリース通知を送る。
- インシデント対応の進捗を更新可能な Event として追跡する。
- サービス、キュー、バックアップ、ホスト状態を Thing として表示する。
- public Gateway または private Gateway から Apple/Android クライアントへ届ける。

## PushGo でこのワークフローを表す方法

| 目的 | 使うモデル | 理由 |
| :--- | :--- | :--- |
| ビルド完了 | Message | 一つの見える通知で足りる。 |
| デプロイ中 | Event | 開始から失敗または完了まで同じライフサイクルで更新できる。 |
| サービスヘルス | Thing | オブジェクトの現在状態が変化する。 |

## 最小例

単純なパイプライン完了は Message、複数ステップのデプロイは Event、サービスの現在状態は Thing を使います。

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

- **PushGo は CI/CD 通知に向いていますか？** はい。CI/CD からシェルステップや Webhook で HTTP API を直接呼び出せます。
- **インシデントはどう表現しますか？** Event を使うと同じインシデントを更新し、最後に閉じられます。
- **チームでセルフホストできますか？** はい。private Gateway でデータ経路、認証、運用ポリシーを制御できます。

## セキュリティと運用

- リスクの高い自動化には、分離した Channel と限定された認証情報を使います。
- AI アシスタントでは MCP OAuth を優先し、モデルに Channel パスワードを持たせません。
- データ経路、transport policy、コンプライアンス境界を管理する必要がある場合はセルフホストします。
- 機密フィールドは E2EE を使い、クライアントだけが復号します。

## 次のステップ

- [データモデル](/ja/guides/data-models/)
- [Event API](/ja/reference/api-event/)
- [セルフホスティング](/ja/guides/self-hosting/)
