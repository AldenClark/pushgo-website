---
title: セルフホスト可能なオープンソース通知サーバー
description: PushGo Gateway を、private transport、永続状態、E2EE、MCP/OAuth 対応の通知サーバーとして運用します。
---

通知経路、データ保存、Gateway 認証、private transport、MCP/OAuth エンドポイントを自分で管理したい場合は PushGo をセルフホストします。

## 適した場面

- 個人またはチームの自動化用に private Gateway を運用する。
- 通知、Event、Thing 状態を public Gateway に通さない。
- AI アシスタント向けに独自 HTTPS `/mcp` エンドポイントを公開する。
- バックアップ、リバースプロキシ、ログ、監視を運用に組み込む。

## PushGo でこのワークフローを表す方法

| 目的 | 使うモデル | 理由 |
| :--- | :--- | :--- |
| プライベートな配送経路 | Gateway | HTTP API と transport listener を自分の基盤で管理する。 |
| 機密フィールド | E2EE | クライアントがローカルで復号する。 |
| AI アシスタント連携 | MCP OAuth | 公開 Gateway URL 経由でユーザーが Channel をバインドする。 |

## 最小例

MCP/OAuth を有効にする前に、`PUSHGO_PUBLIC_BASE_URL` を外部到達可能な HTTPS ルートに設定します。

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

- **PushGo はセルフホスト通知サーバーになりますか？** はい。Gateway は永続ストレージと設定可能なトランスポートを持つ private deployment 向けです。
- **セルフホストで MCP を使えますか？** はい。公開 HTTPS ベース URL を設定すれば `/mcp` と OAuth ルートを提供できます。
- **バックアップは必要ですか？** はい。Channel、デバイス、MCP grant、Event、Thing は永続ストレージに依存します。

## セキュリティと運用

- リスクの高い自動化には、分離した Channel と限定された認証情報を使います。
- AI アシスタントでは MCP OAuth を優先し、モデルに Channel パスワードを持たせません。
- データ経路、transport policy、コンプライアンス境界を管理する必要がある場合はセルフホストします。
- 機密フィールドは E2EE を使い、クライアントだけが復号します。

## 次のステップ

- [セルフホスティング](/ja/guides/self-hosting/)
- [エンドツーエンド暗号化](/ja/reference/e2ee/)
- [MCP リファレンス](/ja/reference/mcp/)
