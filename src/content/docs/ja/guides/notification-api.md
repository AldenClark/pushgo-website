---
title: スクリプトとサービス向け Push Notification API
description: curl、Webhook、cron、CI/CD、NAS アラート、自動化スクリプトから PushGo を HTTP 通知 API として利用します。
---

PushGo は、スクリプトやサービスの結果をユーザーへ確実に届けつつ、Event と Thing による構造化された状態表現も扱える HTTP API を提供します。

## 適した場面

- curl、cron、シェルスクリプト、Webhook から通知する。
- ジョブ完了、価格通知、画像スナップショット、監視結果を送る。
- 単なるテキストの連続ではなく Event と Thing で表現する。
- 互換エンドポイントから始め、徐々に PushGo ネイティブ API へ移行する。

## PushGo でこのワークフローを表す方法

| 目的 | 使うモデル | 理由 |
| :--- | :--- | :--- |
| 一度きりのスクリプト通知 | Message | 単純で一時的、curl で検証しやすい。 |
| 進捗を持つタスク | Event | 同じ Event を完了まで更新できる。 |
| デバイスやサービスの現在状態 | Thing | 古い通知の列ではなく最新状態を見せる。 |

## 最小例

ネイティブ `/message` エンドポイントは JSON を受け取り、Gateway が分配処理に受理したかを返します。

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

- **curl で通知できますか？** はい。Message API は curl、スクリプト、単純な HTTP クライアントから呼び出せます。
- **PushGo はスマートフォン通知 API だけですか？** いいえ。Event のライフサイクルと Thing の現在状態も扱えます。
- **API をセルフホストできますか？** はい。自分の Gateway で認証、保存、トランスポート、MCP/OAuth を制御できます。

## セキュリティと運用

- リスクの高い自動化には、分離した Channel と限定された認証情報を使います。
- AI アシスタントでは MCP OAuth を優先し、モデルに Channel パスワードを持たせません。
- データ経路、transport policy、コンプライアンス境界を管理する必要がある場合はセルフホストします。
- 機密フィールドは E2EE を使い、クライアントだけが復号します。

## 次のステップ

- [はじめる](/ja/guides/getting-started/)
- [Message API](/ja/reference/api-message/)
- [セルフホスティング](/ja/guides/self-hosting/)
