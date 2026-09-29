---
title: Self-Hosting
description: Deploy your own PushGo Gateway from a minimal setup to production operations.
---

Self-hosting is for users who want to control data paths, authentication policy, databases, private transports, and MCP/OAuth. The Gateway is a Rust service. HTTP APIs, WSS, and MCP/OAuth share one HTTP listener; QUIC and Raw TCP use separate listening addresses.

## When You Need It

- You do not want notification payloads or Event/Thing patches to pass through a public Gateway.
- You need your own database, backups, logs, monitoring, and capacity policy.
- You want lower-latency Android private transport synchronization.
- You want MCP/OAuth on your own domain.
- You need a gateway-level Bearer token to restrict callers.

If you only want to try PushGo, use the public Gateway and follow [Getting Started](/guides/getting-started/).

## Deployment Levels

| Level | Best for | Main configuration |
| :--- | :--- | :--- |
| Minimal | Local testing, single-user scripts | SQLite + HTTP API |
| Production base | Long-running public domain | HTTPS reverse proxy + persistent database + Bearer token |
| Private transports | Android low-latency sync | WSS, then optional QUIC / Raw TCP / MQTT 5 |
| AI integration | MCP clients and AI assistants | MCP/OAuth + `PUSHGO_PUBLIC_BASE_URL` |

## Minimal Deployment

The minimal setup only needs a database and HTTP listener.

```bash
mkdir -p /var/lib/pushgo

docker run -d --name pushgo-gateway \
  -p 6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='sqlite:///var/lib/pushgo/pushgo.db?mode=rwc' \
  -v /var/lib/pushgo:/var/lib/pushgo \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

Test it:

```bash
curl -X POST http://127.0.0.1:6666/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Private Gateway test",
    "body": "This message came from your own Gateway."
  }'
```

The minimal setup is useful for validation. Do not expose it directly to the public internet.

## Production Base

For production, at least:

1. Bind the Gateway to localhost or a private network.
2. Put Nginx, Caddy, or a load balancer in front with HTTPS.
3. Set `PUSHGO_TOKEN` for gateway-level Bearer authentication.
4. Use persistent storage and include it in backups.
5. Set `PUSHGO_PUBLIC_BASE_URL` and `PUSHGO_TOKEN_SERVICE_URL` explicitly.

```bash
docker run -d --name pushgo-gateway \
  -p 127.0.0.1:6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='postgres://user:pass@db:5432/pushgo' \
  -e PUSHGO_TOKEN='replace-with-gateway-token' \
  -e PUSHGO_PUBLIC_BASE_URL='https://gateway.example.com' \
  -e PUSHGO_TOKEN_SERVICE_URL='https://token.example.com' \
  -e PUSHGO_TOKEN_SERVICE_AUTH_TOKEN='replace-with-a-separate-token-service-token' \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

After setting `PUSHGO_TOKEN`, API requests need:

```http
Authorization: Bearer replace-with-gateway-token
```

The channel ID and channel password still belong in the request body. See [Authentication](/reference/auth/) for the difference between the two layers.

When `PUSHGO_TOKEN` is set, `/healthz` and `/readyz` also require the same Bearer token; MCP/OAuth discovery routes are the exception when MCP is enabled.

## Public Region Endpoints

Public Gateways are `https://gateway.pushgo.dev/` (global) and `https://gateway.pushgo.cn/` (Mainland China). A self-hosted Gateway defaults its token-service URL to `http://127.0.0.1:6766`; configure your own reachable service when it is not colocated. Any non-loopback token-service requires the environment-only `PUSHGO_TOKEN_SERVICE_AUTH_TOKEN`. It must be a dedicated Bearer token and must not reuse `PUSHGO_TOKEN`.

## Reverse Proxy

HTTP APIs, WSS, and MCP/OAuth share the HTTP listener. The reverse proxy must support normal HTTP and WebSocket upgrade.

```nginx
server {
    listen 443 ssl http2;
    server_name gateway.example.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:6666;
    }
}
```

`PUSHGO_PUBLIC_BASE_URL` should be the externally reachable HTTPS root. When MCP is enabled it is required and must use HTTPS unless the HTTP listener is loopback-only for local development; otherwise MCP issuer metadata and bind links cannot be bootstrapped safely.

## Android Private Transports

Private transports are enabled with `PUSHGO_PRIVATE_TRANSPORTS`. Start with `wss`; it reuses HTTPS and is the least complex option.

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Add QUIC, Raw TCP, or MQTT 5 when required.

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss,mqtt
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_MQTT_BIND=0.0.0.0:1883
PUSHGO_MQTT_PORT=1883
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

