---
title: EventAPI
description: /event/create、/event/update、および /event/close を使用して、更新可能なライフサイクルをモデル化します。
---
Event API は、時間の経過とともに変化し、最終的に終了するプロセスを表します。Eventを作成すると、`event_id` が返されます。更新と終了呼び出しでは、その ID を使用して同じライフサイクルに接続されたままになります。

## エンドポイント

```http
POST /event/create
POST /event/update
POST /event/close
```

リクエストの本文は JSON である必要があり、不明なフィールドは拒否されます。プライベート Gateway が `PUSHGO_TOKEN` を有効にする場合は、`Authorization: Bearer <token>` を含めます。

## ヘッダー

|ヘッダー |必須 |説明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` |はい |リクエスト本文の形式。 |
| `Authorization: Bearer <token>` |ゲートウェイに依存 |プライベート Gateway が `PUSHGO_TOKEN` を有効にする場合にのみ必要です。 |

## ライフサイクル

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   marks the event as ended
```

## 共通フィールド

|フィールド |タイプ |必須 |説明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` |はい |ターゲットチャンネルID。 |
| `password` | `string` |はい | Channel パスワード、通常は 8 ～ 128 文字。 |
| `op_id` | `string` |いいえ |冪等性キー。生成され、省略された場合は返されます。 |
| `thing_id` | `string` |いいえ |このEvent ディスパッチを既存の Thing に関連付けます。 |
| `ciphertext` | `string` |いいえ |オプションの E2EE 暗号文ペイロード。 |

## ルートごとの必須フィールド

|ルート |必須のビジネス分野 |
| :--- | :--- |
| `/event/create` | `title`、`status`、`message`、`severity`、`event_time` |
| `/event/update` | `event_id`、`status`、`message`、`severity`、`event_time` |
| `/event/close` | `event_id`、`status`、`message`、`severity`、`event_time` |

## フィールドルール

|フィールド |タイプ |ルール |
| :--- | :--- | :--- |
| `event_id` | `string` |更新と終了には必須です。作成時に送信してはなりません。 |
| `title` | `string` |作成時に必須。更新時と終了時のオプション。 |
| `description` | `string` |オプション。空の文字列は欠落しているものとして扱われます。 |
| `status` | `string` |必須;空ではなく、最大 24 文字。 |
| `message` | `string` |必須;空ではなく、最大 512 文字。 |
| `severity` | `string` |必須; `critical`、`high`、`normal`、`low`のみ。 |
| `event_time` | `number` |必須;この更新が行われたとき、Unix ミリ秒。 |
| `started_at` | `number` |作成のみ。Event全体の開始時間。 |
| `ended_at` | `number` |閉じるだけ。Event全体の終了時間。 |
| `tags` | `string[]` |最大 32 項目、それぞれ最大 64 文字、トリミングおよび重複排除。 |
| `images` | `string[]` |最大 32 個の画像 URL、それぞれ最大 2048 文字。 |
| `attrs` | `object` |オブジェクトパッチ; `null` はキーを削除します。配列は許可されません。 |
| `metadata` | `object` | スカラー値のみ。キー <= 64、値 <= 512。 |

## Event を作成する

```bash
curl -X POST https://gateway.pushgo.dev/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Production deployment",
    "status": "running",
    "message": "Deployment started",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000,
    "attrs": {
      "service": "api",
      "revision": "8f3c2a1"
    }
  }'
```

応答:

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

返された `event_id` を保存します。 update 呼び出しと close 呼び出しにはそれが必要です。

## Event を更新する

```bash
curl -X POST https://gateway.pushgo.dev/event/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "publishing",
    "message": "Image pushed, publishing release",
    "severity": "normal",
    "event_time": 1713750300000,
    "attrs": {
      "progress": 0.75
    }
  }'
```

`/event/update` は何度でも呼び出すことができます。各更新では、履歴全体を繰り返すのではなく、現在の変更を説明する必要があります。

## Event を閉じる

```bash
curl -X POST https://gateway.pushgo.dev/event/close \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "success",
    "message": "Production deployment completed",
    "severity": "normal",
    "event_time": 1713750600000,
    "ended_at": 1713750600000,
    "attrs": {
      "progress": 1
    }
  }'
```

障害の場合は、`status=failed` を使用し、必要に応じて `severity` を上げます。

## Thing と関連付ける

Eventが永続エンティティで発生する場合は、`thing_id` を含めます。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
  "title": "Database lag",
  "status": "open",
  "message": "Replica lag exceeded 30 seconds",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000
}
```

Thing はオブジェクトを識別します。 Event はそれに起こるプロセスを説明します。

## 応答セマンティクス

Event API は共有応答エンベロープを使用します。 `accepted=true` は、Gateway がディスパッチに入ったことを意味し、すべてのデバイスがシステム通知を表示したことを意味しません。

## よくあるエラー

|ステータス |典型的な理由 |
| :--- | :--- |
| `400` |ルートに必要なフィールドが欠落しています、不明なフィールド、無効な `severity`、無効な `attrs`。 |
| `401` |プライベート Gateway Bearer トークンが見つからないか、間違っています。 |
| `404` | Channel または `event_id` は存在しません。 |
| `413` |リクエストボディが 32KB を超えています。 |
| `503` |ディスパッチは完全には成功しませんでした。 |