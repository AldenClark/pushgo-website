---
title: データモデル
description: Message、Event、Thing の使い分けと、主要フィールドの境界を理解します。
---
PushGo の 3 つのデータモデルは、それぞれ異なる意味を持ちます。適切なモデルを選ぶと、クライアントでの表示、履歴、状態の統合、自動化の扱いがわかりやすくなります。

## 判断マトリクス

| 表現したいこと | 使うモデル | 理由 |
| :--- | :--- | :--- |
| 「何かが起きたので、一度だけ知らせたい」 | Message | 継続的な状態を持たず、各通知が独立しています。 |
| 「何かが始まり、途中で変化し、最後に終わる」 | Event | 1 つの `event_id` を何度も更新してから閉じられます。 |
| 「このデバイス、サービス、部屋、タスクの現在状態を持ちたい」 | Thing | 1 つの `thing_id` を長期的に更新できます。 |
| 「特定の対象でアラートが発生した」 | Thing + Message | Thing が対象を識別し、Message がアラートを記録します。 |
| 「特定の対象で処理が進行している」 | Thing + Event | Thing が対象を識別し、Event がライフサイクルを記録します。 |

## Message: 一度きりのアラート

Message はもっとも単純な通知モデルです。あとで統合、更新、終了処理をする必要がない内容に使います。

### 向いているケース

- ディスク使用量がしきい値を超えた。
- バックアップが完了した。
- 価格が下がった。
- カメラが動きを検知し、スナップショットを添付する。

### 向かないケース

- デプロイのビルド、公開、終了までの流れ。
- サーバー、センサー、部屋の最新状態。
- 時間とともに上書きされるダッシュボード値。

### フィールドグループ

| グループ | フィールド |
| :--- | :--- |
| 認証とルーティング | `channel_id`、`password`、`op_id`、`thing_id` |
| 表示 | `title`、`body`、`severity`、`url`、`images`、`tags` |
| 時刻と安全性 | `occurred_at`、`ttl`、`ciphertext` |
| 拡張データ | `metadata` |

### 最小例

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Backup completed",
  "body": "The daily NAS backup has finished.",
  "severity": "normal"
}
```

## Event: 更新できるライフサイクル

Event はプロセスを表します。作成すると `event_id` が返り、その後の更新と最後の close 呼び出しでは同じ ID を使います。

### 向いているケース

- CI/CD デプロイ: 開始、ビルド、公開、成功または失敗。
- インシデント対応: 検知、調査、復旧。
- ドアや窓の状態: 開いてから閉じるまで。
- 長時間かかる処理: トランスコード、同期、モデルトレーニング。

### ライフサイクル

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   ends the event
```

### フィールドグループ

| グループ | フィールド |
| :--- | :--- |
| 認証とルーティング | `channel_id`、`password`、`op_id`、`thing_id` |
| ライフサイクル | `event_id`、`event_time`、`started_at`、`ended_at` |
| 表示 | `title`、`description`、`status`、`message`、`severity`、`tags`、`images` |
| 拡張データ | `attrs`、`metadata`、`ciphertext` |

### モデリングのヒント

- `status` には `running`、`degraded`、`success`、`failed` のような短い値を使います。
- `message` には「イメージを push した」など、今回の更新内容を書きます。
- `event_time` は、この更新が発生した時刻です。
- `started_at` は Event 全体の開始時刻で、通常は作成時に指定します。
- `ended_at` は Event 全体の終了時刻で、通常は close 時に指定します。

## Thing: 継続的なエンティティ状態

Thing は長期的に存在する対象を表します。変更のたびに別々の通知を作るのではなく、同じ対象を更新し続けることに価値があります。

### 向いているケース

- 自宅 NAS、サーバー、ネットワークサービス。
- 部屋、センサー、カメラ、ロック。
- 長時間存在する資産やタスク。
- 現在状態を表示し続けたいもの。

### ライフサイクル

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

### フィールドグループ

| グループ | フィールド |
| :--- | :--- |
| 認証とルーティング | `channel_id`、`password`、`op_id` |
| 識別と表示 | `thing_id`、`title`、`description`、`tags`、`primary_image`、`images` |
| 時刻 | `created_at`、`observed_at`、`deleted_at` |
| 外部システム | `external_ids`、`location_type`、`location_value` |
| 状態 | `attrs`、`metadata`、`ciphertext` |

### モデリングのヒント

- `title` には「Home NAS」のような、人が読める名前を入れます。
- CPU、温度、オンライン状態など変化する値は `attrs` に入れます。
- 通常表示しない補助情報は `metadata` に入れます。
- Home Assistant など外部システムの ID と結び付けるには `external_ids` を使います。

## モデルを組み合わせる

| 組み合わせ | パターン |
| :--- | :--- |
| Thing + Message | 「Home NAS」という Thing で「ディスクがほぼいっぱい」というアラートが発生する。 |
| Thing + Event | 「Production database」という Thing でレプリケーション遅延 Event が進行する。 |
| Event + Message | Event でライフサイクルを記録し、重要な時点では Message で強い通知を送る。 |

迷ったときは Message から始めてください。スクリプトが「開始/更新/終了」や「現在値の変更」を繰り返し送るようになったら、Event または Thing に移行します。
