---
title: 移行ガイド
description: 既存の ntfy、Bark、ServerChan、または Webhook スクリプトを PushGo に移行します。
---
PushGo への移行では、すべてのスクリプトを一度に書き直す必要はありません。既存のスクリプトが引き続き機能するように互換性エンドポイントから始めて、重要なワークフローをネイティブ Message、Event、または Thing API にアップグレードします。

## 推奨されるパス

1. **エンドポイントを変更します**: ntfy、Bark、または ServerChan リクエストを PushGo 互換性エンドポイントに向けます。
2. **キーを置き換えます**: `<channel_id>:<password>` を互換キーとして使用します。
3. **フィールドの正規化**: 優先度、レベル、グループ、アイコン、および同様のフィールドを `severity`、`tags`、`images`、または `metadata` にマップします。
4. **モデルをアップグレード**: 1 回限りのアラートを Message として保持します。ライフサイクルを Event にアップグレードします。永続状態を Thing にアップグレードします。

## 互換性エンドポイント

|出典 |方法 | PushGo パス |鍵の場所 |
| :--- | :--- | :--- | :--- |
| ntfy | `POST` / `PUT` | `/ntfy/{topic}` | `{topic}` = `<channel_id>:<password>` |
| ServerChan | `GET` / `POST` | `/serverchan/{sendkey}` | `{sendkey}` = `<channel_id>:<password>` |
| Bark v1 | `GET` | `/bark/{device_key}/{body}` | `{device_key}` = `<channel_id>:<password>` |
| Bark v2 | `POST` | `/bark/push` | JSON フィールド `device_key` |

互換性エンドポイントにより、移行コストが削減されます。これらは完全な PushGo データモデルを表現するものではありません。 `thing_id`、Event ライフサイクル、または完全な Thing 状態が必要な場合は、ネイティブ API を使用します。

## ntfy から

古いリクエスト:

```bash
curl -d "NAS backup completed" https://ntfy.example.com/my-topic
```

PushGo 互換性エンドポイント:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -H "Priority: 3" \
  -d "NAS backup completed"
```

ネイティブ Message:

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The NAS backup task has finished.",
    "severity": "normal",
    "tags": ["nas", "backup"]
  }'
```

## Bark から

Bark は通常、パスにデバイス キーを置きます。そのキーを `<channel_id>:<password>` に置き換えます。

```bash
curl "https://gateway.pushgo.dev/bark/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD/Server%20alert?title=CPU%20High&level=timeSensitive"
```

すでに JSON リクエストを使用している場合は、ネイティブ Message に直接移行することをお勧めします。ネイティブ API は、`images`、`tags`、`metadata`、`thing_id`、および E2EE をより明確に表現します。

## ServerChan から

```bash
curl -X POST https://gateway.pushgo.dev/serverchan/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -d "title=Deployment completed" \
  -d "desp=Production deployment succeeded"
```

ServerChan はほとんどが 1 回限りのアラート モデルです。スクリプトが「開始済み」、「実行中」、「終了」を送信する場合は、Event に直接アップグレードしてください。

## Event にアップグレードする時期

同じタスクが複数のステージの更新を送信する場合は、Event の方が適しています。

|古いスクリプトの動作 | Event式 |
| :--- | :--- |
| 「展開を開始しました」を送信 | `/event/create` |
| 「ビルド完了」または「公開」を送信 | `/event/update` |
| 「展開成功/失敗」を送信 | `/event/close` |

これにより、クライアントは無関係なMessageではなく、一貫した 1 つのタイムラインを表示できるようになります。

## Thing にアップグレードする時期

スクリプトが同じオブジェクトの現在の状態を繰り返し報告する場合は、Thing を使用します。

|古いスクリプトの動作 | Thing式 |
| :--- | :--- |
| CPU/メモリを毎分送信 | `/thing/update`と`attrs` |
|室温を繰り返し送信 | `thing_id` ごとに 1 つの部屋またはセンサー |
|サービスのオンライン/オフラインのアラート |サービスの場合は Thing、インシデントの場合は Message または Event |

## 互換性の制限

- 互換性キーにはチャネルのパスワードが含まれています。公開ログに書き込まないでください。
- ntfy 互換エンドポイントは、`thing_id` をサポートしていません。
- 互換性エンドポイントは、完全な Thing ライフサイクルを表現できません。
- プロバイダー固有の優先順位とフィールド名はマッピングされており、1 対 1 で保持されない場合があります。
- ネイティブ API に移行すると、複雑なメタデータ、E2EE、エンティティの関係がより明確になります。