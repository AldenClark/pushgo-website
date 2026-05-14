---
title: 認証
description: チャネル認証情報、ゲートウェイ トークン、互換性キー、MCP OAuth について理解します。
---
PushGo 認証は、呼び出す API サーフェスによって異なります。まずモードを特定してから、資格情報を適切な場所に配置します。

## 認証モード

|シナリオ |必要な資格情報 |場所 |使用者 |
| :--- | :--- | :--- | :--- |
|ネイティブAPI | `channel_id` + `password` | JSON本体 | `/message`、`/event/*`、`/thing/*` |
|プライベート Gateway トークン | Bearerトークン | `Authorization`ヘッダー |呼び出し元をセルフホスト型 Gateway に制限する |
|互換性エンドポイント | `<channel_id>:<password>` |パスまたは互換性フィールド | ntfy、Bark、ServerChan の移行 |
| MCP OAuth | OAuth アクセストークン | MCP クライアントが管理 | AI アシスタントとサードパーティ クライアント |

Channel 認証とゲートウェイ認証は別のレイヤーです。プライベート Gateway トークンが有効な場合でも、リクエストにはチャネル ID とパスワードが必要です。

## Channel 認可

ネイティブ Message、Event、および Thing API は、JSON 本体のチャネル資格情報を使用します。

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Test message"
}
```

|フィールド |説明 |
| :--- | :--- |
| `channel_id` |対象チャンネル。 |
| `password` | Channel パスワード、通常は 8 ～ 128 文字。 |

チャネルのパスワードは、チャネルに書き込みできるユーザーを制御します。これは Gateway 管理者パスワードではないため、パブリック リポジトリ、ログ、またはフロントエンド コードに配置しないでください。

## Gateway Bearer Token

セルフホステッド ゲートウェイは、`PUSHGO_TOKEN` を使用したゲートウェイ レベルの認証を有効にできます。

```bash
PUSHGO_TOKEN=replace-with-gateway-token
```

リクエストには次のものが必要です。

```http
Authorization: Bearer replace-with-gateway-token
```

完全な例:

```bash
curl -X POST https://gateway.example.com/message \
  -H "Authorization: Bearer replace-with-gateway-token" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Private Gateway test"
  }'
```

制約:

- 標準ヘッダ名 `Authorization` を使用します。
- Token タイプは `Bearer` である必要があります。
- Token の長さは 4096 文字に制限されています。
- `PUSHGO_TOKEN` が空の場合、ゲートウェイ レベルのトークン認証は無効になります。

## パブリックゲートウェイ

パブリック ゲートウェイは引き続きチャネル ID とチャネル パスワードを検証します。 「はじめに」の例では、デフォルトでチャネル認証のみを示しています。追加のアクセス ポリシーは、現在のパブリック エンドポイント構成に応じて異なる場合があります。

## 互換性キー

互換性エンドポイントは、`<channel_id>:<password>` を `compat_key` として使用します。

|出典 |鍵の場所 |
| :--- | :--- |
| ntfy | `/ntfy/{topic}`、`{topic}` は `compat_key` |
| ServerChan | `/serverchan/{sendkey}`、`{sendkey}` は `compat_key` |
| Bark v1 | `/bark/{device_key}/{body}`、`{device_key}` は `compat_key` |
| Bark v2 | JSON フィールド `device_key` |

例:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -d "NAS backup completed"
```

互換性キーにはチャネルのパスワードが含まれており、秘密として扱う必要があります。

## MCP OAuth

MCP OAuth モードでは、AI アシスタントはツール呼び出しでチャネル パスワードを渡すべきではありません。推奨されるフローは次のとおりです。

1. MCP クライアントは `https://gateway.example.com/mcp` に接続します。
2. ユーザーはバインド リンクを開きます。
3. ユーザーはチャネル ID とパスワードを入力し、承認を確認します。
4. Gateway は、スコープ限定の OAuth トークンを MCP クライアントに発行します。
5. ツール呼び出しでは、バインドされたチャネルに対して OAuth 認証を使用します。

従来の MCP モードでも各ツール呼び出しで `password` を渡すことができますが、個人用または信頼できる環境用に予約するのが最適です。実稼働統合では、OAuth を優先する必要があります。

## セキュリティに関する推奨事項

- チャネル パスワード、互換性キー、または Gateway トークンをコミットしないでください。
- 本番環境では HTTPS を使用します。
- 公開例では、実際のチャネル パスワードをハードコーディングしないでください。
- セルフホスト型ゲートウェイの場合、`PUSHGO_TOKEN` を有効にし、HTTP リスナーをリバース プロキシの背後に配置します。
- AI アシスタントの統合の場合は、モデルがチャネル パスワードを直接保持しないように、MCP OAuth を優先します。
- チャネルパスワードとGatewayトークンを個別にローテーションします。それらを同じ値に設定しないでください。