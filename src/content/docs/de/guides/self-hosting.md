---
title: Selbsthosting
description: Stellen Sie Ihr eigenes PushGo Gateway bereit – von der minimalen Einrichtung bis zum Produktionsbetrieb.
---
Selbsthosting ist für Benutzer gedacht, die Datenpfade, Authentifizierungsrichtlinien, Datenbanken, private Transporte und MCP/OAuth kontrollieren möchten. Der Gateway ist ein Rust-Dienst. HTTP-APIs, WSS und MCP/OAuth teilen sich einen HTTP-Listener; QUIC und Raw TCP verwenden separate Abhöradressen.

## Wenn Sie es brauchen

- Sie möchten nicht, dass Benachrichtigungen, Ereignisse oder Entitätsstatus über einen öffentlichen Gateway weitergeleitet werden.
- Sie benötigen Ihre eigene Datenbank, Backups, Protokolle, Überwachung und Kapazitätsrichtlinien.
- Sie möchten eine Synchronisierung privater Android-Transporte mit geringerer Latenz.
- Sie möchten MCP/OAuth auf Ihrer eigenen Domain.
- Sie benötigen ein Bearer-Token auf Gateway-Ebene, um Aufrufer einzuschränken.

Wenn Sie nur PushGo ausprobieren möchten, verwenden Sie das öffentliche Gateway und folgen Sie den Anweisungen [Erste Schritte](/de/guides/getting-started/).

## Deploymentsebenen

| Ebene | Am besten für | Hauptkonfiguration |
| :--- | :--- | :--- |
| Minimal | Lokale Tests, Einzelbenutzerskripte | SQLite + HTTP API |
| Produktionsbasis | Langjährige Public Domain | HTTPS Reverse-Proxy + persistente Datenbank + Bearer-Token |
| Privattransporte | Android-Synchronisierung mit geringer Latenz | WSS, dann optional QUIC / Raw TCP |
| KI-Integration | MCP Clients und KI-Assistenten | MCP/OAuth + `PUSHGO_PUBLIC_BASE_URL` |

## Minimales Deployment

Das minimale Setup erfordert lediglich eine Datenbank und einen HTTP-Listener.

```bash
mkdir -p /var/lib/pushgo

docker run -d --name pushgo-gateway \
  -p 6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='sqlite:///var/lib/pushgo/pushgo.db?mode=rwc' \
  -v /var/lib/pushgo:/var/lib/pushgo \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

Testen Sie es:

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

Die minimale Einrichtung ist für die Validierung nützlich. Setzen Sie es nicht direkt dem öffentlichen Internet aus.

## Produktionsbasis

Für die Produktion mindestens:

1. Binden Sie den Gateway an localhost oder ein privates Netzwerk.
2. Platzieren Sie Nginx, Caddy oder einen Load Balancer vor dem HTTPS.
3. Legen Sie `PUSHGO_TOKEN` für die Bearer-Authentifizierung auf Gateway-Ebene fest.
4. Verwenden Sie persistenten Speicher und beziehen Sie ihn in Backups ein.
5. Stellen Sie `PUSHGO_PUBLIC_BASE_URL` und `PUSHGO_TOKEN_SERVICE_URL` explizit ein.

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

Nach dem Festlegen von `PUSHGO_TOKEN` benötigen API-Anfragen Folgendes:

```http
Authorization: Bearer replace-with-gateway-token
```

Die Channel-ID und das Channel-Passwort gehören weiterhin in den Anfragetext. Informationen zum Unterschied zwischen den beiden Ebenen finden Sie unter [Authentifizierung](/de/reference/auth/).

## Endpunkte der öffentlichen Region

Wenn der Gateway einen Token-Service benötigt, konfigurieren Sie die Region explizit.

| Region | Gateway | Token-Service |
| :--- | :--- | :--- |
| Global | `https://gateway.pushgo.dev/` | `https://token.pushgo.dev/` |
| Festlandchina | `https://gateway.pushgo.cn/` | `https://token.pushgo.cn/` |

Ein privater Gateway kann weiterhin den öffentlichen Token-Dienst nutzen oder zu einem anderen Dienst wechseln, wenn sich Ihre Deployment weiterentwickelt.

## Reverse-Proxy

HTTP-APIs, WSS und MCP/OAuth teilen sich den HTTP-Listener. Der Reverse-Proxy muss das normale HTTP- und WebSocket-Upgrade unterstützen.

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

`PUSHGO_PUBLIC_BASE_URL` muss der extern erreichbare HTTPS-Root sein. Andernfalls können MCP-Ausstellermetadaten, Bindungslinks und Clientprofilhinweise interne Adressen enthalten.

## Android Private Transporte

Private Transporte werden mit `PUSHGO_PRIVATE_TRANSPORTS` ermöglicht. Beginnen Sie mit `wss`; Es verwendet HTTPS wieder und ist die am wenigsten komplexe Option.

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Fügen Sie QUIC / Raw TCP hinzu, wenn Sie eine geringere Latenz benötigen oder in einem kontrollierten Netzwerk arbeiten.

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

