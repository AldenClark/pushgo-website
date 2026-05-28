---
title: ThingAPI
description: /thing/create、/thing/update、/thing/archive、および /thing/delete を使用して、永続的なエンティティの状態を管理します。
---
Thing API は、サーバー、部屋、センサー、ネットワークサービス、長時間実行されるタスクなど、時間の経過とともに変化する長期的に存在するオブジェクトを表します。 Thing を作成すると、`thing_id` が返されます。更新、アーカイブ、および削除の呼び出しでは、その ID が使用されます。

## エンドポイント

```http
POST /thing/create
POST /thing/update
POST /thing/archive
POST /thing/delete
```

リクエストの本文は JSON である必要があり、不明なフィールドは拒否されます。プライベート Gateway が `PUSHGO_TOKEN` を有効にする場合は、`Authorization: Bearer <token>` を含めます。

## ヘッダー

|ヘッダー |必須 |説明 |
| :--- | :--- | :--- |
| `Content-Type: application/json` |はい |リクエスト本文の形式。 |
| `Authorization: Bearer <token>` |ゲートウェイに依存 |プライベート Gateway が `PUSHGO_TOKEN` を有効にする場合にのみ必要です。 |

## ライフサイクル

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

## 共通フィールド

|フィールド |タイプ |必須 |説明 |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` |はい |ターゲットチャンネルID。 |
| `password` | `string` |はい | Channel パスワード、通常は 8 ～ 128 文字。 |
| `op_id` | `string` |いいえ |冪等性キー。生成され、省略された場合は返されます。 |
| `ciphertext` | `string` |いいえ |オプションの E2EE 暗号文ペイロード。 |

## ルートごとの必須フィールド

|ルート |必須のビジネス分野 |
| :--- | :--- |
| `/thing/create` | `observed_at` |
| `/thing/update` | `thing_id`、`observed_at` |
| `/thing/archive` | `thing_id`、`observed_at` |
| `/thing/delete` | `thing_id`、`observed_at` |

## フィールドルール

|フィールド |タイプ |ルール |
| :--- | :--- | :--- |
| `thing_id` | `string` | update/archive/delete で必須。create では送信不可。1-64 文字、英数字/`_`/`:`/`-`。 |
| `title` | `string` |作成時に推奨されます。 Gateway は現在、不足している `title` を拒否しません。 |
| `description` | `string` |オプション。空の文字列は欠落しているものとして扱われます。 |
| `tags` | `string[]` |最大 32 項目、それぞれ最大 64 文字、トリミングおよび重複排除。 |
| `primary_image` | `string` |オプションの URL、最大 2048 文字。 |
| `images` | `string[]` |最大 32 個の画像 URL、それぞれ最大 2048 文字。 |
| `created_at` | `number` |作成のみ。省略すると `observed_at` に戻ります。 |
| `deleted_at` | `number` |削除のみ。省略すると `observed_at` に戻ります。 |
| `observed_at` | `number` | 必須。この状態更新の観測時刻。Unix 秒またはミリ秒を受け付け、ミリ秒へ正規化します。 |
| `external_ids` | `object` | key は `[A-Za-z0-9_:.-]`、<= 64、lowercase 化。value は空でない `string` <= 256、削除は `null`。 |
| `location_type` + `location_value` | `string` + `string` | 必ず同時に指定します。type は `physical`、`geo`、`cloud`、`datacenter`、`logical`。形式: `geo` は `lat,lng`、`cloud` は `provider:region[:zone]`、`datacenter` は `site[:room[:rack]]`、`logical` は slash 区切り token。 |
| `attrs` | `object` |オブジェクトパッチ; `null` はキーを削除します。配列は許可されません。ネストされたオブジェクト レベルは 1 つだけです。 |
| `metadata` | `object` | いいえ | カスタムのスカラー key-value。key <= 64、空でないスカラー value <= 512。ネストしたオブジェクトと配列は拒否されます。 |

## Thing を作成する

```bash
curl -X POST https://gateway.pushgo.dev/thing/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Home NAS",
    "description": "Primary storage in the living room rack",
    "observed_at": 1713750000000,
    "tags": ["nas", "home"],
    "location_type": "physical",
    "location_value": "home/living-room",
    "attrs": {
      "online": true,
      "disk_used": 0.72,
      "temperature": 43.2
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
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

返された `thing_id` を保存します。更新、アーカイブ、および削除の呼び出しにはこれが必要です。

## Thing を更新する

```bash
curl -X POST https://gateway.pushgo.dev/thing/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713750600000,
    "attrs": {
      "disk_used": 0.74,
      "temperature": 44.1
    }
  }'
```

`attrs`はパッチです。毎回完全な状態を送信する必要はありません。キーを削除するには、`null` を渡します。

```json
{
  "attrs": {
    "temporary_alarm": null
  }
}
```

## Thing をアーカイブする

アーカイブは、もうアクティブではないが履歴を保持する必要があるオブジェクト用です。

```bash
curl -X POST https://gateway.pushgo.dev/thing/archive \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751200000,
    "attrs": {
      "online": false
    }
  }'
```

## Thing を削除する

オブジェクトが削除または廃止される場合は、`/thing/delete` を使用します。

```bash
curl -X POST https://gateway.pushgo.dev/thing/delete \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751800000,
    "deleted_at": 1713751800000
  }'
```

## アソシエイト Message および Event

Thing は永続オブジェクトを表します。関連するアラートでは、Message を `thing_id` とともに使用できます。関連プロセスは、Event を `thing_id` とともに使用できます。

|シナリオ |モデル |
| :--- | :--- |
|現在の NAS CPU、温度、ディスク使用率 | Thing |
| NAS 上の 1 つのディスクに関する警告 | Message + `thing_id` |
| NAS バックアップの開始から完了まで | Event + `thing_id` |

## 応答セマンティクス

Thing API は共有応答エンベロープを使用します。 `accepted=true` は、Gateway がディスパッチに入ったことを意味し、すべてのデバイスがシステム通知を表示したことを意味しません。

## よくあるエラー

|ステータス |典型的な理由 |
| :--- | :--- |
| `400` | `observed_at` がありません、不明なフィールド、無効な `attrs` または `external_ids`。 |
| `401` |プライベート Gateway Bearer トークンが見つからないか、間違っています。 |
| `404` | Channel または `thing_id` は存在しません。 |
| `413` |リクエストボディが 32KB を超えています。 |
| `503` |ディスパッチは完全には成功しませんでした。 |