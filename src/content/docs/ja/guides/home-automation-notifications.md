---
title: NAS、IoT、Home Assistant 通知
description: PushGo を NAS アラート、IoT デバイス、Home Assistant 自動化、長期的なデバイス状態更新に使います。
---

ホームオートメーションやデバイス監視では一度きりの通知だけでは足りないことがあります。PushGo は通知、Event、現在状態をまとめて扱えます。

## 適した場面

- NAS のディスク、バックアップ、サービスアラートを送る。
- Home Assistant から HTTP または Webhook で連携する。
- デバイス、センサー、バックアップジョブ、メディアサービスを Thing として扱う。
- 家庭内データを自分で管理したい場合は private Gateway を使う。

## PushGo でこのワークフローを表す方法

| 目的 | 使うモデル | 理由 |
| :--- | :--- | :--- |
| ドアベル画像やディスク警告 | Message | 内容は単発のアラート。 |
| バックアップやメディアスキャン進捗 | Event | 完了まで進捗を更新できる。 |
| センサーやデバイス状態 | Thing | 履歴より現在状態が重要。 |

## 最小例

NAS スクリプトは `/message` でディスク警告を送り、バックアップジョブは Event を作成して成功または失敗まで更新できます。

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

- **Home Assistant webhook を受けられますか？** はい。Home Assistant の webhook または REST action から PushGo HTTP API を呼び出せます。
- **古いデバイス通知を増やさない方法は？** Thing を使い、同じオブジェクトの現在状態を表示します。
- **プライベートネットワークで動かせますか？** はい。データ経路や transport policy を管理したい場合は Gateway をセルフホストします。

## セキュリティと運用

- リスクの高い自動化には、分離した Channel と限定された認証情報を使います。
- AI アシスタントでは MCP OAuth を優先し、モデルに Channel パスワードを持たせません。
- データ経路、transport policy、コンプライアンス境界を管理する必要がある場合はセルフホストします。
- 機密フィールドは E2EE を使い、クライアントだけが復号します。

## 次のステップ

- [ユースケース](/ja/guides/use-cases/)
- [Thing API](/ja/reference/api-thing/)
- [セルフホスティング](/ja/guides/self-hosting/)
