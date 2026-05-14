---
title: Self-Hosting
description: Deploy your own PushGo Gateway from a minimal setup to production operations.
---

Self-hosting is for users who want to control data paths, authentication policy, databases, private transports, and MCP/OAuth. The Gateway is a Rust service. HTTP APIs, WSS, and MCP/OAuth share one HTTP listener; QUIC and Raw TCP use separate listening addresses.

## When You Need It

- You do not want notification, event, or entity state to pass through a public Gateway.
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
| Private transports | Android low-latency sync | WSS, then optional QUIC / Raw TCP |
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
  -e PUSHGO_TOKEN_SERVICE_URL='https://token.pushgo.dev' \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

After setting `PUSHGO_TOKEN`, API requests need:

```http
Authorization: Bearer replace-with-gateway-token
```

The channel ID and channel password still belong in the request body. See [Authentication](/reference/auth/) for the difference between the two layers.

## Public Region Endpoints

If the Gateway needs token-service, configure the region explicitly.

| Region | Gateway | token-service |
| :--- | :--- | :--- |
| Global | `https://gateway.pushgo.dev/` | `https://token.pushgo.dev/` |
| Mainland China | `https://gateway.pushgo.cn/` | `https://token.pushgo.cn/` |

A private Gateway may still use the public token-service, or switch to another service as your deployment evolves.

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

`PUSHGO_PUBLIC_BASE_URL` must be the externally reachable HTTPS root. Otherwise MCP issuer metadata, bind links, and client profile hints may contain internal addresses.

## Android Private Transports

Private transports are enabled with `PUSHGO_PRIVATE_TRANSPORTS`. Start with `wss`; it reuses HTTPS and is the least complex option.

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Add QUIC / Raw TCP when you need lower latency or operate in a controlled network.

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

| Setting | Description |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`, `true`, `none`, or explicit list such as `wss` or `quic,tcp,wss`. |
| `PUSHGO_PRIVATE_QUIC_BIND` | Local UDP address the Gateway listens on. |
| `PUSHGO_PRIVATE_QUIC_PORT` | QUIC port advertised to clients. |
| `PUSHGO_PRIVATE_TCP_BIND` | Local TCP address the Gateway listens on. |
| `PUSHGO_PRIVATE_TCP_PORT` | Raw TCP port advertised to clients. |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | Required for QUIC; also required for Raw TCP unless TLS is offloaded. |
| `PUSHGO_PRIVATE_TCP_TLS_OFFLOAD` | Whether edge infrastructure handles Raw TCP TLS. |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Whether the Raw TCP entrypoint expects PROXY protocol v1. |

PushGo QUIC uses a custom ALPN (`pushgo-quic`) and cannot simply share the same UDP/443 entrypoint with HTTP/3. Use a separate UDP port or confirm that your edge proxy can route by protocol correctly.

## MCP / OAuth

Enable MCP with:

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Common settings:

| Environment variable | Default | Description |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Enables Dynamic Client Registration. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | none | Predefined OAuth clients in `client_id:client_secret` format. |
| `PUSHGO_MCP_ACCESS_TOKEN_TTL_SECS` | `900` | Access token lifetime. |
| `PUSHGO_MCP_REFRESH_TOKEN_ABSOLUTE_TTL_SECS` | `2592000` | Refresh token absolute lifetime. |
| `PUSHGO_MCP_REFRESH_TOKEN_IDLE_TTL_SECS` | `604800` | Refresh token idle lifetime. |
| `PUSHGO_MCP_BIND_SESSION_TTL_SECS` | `600` | Channel bind page session lifetime. |

See [MCP Reference](/reference/mcp/) for tools and authorization flow.

## Core Configuration

| CLI / env var | Default | Description |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | HTTP API, WSS, and MCP/OAuth listener. |
| `--db-url` / `PUSHGO_DB_URL` | required | Database URL; supports SQLite, PostgreSQL, and MySQL. |
| `--token` / `PUSHGO_TOKEN` | none | Gateway-level Bearer token. Empty means disabled. |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `https://token.pushgo.dev` | token-service URL. Set explicitly in production. |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | none | External HTTPS root URL. |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | Sandbox mode, including APNs sandbox endpoint. |
| `--observability-profile` / `PUSHGO_OBSERVABILITY_PROFILE` | `prod_min` | Observability profile: `prod_min`, `ops`, `incident`, `debug`. |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | Native tracing log level. |

## Operations

- Include the database in backups; channels, devices, MCP grants, and entity state depend on persistent storage.
- SQLite is suitable for personal or light deployments; prefer PostgreSQL for multi-user or high-concurrency use.
- For high load, inspect dispatch queues and workers before assuming a provider or database problem.
- Use `PUSHGO_OBSERVABILITY_PROFILE=ops` for production troubleshooting; temporarily raise to `incident` or `debug` for deeper investigation.
- For Android private transport issues, start with `/gateway/profile` and externally reachable ports.

Capacity-related settings:

| Environment variable | Description |
| :--- | :--- |
| `PUSHGO_DISPATCH_WORKER_COUNT` | Overrides dispatch worker count. |
| `PUSHGO_DISPATCH_QUEUE_CAPACITY` | Overrides dispatch queue capacity. |
| `PUSHGO_PRIVATE_FALLBACK_TASK_QUEUE_CAPACITY` | Private transport fallback task queue capacity. |
| `PUSHGO_PRIVATE_CONNECTION_QUEUE_CAPACITY` | Per-connection private delivery queue capacity. |
| `PUSHGO_APNS_MAX_IN_FLIGHT` | Max APNs sends in flight per process. |
| `PUSHGO_DISPATCH_TARGETS_CACHE_TTL_MS` | Dispatch target cache TTL. |
| `PUSHGO_SQLITE_PAGE_CACHE_KIB` | SQLite page-cache target. |
| `PUSHGO_SQLITE_WAL_AUTOCHECKPOINT` | SQLite WAL autocheckpoint page count. |

## Upgrade and Rollback

- Back up the database and runtime configuration before upgrading.
- Keep Gateway image/binary, environment variables, and reverse-proxy config traceable.
- Validate `/message`, `/event/create`, and `/thing/create` against a test channel.
- If private transports are enabled, verify that Android clients can fetch the updated `/gateway/profile`.
- If MCP is enabled, verify `/.well-known/*`, `/oauth/*`, and `/mcp` still use the external HTTPS address.
