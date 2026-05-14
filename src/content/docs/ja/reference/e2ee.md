---
title: エンドツーエンドの暗号化
description: クライアントが機密性の高い PushGo フィールドをローカルで復号化できるように、暗号文を使用します。
---
PushGo E2EE は機密性の高いビジネス分野を保護します。送信者はフィールドを `ciphertext` に暗号化し、Gateway がその暗号文を中継し、クライアントはキーの設定後にローカルで復号化します。

## 保護するもの

|コンテンツ | E2EEによって保護されています |メモ |
| :--- | :--- | :--- |
| `ciphertext`内の事業分野 |はい | Gateway は平文を読み取ることができません。 |
|プレーンなリクエストフィールド |いいえ | `channel_id`、`password`、`severity`、およびルート ID は通常のリクエスト フィールドです。 |
| HTTP ヘッダー |いいえ | E2EE ではなく、HTTPS/TLS によって保護されます。 |
|配信メタデータ |いいえ | Gateway には、認証、ルーティング、ディスパッチのための基本的なメタデータが依然として必要です。 |

E2EE は、Gateway 認証に代わるものではありません。チャネル資格情報、オプションの Gateway Bearer トークン、および HTTPS が引き続き必要です。

## 暗号化形式

PushGo クライアントは AES-GCM をサポートします。キーの長さによって AES バリアントが決まります。

|キーの長さ |アルゴリズム |ノンス / IV |認証タグ |
| :--- | :--- | :--- | :--- |
| 16バイト | AES-128-GCM | 12バイト | 16バイト |
| 24バイト | AES-192-GCM | 12バイト | 16バイト |
| 32バイト | AES-256-GCM | 12バイト | 16バイト |

バイナリレイアウト:

```text
[ ciphertext (N bytes) ][ auth tag (16 bytes) ][ nonce / iv (12 bytes) ]
```

完全なバイナリ BLOB を Base64 でエンコードし、API `ciphertext` フィールドに配置します。

## 暗号化可能なフィールド

復号化後、`ciphertext` には JSON オブジェクトが含まれている必要があります。クライアントは次の正規フィールドを認識し、それらを通知ペイロードに書き戻します。

### Message フィールド

|フィールド |タイプ |行動 |
| :--- | :--- | :--- |
| `title` | `string` |通知のタイトルを上書きします。 |
| `body` | `string` |Message本文をオーバーライドします。 |
| `url` | `string` |リンク先 URL をオーバーライドします。 |
| `images` | `string[]` または JSON 文字列 |画像リストをオーバーライドします。 |
| `tags` | `string[]` または JSON 文字列 |タグリストをオーバーライドします。 |
| `metadata` | `object` または JSON 文字列 |メタデータをオーバーライドします。 |

### Event フィールド

|フィールド |タイプ |行動 |
| :--- | :--- | :--- |
| `description` | `string` |Eventの説明をオーバーライドします。 |
| `status` | `string` |Eventステータスをオーバーライドします。 |
| `message` | `string` |EventMessageをオーバーライドします。 |
| `started_at` | `number` |Eventの開始時間をオーバーライドします。 |
| `ended_at` | `number` |Eventの終了時刻をオーバーライドします。 |
| `attrs` | `object` または JSON 文字列 |Event属性パッチをオーバーライドします。 |

### Thing フィールド

|フィールド |タイプ |行動 |
| :--- | :--- | :--- |
| `primary_image` | `string` |プライマリ イメージをオーバーライドします。 |
| `state` | `string` |エンティティの状態をオーバーライドします。 |
| `created_at` | `number` |作成時間をオーバーライドします。 |
| `deleted_at` | `number` |削除時刻をオーバーライドします。 |
| `external_ids` | `object` または JSON 文字列 |外部 ID をオーバーライドします。 |
| `location_type` | `string` |場所のタイプをオーバーライドします。 |
| `location_value` | `string` |位置の値をオーバーライドします。 |
| `location` | `object` または JSON 文字列 |位置オブジェクトをオーバーライドします。 |

:::note
ルーティングと配信優先度に必要なフィールド (`channel_id`、`password`、`event_id`、`thing_id`、`event_time`、`observed_at`、`severity` など) は通常、プレーンテキストのままにする必要があります。
:::

## Python の例

```python
import base64
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_payload(key_hex, payload):
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    plaintext = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    cipher_and_tag = aesgcm.encrypt(nonce, plaintext, None)
    return base64.b64encode(cipher_and_tag + nonce).decode("utf-8")


payload = {
    "title": "Database lag",
    "body": "Replica lag exceeded 60 seconds.",
    "tags": ["encrypted", "database"],
    "metadata": {"source": "replica-monitor"}
}

key_hex = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
print(encrypt_payload(key_hex, payload))
```

例の `key_hex` は、AES-256-GCM の 32 バイトのキーです。本番環境では安全に生成されたランダム キーを使用し、同じキーをクライアントでローカルに構成します。

## API の使用法

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Encrypted message",
    "body": "Your client will try to decrypt ciphertext.",
    "severity": "normal",
    "ciphertext": "BASE64_ENCODED_CIPHERTEXT"
  }'
```

プレーン `title` および `body` は、キーのないクライアントまたは復号化が失敗した場合のフォールバック表示として使用できます。本当に機密性の高いコンテンツを `ciphertext` 内に置きます。

## 復号化状態

|状態 |意味 |
| :--- | :--- |
| `decryptOk` |復号化が成功し、少なくとも 1 つのフィールドが適用されました。 |
| `decryptFailed` |暗号文は存在しますが、復号化または解析に失敗しました。 |
| `notConfigured` |クライアントには使用可能なキーが構成されていません。 |
| `algMismatch` |構成されたアルゴリズムがペイロードと一致しません。 |

## トラブルシューティング

|問題 |チェック |
| :--- | :--- |
|復号化に失敗します |同じキー、完全な Base64、バイナリ レイアウト `ciphertext + tag + nonce`。 |
| クライアントがフィールドを上書きしない | 復号後の JSON はオブジェクトである必要があり、フィールド名は正規のものにしてください。 |
| Gateway ではまだタイトルが表示されます |プレーン リクエスト フィールドは E2EE で保護されていません。機密性の高いタイトルは `ciphertext` に入れてください。 |
| `severity` は暗号化されていません | Gateway およびプラットフォーム プッシュ サービスには優先度情報が必要であるため、これをお勧めします。 |