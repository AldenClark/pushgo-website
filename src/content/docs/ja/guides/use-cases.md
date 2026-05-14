---
title: 使用例
description: 実践的な PushGo シナリオを通じて、Message、Event、Thingについて学びます。
---
このページはモデリング クックブックであり、機能リストではありません。各シナリオでは、どのモデルを使用するべきか、またそのモデルがすべてに対してプレーン テキスト通知を送信するよりも明確である理由について説明します。

## サーバーと NAS

### ディスク アラート: Message

ディスク使用量がしきい値を超えた場合、強力なアラートを 1 つだけで十分です。

```bash
USAGE=$(df / | awk 'NR==2 { gsub("%", "", $5); print $5 }')

if [ "$USAGE" -ge 90 ]; then
  curl -X POST https://gateway.pushgo.dev/message \
    -H "Content-Type: application/json" \
    -d '{
      "channel_id": "YOUR_CHANNEL_ID",
      "password": "YOUR_CHANNEL_PASSWORD",
      "title": "Disk space warning",
      "body": "Root partition usage has reached '"$USAGE"'%.",
      "severity": "high",
      "tags": ["nas", "disk"]
    }'
fi
```

### バックアップ ジョブ: Event

バックアップには開始、進行状況、および結果があります。 Event は、これらの更新を 1 つのライフサイクルで維持します。

```bash
curl -X POST https://gateway.pushgo.dev/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "NAS backup",
    "status": "running",
    "message": "Backup started",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000
  }'
```

返された `event_id` を保存し、アップロード、検証、完了、または失敗時に `/event/update` および `/event/close` を呼び出します。

### ホストステータスパネル: Thing

サーバーの現在の状態を長期にわたって確認したい場合は、ホストを Thing としてモデル化します。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Home NAS",
  "observed_at": 1713750000000,
  "tags": ["nas", "home"],
  "attrs": {
    "online": true,
    "cpu": 0.18,
    "disk_used": 0.72,
    "temperature": 43.2
  }
}
```

## Home Assistant と IoT

### 部屋またはセンサー: Thing

温度、湿度、光は持続的な状態です。各部屋またはデバイスを Thing としてモデル化し、`attrs` を更新します。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Living room",
  "observed_at": 1713750000000,
  "external_ids": {
    "home_assistant": "sensor.living_room_temperature"
  },
  "location_type": "physical",
  "location_value": "home/living-room",
  "attrs": {
    "temperature": 22.5,
    "humidity": 0.46
  }
}
```

### ドア開閉: Event

開いたドアは、ドアが閉じると終了するプロセスです。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Balcony door open",
  "status": "open",
  "message": "The balcony door has been open for more than 5 minutes.",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "tags": ["home", "door"]
}
```

### モーション スナップショット: Message

1 つのスナップショットによるカメラの動き検出は Message です。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Motion detected",
  "body": "Entry camera detected motion.",
  "severity": "high",
  "images": ["https://example.com/snapshot.jpg"],
  "tags": ["camera", "security"]
}
```

## DevOps と自動化

### デプロイメントパイプライン: Event

デプロイメントにはライフサイクル状態があります。最初に作成し、主要な段階で更新し、成功または失敗で終了します。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Production deployment",
  "status": "building",
  "message": "Building image",
  "severity": "normal",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "attrs": {
    "service": "api",
    "revision": "8f3c2a1"
  }
}
```

失敗した場合は、`severity` を `critical` に上げ、`status=failed` でEventを終了します。

### サービスヘルス: Thing

オンライン状態、レイテンシ、バージョンは現在の状態です。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "API service",
  "observed_at": 1713750000000,
  "location_type": "cloud",
  "location_value": "prod",
  "attrs": {
    "healthy": true,
    "latency_ms": 83,
    "version": "1.8.4"
  }
}
```

### 障害アラート: Message

Event が展開ライフサイクルを記録する場合でも、モバイルの可視性を強化するために障害ポイントで Message を送信できます。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Production deployment failed",
  "body": "The api service deployment failed. Check the pipeline logs.",
  "severity": "critical",
  "tags": ["deploy", "prod"]
}
```

## パーソナルオートメーション

### 価格モニター: Message

通常、価格しきい値は 1 つのアラートです。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Price dropped",
  "body": "The tracked product is now 199.",
  "severity": "normal",
  "url": "https://example.com/product"
}
```

### 長いダウンロードまたはトランスコーディング ジョブ: Event

ダウンロード、トランスコーディング、トレーニング ジョブは、開始、更新、終了するためEventです。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Video transcoding",
  "status": "running",
  "message": "45% complete",
  "severity": "normal",
  "event_time": 1713750000000,
  "attrs": {
    "progress": 0.45
  }
}
```

## モデリングチートシート

|シナリオ |モデル |なぜ |
| :--- | :--- | :--- |
|失敗、成功、価格下落、警告 | Message | 1 回限りのアラート。 |
|導入、バックアップ、トランスコーディング、インシデント | Event |更新と結果を含むプロセス。 |
|サーバー、センサー、ルーム、サービス | Thing |現在の状態を持つ永続オブジェクト。 |
|特定のデバイスに関するアラート | Thing + Message |エンティティとアラートは接続されたままになります。 |
|サービスに関するインシデント | Thing + Event |サービスは実体です。インシデントはライフサイクルです。 |