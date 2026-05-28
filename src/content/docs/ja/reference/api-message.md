---
title: Message API
description: /message を使用して 1 回限りの通知を送信し、フィールド、応答、およびディスパッチのセマンティクスを理解します。
---
Message API は、トップレベルの一時通知を送信します。アラート、完了Message、画像スナップショット、価格通知、および後で更新したり終了したりする必要のないその他のコンテンツに使用します。

## エンドポイント

```http
POST /message
```

リクエストの本文は JSON である必要があり、不明なフィールドは拒否されます。プライベート Gateway が `PUSHGO_TOKEN` を有効にする場合は、`Authorization: Bearer <token>` を含めます。

## ヘッダー

|ヘッダー |必須 |説明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` |はい |リクエスト本文の形式。 |
| `Authorization: Bearer <token>` |ゲートウェイに依存 |プライベート Gateway が `PUSHGO_TOKEN` を有効にする場合にのみ必要です。 |

## リクエストフィールド

|フィールド |タイプ |必須 |説明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` |はい |ターゲットチャンネルID。 |
| `password` | `string` |はい | Channel パスワード、通常は 8 ～ 128 文字。 |
| `title` | `string` |はい | Message タイトルは空であってはなりません。 |
| `body` | `string` |いいえ | Message本体、Markdownに対応します。 |
| `op_id` | `string` |いいえ |冪等キー、1 ～ 128 文字、文字/数字/`_`/`:`/`-`。 |
| `thing_id` | `string` | いいえ | 既存の Thing に関連付けます。1-64 文字、英数字/`_`/`:`/`-`。 |
| `occurred_at` | `number` | いいえ | メッセージ発生時刻。Unix 秒またはミリ秒を受け付けます。`thing_id` がある場合は必須です。 |
| `severity` | `string` |いいえ | `critical`、`high`、`normal`、`low`;不明な値は `normal` に正規化されます。 |
| `ttl` | `number` |いいえ | Unix ミリ秒の有効期限。プロバイダーの TTL は約 28 日に制限されています。 |
| `url` | `string` |いいえ |オプションのリンク先 URL。 |
| `images` | `string[]` |いいえ |最大 32 個の画像 URL、それぞれ最大 2048 文字。 |
| `tags` | `string[]` |いいえ |最大 32 個のタグ、それぞれ最大 64 文字、トリミングおよび重複排除。 |
| `ciphertext` | `string` |いいえ |オプションの E2EE 暗号文ペイロード。 |
| `metadata` | `object` | いいえ | カスタムのスカラー key-value。key <= 64、空でないスカラー value <= 512。ネストしたオブジェクトと配列は拒否されます。 |

## 重大度のマッピング

| `severity` | APNs 割り込みレベル | FCM 優先順位 |
| :--- | :--- | :--- |
| `critical` | `critical` | `HIGH` |
| `high` | `time-sensitive` | `HIGH` |
| `normal` | `active` | `HIGH` |
| `low` | `passive` | `NORMAL` |

## 最小限の例

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The daily NAS backup has finished.",
    "severity": "normal"
  }'
```

## Thing と関連付ける

アラートが永続エンティティに属している場合は、`thing_id` を渡します。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
  "title": "Home NAS disk warning",
  "body": "volume1 usage has reached 92%.",
  "severity": "high",
  "tags": ["nas", "disk"]
}
```

## 成功の応答

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` は、Gateway がリクエストを処理したことを意味します。 `accepted=true` は、リクエストがディスパッチに入ったことを意味します。最終的な表示は、依然としてプラットフォーム プッシュ サービス、デバイスの状態、およびプライベート トランスポートに依存します。

## よくあるエラー

|ステータス |典型的な理由 |
| :--- | :--- |
| `400` |必須フィールドが欠落しています、不明なフィールド、空の `title`、無効な `op_id`。 |
| `401` |プライベート Gateway には Bearer トークンが必要ですが、ヘッダーが欠落しているか間違っています。 |
| `404` | Channel が存在しないか、資格情報が一致しません。 |
| `413` |リクエストボディが 32KB を超えています。 |
| `503` | Gateway はディスパッチを完全に開始できませんでした。応答には `accepted=false` が含まれる場合があります。 |

共有制限については、[制限とエラー](/ja/reference/limits-errors/) を参照してください。

## 互換性エンドポイント

PushGo は、移行用の ntfy、Bark、および ServerChan 互換エンドポイントも提供します。彼らのフィールドカバー範囲は限られています。 `thing_id`、E2EE、または完全な PushGo セマンティクスが必要な場合は、ネイティブ `/message` を使用してください。 [移行ガイド](/ja/guides/migration/)を参照してください。