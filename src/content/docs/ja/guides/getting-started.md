---
title: はじめる
description: クライアントをインストールし、チャネルを作成し、最初の PushGo 通知を受け取ります。
---
このガイドは、PushGo を初めて使用するユーザー向けです。最後に、使用可能なチャネルと、最初の Message を送信する動作する HTTP リクエストが完成します。

## 前提条件

- リリースされた PushGo クライアントがインストールされているデバイス。
・`curl`を実行できる端末。
- チャンネルIDとチャンネルパスワード。クライアントで新しいチャネルを作成することも、別のデバイスによって共有されているチャネルにサブスクライブすることもできます。

## 1. クライアントをインストールする

リリースされたクライアントのいずれかをインストールします。

|プラットフォーム |ダウンロード |要件 |
| :--- | :--- | :--- |
| iOS / macOS / watchOS | [App Store](https://apps.apple.com/app/pushgo) | iOS 18 以降、macOS 15 以降、watchOS 11 以降 |
|アンドロイド | [GitHub リリース](https://github.com/AldenClark/pushgo-android/releases) | Android 12+ |

## 2. Channel を作成またはサブスクライブする

チャネルは PushGo 書き込み境界です。リクエストはチャネルに送信され、サブスクライブされたデバイスが配信ターゲットになります。

### 新しい Channel を作成する

1. クライアントを開きます。
2. 追加アクションを使用します。
3. [チャネルの作成] を選択します。
4. 認識可能な名前と 8 ～ 128 文字のパスワードを入力します。
5. 生成されたチャネル ID とパスワードを保存します。

### 既存の Channel をサブスクライブする

1. クライアントを開きます。
2. チャンネル登録を選択します。
3. チャンネルIDとパスワードを入力します。
4. 購読後、デバイスはそのチャンネルのコンテンツを受信します。

## 3. パブリック Gateway を選択します

パブリック ゲートウェイは、サーバーを展開せずにテストする場合に役立ちます。

|地域 | Gateway |
| :--- | :--- |
|グローバル | |
|中国本土 | |

あなたと受信デバイスに最も近い地域を選択してください。自己ホストする場合は、サンプル URL を独自の Gateway URL に置き換えます。 Gateway が `PUSHGO_TOKEN` を使用している場合は、`Authorization: Bearer <token>` を追加します。

## 4. 最初の Message を送信する

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Hello from PushGo",
    "body": "This is a test notification.",
    "severity": "normal"
  }'
```

成功した応答は次のようになります。

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "message_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` は、Gateway がリクエストを受け入れたことを意味します。 `accepted=true` はディスパッチに入ったことを意味します。最終的な通知表示は、デバイスの状態、プラットフォーム プッシュ サービス、およびプライベート トランスポートのステータスによって異なります。

## よくある問題

|症状 |チェック |
| :--- | :--- |
| `400` 応答 | JSON の有効性、フィールド名、および必須の `title`、`channel_id`、`password`。 |
| `401` 応答 |プライベートGateway `PUSHGO_TOKEN`および`Authorization: Bearer <token>`。 |
| `404` 応答 | Channel ID、およびデバイスがチャンネルを作成したか、チャンネルに登録したか。 |
| `success=true`ですが通知がありません |デバイス通知許可、ネットワーク状態、Android プライベート トランスポート、APNs/FCM 配信。 |
|ペイロードが大きすぎます | JSON 本体の最大サイズは 32KB です。バイナリ データを埋め込む代わりに画像 URL を使用します。 |

ステータス コードの詳細については、[制限とエラー](/ja/reference/limits-errors/) を参照してください。

## 次のステップ

- PushGo に 3 つのモデルがある理由を理解するには、[コア コンセプト](/ja/guides/concepts/) をお読みください。
- Message、Event、または Thing を選択するには、[データモデル](/ja/guides/data-models/) を参照してください。
- 実際のスクリプトを統合するには、[使用例](/ja/guides/use-cases/) を参照してください。
- 独自の Gateway を実行するには、[セルフホスティング](/ja/guides/self-hosting/) をお読みください。