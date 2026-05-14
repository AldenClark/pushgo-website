---
title: 端到端加密 (E2EE)
description: 使用 ciphertext 让客户端本地解密敏感 PushGo 字段。
---

PushGo 的 E2EE 设计用于保护敏感业务字段。发送方把要保护的字段加密后放入 `ciphertext`，Gateway 只负责透传密文；客户端在本地配置密钥后解密并覆盖展示字段。

## 它保护什么

| 内容 | 是否由 E2EE 保护 | 说明 |
| :--- | :--- | :--- |
| 放入 `ciphertext` 的业务字段 | 是 | Gateway 无法读取明文。 |
| 明文请求字段 | 否 | 例如 `channel_id`、`password`、`severity`、路由字段仍按普通请求处理。 |
| HTTP Header | 否 | 依赖 HTTPS/TLS 保护。 |
| 投递元数据 | 否 | Gateway 仍需要基本元数据完成鉴权、路由和分发。 |

E2EE 不是网关鉴权的替代品。你仍然需要频道密码、可选的 Gateway Bearer Token 和 HTTPS。

## 加密格式

PushGo 客户端支持 AES-GCM。密钥长度决定算法位数。

| 密钥长度 | 算法 | Nonce / IV | Auth Tag |
| :--- | :--- | :--- | :--- |
| 16 字节 | AES-128-GCM | 12 字节 | 16 字节 |
| 24 字节 | AES-192-GCM | 12 字节 | 16 字节 |
| 32 字节 | AES-256-GCM | 12 字节 | 16 字节 |

二进制布局：

```text
[ ciphertext (N bytes) ][ auth tag (16 bytes) ][ nonce / iv (12 bytes) ]
```

最后把这段二进制整体 Base64 编码，填入 API 的 `ciphertext` 字段。

## 可加密字段

`ciphertext` 解密后必须是 JSON 对象。客户端会识别以下 canonical 字段，并把它们写回通知载荷。

### Message 字段

| 字段 | 类型 | 行为 |
| :--- | :--- | :--- |
| `title` | `string` | 覆盖通知标题。 |
| `body` | `string` | 覆盖消息正文。 |
| `url` | `string` | 覆盖点击跳转 URL。 |
| `images` | `string[]` 或 JSON 字符串 | 覆盖图片列表。 |
| `tags` | `string[]` 或 JSON 字符串 | 覆盖标签列表。 |
| `metadata` | `object` 或 JSON 字符串 | 覆盖 metadata。 |

### Event 字段

| 字段 | 类型 | 行为 |
| :--- | :--- | :--- |
| `description` | `string` | 覆盖事件描述。 |
| `status` | `string` | 覆盖事件状态。 |
| `message` | `string` | 覆盖事件消息。 |
| `started_at` | `number` | 覆盖事件开始时间。 |
| `ended_at` | `number` | 覆盖事件结束时间。 |
| `attrs` | `object` 或 JSON 字符串 | 覆盖事件 attrs patch。 |

### Thing 字段

| 字段 | 类型 | 行为 |
| :--- | :--- | :--- |
| `primary_image` | `string` | 覆盖主图。 |
| `state` | `string` | 覆盖实体状态。 |
| `created_at` | `number` | 覆盖创建时间。 |
| `deleted_at` | `number` | 覆盖删除时间。 |
| `external_ids` | `object` 或 JSON 字符串 | 覆盖外部 ID。 |
| `location_type` | `string` | 覆盖位置类型。 |
| `location_value` | `string` | 覆盖位置值。 |
| `location` | `object` 或 JSON 字符串 | 覆盖位置对象。 |

:::note
为了让 Gateway 正常路由和选择投递优先级，`channel_id`、`password`、`event_id`、`thing_id`、`event_time`、`observed_at`、`severity` 等字段通常应保持明文。
:::

## Python 生成示例

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
    "title": "数据库延迟",
    "body": "从库延迟超过 60 秒。",
    "tags": ["encrypted", "database"],
    "metadata": {"source": "replica-monitor"}
}

key_hex = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
print(encrypt_payload(key_hex, payload))
```

`key_hex` 示例是 32 字节密钥，也就是 AES-256-GCM。实际生产中请使用安全随机密钥，并在客户端本地配置同一密钥。

## API 使用示例

```bash
curl -X POST https://gateway.pushgo.cn/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "加密消息",
    "body": "你的客户端将尝试解密 ciphertext。",
    "severity": "normal",
    "ciphertext": "BASE64_ENCODED_CIPHERTEXT"
  }'
```

明文 `title` 和 `body` 可以作为未配置密钥或解密失败时的退化展示；真正敏感内容应放入 `ciphertext`。

## 解密状态

客户端可能展示以下状态：

| 状态 | 含义 |
| :--- | :--- |
| `decryptOk` | 已成功解密并应用至少一个字段。 |
| `decryptFailed` | 存在密文，但解密或 JSON 解析失败。 |
| `notConfigured` | 客户端未配置可用密钥。 |
| `algMismatch` | 客户端配置的算法与载荷不匹配。 |

## 常见问题

| 问题 | 检查项 |
| :--- | :--- |
| 解密失败 | 密钥是否一致；Base64 是否完整；二进制布局是否为 `ciphertext + tag + nonce`。 |
| 客户端没有覆盖字段 | 解密后的 JSON 是否是对象；字段名是否使用 canonical 名称。 |
| Gateway 仍能看到标题 | 标题如果放在明文字段中就不会被 E2EE 保护；敏感标题也应放入 `ciphertext`。 |
| `severity` 没被加密 | 这是推荐做法，因为 Gateway 和系统推送需要优先级信息进行投递。 |