| Setting | Description |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`/`off`/`disabled`/`none` disables all; `true`/`on`/`enabled`/`all` enables `quic,tcp,wss,mqtt`; otherwise use a comma-, semicolon-, pipe-, or whitespace-separated list. Default is `false`. Enabling all also enables QUIC, so a TLS certificate and key are required. |
| `PUSHGO_PRIVATE_QUIC_BIND` | Local UDP address the Gateway listens on. |
| `PUSHGO_PRIVATE_QUIC_PORT` | QUIC port advertised to clients. |
| `PUSHGO_PRIVATE_TCP_BIND` | Local TCP address the Gateway listens on. |
| `PUSHGO_PRIVATE_TCP_PORT` | Raw TCP port advertised to clients. |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | Required for QUIC and when TCP or MQTT TLS termination is enabled in Gateway. |
| `PUSHGO_PRIVATE_TCP_TLS_ENABLED` | Whether Gateway terminates Raw TCP TLS; default `false` allows edge TLS termination or controlled plain TCP. |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Whether the Raw TCP entrypoint expects PROXY protocol v1; default `false`. |
| `PUSHGO_MQTT_BIND` / `PUSHGO_MQTT_PORT` | MQTT listener and advertised port; defaults `127.0.0.1:1883` and `1883`. |
| `PUSHGO_MQTT_TLS_ENABLED` | Whether Gateway terminates MQTT TLS; default `false`. |
| `PUSHGO_MQTT_MAX_PACKET_BYTES` | Maximum MQTT packet size; default `32768`. |

PushGo QUIC uses a custom ALPN (`pushgo-quic`) and cannot simply share the same UDP/443 entrypoint with HTTP/3. Use a separate UDP port or confirm that your edge proxy can route by protocol correctly.

Container deployments must publish the selected listeners: HTTP `6666/tcp`, QUIC `5223/udp`, Raw TCP `5223/tcp`, and MQTT `1883/tcp` in the default examples. MQTT clients must use MQTT 5 and QoS 1.

## MCP / OAuth

Enable MCP with:

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

For non-loopback deployments, the public base URL is mandatory and must be absolute HTTPS with no credentials, query, or fragment. Omitting it is supported only for loopback-bound local development, where the Gateway derives a loopback HTTP issuer.

Common settings:

| Environment variable | Default | Description |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Enables Dynamic Client Registration. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | none | Predefined OAuth clients in `client_id:client_secret` format; separate multiple clients by newline or semicolon. |

See [MCP Reference](/reference/mcp/) for tools and authorization flow.

## Core Configuration

| CLI / env var | Default | Description |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | HTTP API, WSS, and MCP/OAuth listener. |
| `--db-url` / `PUSHGO_DB_URL` | required | Database URL; supports SQLite, PostgreSQL, and MySQL. |
| `--runtime-profile` / `PUSHGO_RUNTIME_PROFILE` | `small` | Runtime sizing profile: `small` for private/light deployments, `public` for high-load deployments. |
| `--token` / `PUSHGO_TOKEN` | none | Gateway-level Bearer token. Empty means disabled. |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `http://127.0.0.1:6766` | token-service URL. Non-loopback services also require `PUSHGO_TOKEN_SERVICE_AUTH_TOKEN`. |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | none | External HTTPS root URL. |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | Sandbox mode, including APNs sandbox endpoint. |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | Native tracing log level. |
| `--db-upgrade` / `PUSHGO_DB_UPGRADE` | none | Run only database upgrade `plan` or `run`, then exit. |

## Operations

- Include the database in backups; it contains channels, devices/routes, pending delivery state, sender status, MCP grants/sessions, and Widget/Live Activity subscriptions. Event/Thing projections and history live on subscribed clients rather than as canonical Gateway records.
- SQLite is suitable for personal or light deployments; prefer PostgreSQL for multi-user or high-concurrency use.
- For high load, check the active `PUSHGO_RUNTIME_PROFILE`, Gateway logs, and downstream provider or database health before tuning infrastructure.
- Temporarily raise `PUSHGO_OBSERVABILITY_LOG_LEVEL` for troubleshooting, then restore the normal level.
- For Android private transport issues, start with `/gateway/profile` and externally reachable ports.

Runtime capacity:

Runtime capacity is profile-owned in Gateway v1.3.0. Use `PUSHGO_RUNTIME_PROFILE=small` for private or light deployments and `PUSHGO_RUNTIME_PROFILE=public` for high-load public deployments. Low-level queue, dispatch, provider, DB-pool, and SQLite tuning values are internal profile defaults instead of public env vars.

## Upgrade and Rollback

Before upgrading to schema v12, run `--db-upgrade plan`, take a verified v11 snapshot, and then run `--db-upgrade run`. Once a v12 Gateway has accepted durable work, do not roll an older binary onto that database: preserve the database and recover forward with the exact v12-aware emergency artifact. To return to a pre-v12 release, restore the v11 snapshot taken before v12 writes. Never relabel the schema or delete pending delivery state.

- Back up the database and runtime configuration before upgrading.
- Keep Gateway image/binary, environment variables, and reverse-proxy config traceable.
- Validate `/message`, `/event/create`, and `/thing/create` against a test channel.
- If private transports are enabled, verify that Android clients can fetch the updated `/gateway/profile`.
- If MCP is enabled, verify `/.well-known/*`, `/oauth/*`, and `/mcp` still use the external HTTPS address.