| Einstellung | Beschreibung |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`, `true`, `none` oder explizite Liste wie `wss` oder `quic,tcp,wss`. |
| `PUSHGO_PRIVATE_QUIC_BIND` | Lokale UDP-Adresse, auf der der Gateway lauscht. |
| `PUSHGO_PRIVATE_QUIC_PORT` | Den Clients angekündigter QUIC-Port. |
| `PUSHGO_PRIVATE_TCP_BIND` | Lokale TCP-Adresse, auf der der Gateway lauscht. |
| `PUSHGO_PRIVATE_TCP_PORT` | Den Clients angekündigter Raw TCP-Port. |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | Erforderlich für QUIC; Auch für Raw TCP erforderlich, es sei denn, TLS wird ausgelagert. |
| `PUSHGO_PRIVATE_TCP_TLS_OFFLOAD` | Ob die Edge-Infrastruktur Raw TCP TLS verwaltet. |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Ob der Raw TCP-Einstiegspunkt das PROXY-Protokoll v1 erwartet. |

PushGo QUIC verwendet einen benutzerdefinierten ALPN (`pushgo-quic`) und kann nicht einfach denselben UDP/443-Einstiegspunkt mit HTTP/3 teilen. Verwenden Sie einen separaten UDP-Port oder vergewissern Sie sich, dass Ihr Edge-Proxy das Protokoll korrekt weiterleiten kann.

## MCP / OAuth

Aktivieren Sie MCP mit:

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Allgemeine Einstellungen:

| Umgebungsvariable | Standard | Beschreibung |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Aktiviert die dynamische Client-Registrierung. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | keine | Vordefinierte OAuth-Clients im `client_id:client_secret`-Format. |
| `PUSHGO_MCP_ACCESS_TOKEN_TTL_SECS` | `900` | Lebensdauer des Access Tokens. |
| `PUSHGO_MCP_REFRESH_TOKEN_ABSOLUTE_TTL_SECS` | `2592000` | Absolute Lebensdauer des Refresh Tokens. |
| `PUSHGO_MCP_REFRESH_TOKEN_IDLE_TTL_SECS` | `604800` | Leerlaufzeit des Refresh Tokens. |
| `PUSHGO_MCP_BIND_SESSION_TTL_SECS` | `600` | Lebensdauer der Channel-Bindungssitzung. |

Informationen zu Tools und Autorisierungsablauf finden Sie in der [MCP-Referenz](/de/reference/mcp/).

## Kernkonfiguration

| CLI / Umgebungsvariable | Standard | Beschreibung |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | HTTP-API, WSS und MCP/OAuth-Listener. |
| `--db-url` / `PUSHGO_DB_URL` | erforderlich | Datenbank-URL; unterstützt SQLite, PostgreSQL und MySQL. |
| `--token` / `PUSHGO_TOKEN` | keine | Bearer-Token auf Gateway-Ebene. Leer bedeutet deaktiviert. |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `https://token.pushgo.dev` | Token-Service-URL. Wird in der Produktion explizit festgelegt. |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | keine | Externe HTTPS-Root-URL. |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | Sandbox-Modus, einschließlich Sandbox-Endpunkt APNs. |
| `--observability-profile` / `PUSHGO_OBSERVABILITY_PROFILE` | `prod_min` | Beobachtbarkeitsprofil: `prod_min`, `ops`, `incident`, `debug`. |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | Protokollebene der nativen Ablaufverfolgung. |

## Operationen

- Einbinden der Datenbank in Backups; Channels, Geräte, MCP-Zuteilungen und Entitätsstatus hängen vom dauerhaften Speicher ab.
- SQLite eignet sich für persönliche oder leichte Einsätze; Bevorzugen Sie PostgreSQL für die Verwendung durch mehrere Benutzer oder mit hoher Parallelität.
- Überprüfen Sie bei hoher Auslastung die Versandwarteschlangen und Worker, bevor Sie ein Provider- oder Datenbankproblem annehmen.
- Verwenden Sie `PUSHGO_OBSERVABILITY_PROFILE=ops` zur Fehlerbehebung in der Produktion. Zur eingehenderen Untersuchung vorübergehend auf `incident` oder `debug` erhöhen.
- Beginnen Sie bei Problemen mit dem privaten Android-Transport mit `/gateway/profile` und extern erreichbaren Ports.

Kapazitätsbezogene Einstellungen:

| Umgebungsvariable | Beschreibung |
| :--- | :--- |
| `PUSHGO_DISPATCH_WORKER_COUNT` | Überschreibt die Anzahl der Disponenten. |
| `PUSHGO_DISPATCH_QUEUE_CAPACITY` | Überschreibt die Kapazität der Versandwarteschlange. |
| `PUSHGO_PRIVATE_FALLBACK_TASK_QUEUE_CAPACITY` | Kapazität der Fallback-Aufgabenwarteschlange für den privaten Transport. |
| `PUSHGO_PRIVATE_CONNECTION_QUEUE_CAPACITY` | Kapazität der privaten Zustellungswarteschlange pro Verbindung. |
| `PUSHGO_APNS_MAX_IN_FLIGHT` | Max. APNs sendet Flug pro Prozess. |
| `PUSHGO_DISPATCH_TARGETS_CACHE_TTL_MS` | Ziel-Cache-TTL versenden. |
| `PUSHGO_SQLITE_PAGE_CACHE_KIB` | SQLite Seiten-Cache-Ziel. |
| `PUSHGO_SQLITE_WAL_AUTOCHECKPOINT` | SQLite WAL-Autocheckpoint-Seitenanzahl. |

## Upgrade und Rollback

- Sichern Sie die Datenbank- und Laufzeitkonfiguration vor dem Upgrade.
- Sorgen Sie dafür, dass Gateway-Image/Binärdatei, Umgebungsvariablen und Reverse-Proxy-Konfiguration nachvollziehbar sind.
- Validieren Sie `/message`, `/event/create` und `/thing/create` anhand eines Testkanals.
- Wenn private Transporte aktiviert sind, überprüfen Sie, ob Android-Clients den aktualisierten `/gateway/profile` abrufen können.
- Wenn MCP aktiviert ist, überprüfen Sie, ob `/.well-known/*`, `/oauth/*` und `/mcp` weiterhin die externe HTTPS-Adresse verwenden.