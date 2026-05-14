---
title: 端對端加密 (E2EE)
description: 使用 ciphertext 讓用戶端本地解密敏感 PushGo 欄位。
---
PushGo 的 E2EE 設計用於保護敏感業務欄位。發送方把要保護的欄位加密後放入 `ciphertext`，Gateway 只負責透傳密文；用戶端在本機設定金鑰後解密並覆寫展示欄位。

## 它保護什麼

| 內容 | 是否由 E2EE 保護 | 說明 |
| :--- | :--- | :--- |
| 放入 `ciphertext` 的業務欄位 | 是 | Gateway 無法讀取明文。 |
| 明文請求欄位 | 否 | 例如 `channel_id`、`password`、`severity`、路由欄位仍依普通請求處理。 |
| HTTP Header | 否 | 依賴 HTTPS/TLS 保護。 |
| 投遞元資料 | 否 | Gateway 仍需要基本元資料完成驗證、路由和分發。 |

E2EE 不是 Gateway 驗證的替代品。你仍然需要 Channel 密碼、可選配的 Gateway Bearer Token 和 HTTPS。

## 加密格式

PushGo 用戶端支援 AES-GCM。金鑰長度決定演演算法位數。

| 金鑰長度 | 演演算法 | Nonce / IV | Auth Tag |
| :--- | :--- | :--- | :--- |
| 16 位元組 | AES-128-GCM | 12 位元組 | 16 位元組 |
| 24 位元組 | AES-192-GCM | 12 位元組 | 16 位元組 |
| 32 位元組 | AES-256-GCM | 12 位元組 | 16 位元組 |

二進位佈局：

```text
[ ciphertext (N bytes) ][ auth tag (16 bytes) ][ nonce / iv (12 bytes) ]
```

最後把這段二進位整體 Base64 編碼，填入 API 的 `ciphertext` 欄位。

## 可加密欄位

`ciphertext` 解密後必須是 JSON 物件。用戶端會識別以下 canonical 欄位，並將它們寫回通知負載。

### Message 欄位

| 欄位 | 型別 | 行為 |
| :--- | :--- | :--- |
| `title` | `string` | 覆蓋通知標題。 |
| `body` | `string` | 覆蓋訊息正文。 |
| `url` | `string` | 覆蓋點選跳轉 URL。 |
| `images` | `string[]` 或 JSON 字串 | 覆寫圖片清單。 |
| `tags` | `string[]` 或 JSON 字串 | 覆寫標籤清單。 |
| `metadata` | `object` 或 JSON 字串 | 覆寫 metadata。 |

### Event 欄位

| 欄位 | 型別 | 行為 |
| :--- | :--- | :--- |
| `description` | `string` | 覆蓋事件描述。 |
| `status` | `string` | 覆蓋事件狀態。 |
| `message` | `string` | 覆蓋事件訊息。 |
| `started_at` | `number` | 覆蓋事件開始時間。 |
| `ended_at` | `number` | 覆蓋事件結束時間。 |
| `attrs` | `object` 或 JSON 字串 | 覆蓋事件 attrs patch。 |

### Thing 欄位

| 欄位 | 型別 | 行為 |
| :--- | :--- | :--- |
| `primary_image` | `string` | 覆蓋主圖。 |
| `state` | `string` | 覆蓋實體狀態。 |
| `created_at` | `number` | 覆蓋建立時間。 |
| `deleted_at` | `number` | 覆蓋刪除時間。 |
| `external_ids` | `object` 或 JSON 字串 | 覆寫外部 ID。 |
| `location_type` | `string` | 覆蓋位置型別。 |
| `location_value` | `string` | 覆蓋位置值。 |
| `location` | `object` 或 JSON 字串 | 覆寫位置物件。 |

:::note
為了讓 Gateway 正常路由和選擇投遞優先權，`channel_id`、`password`、`event_id`、`thing_id`、`event_time`、`observed_at`、`severity` 等通常應保持明文欄位。
:::

## Python 生成範例

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
    "title": "資料庫延遲",
    "body": "從庫延遲超過 60 秒。",
    "tags": ["encrypted", "database"],
    "metadata": {"source": "replica-monitor"}
}

key_hex = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
print(encrypt_payload(key_hex, payload))
```

`key_hex` 範例是 32 位元組金鑰，也就是 AES-256-GCM。實際生產中請使用安全隨機金鑰，並在用戶端本機設定相同金鑰。

## API 使用範例

```bash
curl -X POST https://gateway.pushgo.cn/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "加密訊息",
    "body": "你的用戶端將嘗試解密 ciphertext。",
    "severity": "normal",
    "ciphertext": "BASE64_ENCODED_CIPHERTEXT"
  }'
```

明文 `title` 和 `body` 可以作為未配置金鑰或解密失敗時的退化展示；真正敏感內容應放入 `ciphertext`。

## 解密狀態

用戶端可能會展示以下狀態：

| 狀態 | 意義 |
| :--- | :--- |
| `decryptOk` | 已成功解密並套用至少一個欄位。 |
| `decryptFailed` | 存在密文，但解密或 JSON 解析失敗。 |
| `notConfigured` | 用戶端未配置可用金鑰。 |
| `algMismatch` | 用戶端配置的演演算法與負載不符。 |

## 常見問題

| 問題 | 檢查項 |
| :--- | :--- |
| 解密失敗 | 金鑰是否一致；Base64 是否完整；二進位佈局是否為 `ciphertext + tag + nonce`。 |
| 用戶端沒有覆寫欄位 | 解密後的 JSON 是否是物件；欄位名稱是否使用 canonical 名稱。 |
| Gateway 仍能看到標題 | 標題如果放在明文欄位就不會被 E2EE 保護；敏感標題也應放入 `ciphertext`。 |
| `severity` 沒加密 | 這是建議做法，因為 Gateway 和系統推送需要優先資訊進行投遞。 |