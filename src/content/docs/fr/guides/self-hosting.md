---
title: Auto-hébergement
description: Déployez votre propre Gateway PushGo depuis une configuration minimale jusqu'aux opérations de production.
---
L'auto-hébergement est destiné aux utilisateurs qui souhaitent contrôler les chemins de données, la politique d'authentification, les bases de données, les transports privés et MCP/OAuth. Le Gateway est un service Rust. Les API HTTP, WSS et MCP/OAuth partagent un écouteur HTTP ; QUIC et Raw TCP utilisent des adresses d'écoute distinctes.

## Quand vous en avez besoin

- Vous ne souhaitez pas que l'état d'une notification, d'un événement ou d'une entité passe par un Gateway public.
- Vous avez besoin de votre propre base de données, sauvegardes, journaux, surveillance et politique de capacité.
- Vous souhaitez une synchronisation des transports privés Android à faible latence.
- Vous voulez MCP/OAuth sur votre propre domaine.
- Vous avez besoin d'un jeton Bearer au niveau du Gateway pour restreindre les appelants.

Si vous souhaitez uniquement essayer PushGo, utilisez le Gateway public et suivez [Mise en route](/fr/guides/getting-started/).

## Niveaux de déploiement

| Niveau | Idéal pour | Configuration principale |
| :--- | :--- | :--- |
| Minime | Tests locaux, scripts mono-utilisateur | API SQLite + HTTP |
| Base de production | Domaine public de longue date | Proxy inverse HTTPS + base de données persistante + jeton Bearer |
| Transports privés | Synchronisation Android à faible latence | WSS, puis QUIC / Raw TCP en option |
| Intégration de l'IA | Clients MCP et assistants IA | MCP/OAuth + `PUSHGO_PUBLIC_BASE_URL` |

## Déploiement minimal

La configuration minimale n'a besoin que d'une base de données et d'un écouteur HTTP.

```bash
mkdir -p /var/lib/pushgo

docker run -d --name pushgo-gateway \
  -p 6666:6666 \
  -e PUSHGO_HTTP_ADDR=0.0.0.0:6666 \
  -e PUSHGO_DB_URL='sqlite:///var/lib/pushgo/pushgo.db?mode=rwc' \
  -v /var/lib/pushgo:/var/lib/pushgo \
  ghcr.io/aldenclark/pushgo-gateway:latest
```

Testez-le :

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

La configuration minimale est utile pour la validation. Ne l’exposez pas directement à l’Internet public.

##Base de production

Pour la production, au moins :

1. Liez le Gateway à un hôte local ou à un réseau privé.
2. Placez Nginx, Caddy ou un équilibreur de charge devant HTTPS.
3. Définissez `PUSHGO_TOKEN` pour l'authentification Bearer au niveau du Gateway.
4. Utilisez le stockage persistant et incluez-le dans les sauvegardes.
5. Définissez explicitement `PUSHGO_PUBLIC_BASE_URL` et `PUSHGO_TOKEN_SERVICE_URL`.

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

Après avoir défini `PUSHGO_TOKEN`, les requêtes API nécessitent :

```http
Authorization: Bearer replace-with-gateway-token
```

L'ID de Channel et le mot de passe Channel appartiennent toujours au corps de la requête. Voir [Authentification](/fr/reference/auth/) pour connaître la différence entre les deux couches.

## Points de terminaison de la région publique

Si le Gateway a besoin d'un service de jeton, configurez explicitement la région.

| Région | Gateway | service de jetons |
| :--- | :--- | :--- |
| Mondial | `https://gateway.pushgo.dev/` | `https://token.pushgo.dev/` |
| Chine continentale | `https://gateway.pushgo.cn/` | `https://token.pushgo.cn/` |

Un Gateway privé peut toujours utiliser le service de jeton public ou passer à un autre service à mesure que votre déploiement évolue.

## Proxy inverse

Les API HTTP, WSS et MCP/OAuth partagent l'écouteur HTTP. Le proxy inverse doit prendre en charge la mise à niveau normale de HTTP et WebSocket.

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

`PUSHGO_PUBLIC_BASE_URL` doit être la racine HTTPS accessible en externe. Sinon, les métadonnées de l'émetteur MCP, les liens de liaison et les indications de profil client peuvent contenir des adresses internes.

## Transports privés Android

Les transports privés sont activés avec `PUSHGO_PRIVATE_TRANSPORTS`. Commencez par `wss` ; il réutilise le HTTPS et constitue l'option la moins complexe.

```bash
PUSHGO_PRIVATE_TRANSPORTS=wss
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Ajoutez QUIC / Raw TCP lorsque vous avez besoin d'une latence plus faible ou que vous travaillez dans un réseau contrôlé.

```bash
PUSHGO_PRIVATE_TRANSPORTS=quic,tcp,wss
PUSHGO_PRIVATE_QUIC_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_QUIC_PORT=5223
PUSHGO_PRIVATE_TCP_BIND=0.0.0.0:5223
PUSHGO_PRIVATE_TCP_PORT=5223
PUSHGO_PRIVATE_TLS_CERT=/certs/fullchain.pem
PUSHGO_PRIVATE_TLS_KEY=/certs/privkey.pem
```

| Paramètre | Descriptif |
| :--- | :--- |
| `PUSHGO_PRIVATE_TRANSPORTS` | `false`, `true`, `none` ou liste explicite telle que `wss` ou `quic,tcp,wss`. |
| `PUSHGO_PRIVATE_QUIC_BIND` | Adresse UDP locale sur laquelle le Gateway écoute. |
| `PUSHGO_PRIVATE_QUIC_PORT` | Port QUIC annoncé aux clients. |
| `PUSHGO_PRIVATE_TCP_BIND` | Adresse TCP locale sur laquelle le Gateway écoute. |
| `PUSHGO_PRIVATE_TCP_PORT` | Port Raw TCP annoncé aux clients. |
| `PUSHGO_PRIVATE_TLS_CERT` / `PUSHGO_PRIVATE_TLS_KEY` | Requis pour QUIC ; également requis pour Raw TCP, sauf si TLS est déchargé. |
| `PUSHGO_PRIVATE_TCP_TLS_OFFLOAD` | Si l’infrastructure Edge gère Raw TCP TLS. |
| `PUSHGO_PRIVATE_TCP_PROXY_PROTOCOL` | Indique si le point d'entrée Raw TCP attend le protocole PROXY v1. |

PushGo QUIC utilise un ALPN personnalisé (`pushgo-quic`) et ne peut pas simplement partager le même point d'entrée UDP/443 avec HTTP/3. Utilisez un port UDP distinct ou confirmez que votre proxy Edge peut acheminer correctement par protocole.

## MCP / OAuth

Activez le MCP avec :

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Paramètres communs :

| Variable d'environnement | Par défaut | Descriptif |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Permet l'enregistrement dynamique des clients. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | aucun | Clients OAuth prédéfinis au format `client_id:client_secret`. |
| `PUSHGO_MCP_ACCESS_TOKEN_TTL_SECS` | `900` | Durée de vie du jeton d’accès. |
| `PUSHGO_MCP_REFRESH_TOKEN_ABSOLUTE_TTL_SECS` | `2592000` | Durée de vie absolue du refresh token. |
| `PUSHGO_MCP_REFRESH_TOKEN_IDLE_TTL_SECS` | `604800` | Durée d'inactivité du refresh token. |
| `PUSHGO_MCP_BIND_SESSION_TTL_SECS` | `600` | Durée de vie de la session de page de liaison Channel. |

Voir [Référence MCP](/fr/reference/mcp/) pour les outils et le flux d'autorisation.

## Configuration de base

| CLI / variable d'environnement | Par défaut | Descriptif |
| :--- | :--- | :--- |
| `--http-addr` / `PUSHGO_HTTP_ADDR` | `127.0.0.1:6666` | API HTTP, écouteur WSS et MCP/OAuth. |
| `--db-url` / `PUSHGO_DB_URL` | requis | URL de la base de données ; prend en charge SQLite, PostgreSQL et MySQL. |
| `--token` / `PUSHGO_TOKEN` | aucun | Jeton Bearer au niveau du Gateway. Vide signifie désactivé. |
| `--token-service-url` / `PUSHGO_TOKEN_SERVICE_URL` | `https://token.pushgo.dev` | URL du service de jetons. Défini explicitement en production. |
| `--public-base-url` / `PUSHGO_PUBLIC_BASE_URL` | aucun | URL racine externe HTTPS. |
| `--sandbox-mode` / `PUSHGO_SANDBOX_MODE` | `false` | Mode sandbox, y compris le point de terminaison sandbox APNs. |
| `--observability-profile` / `PUSHGO_OBSERVABILITY_PROFILE` | `prod_min` | Profil d'observabilité : `prod_min`, `ops`, `incident`, `debug`. |
| `--observability-log-level` / `PUSHGO_OBSERVABILITY_LOG_LEVEL` | `warn` | Niveau de journal de traçage natif. |

## Opérations

- Inclure la base de données dans les sauvegardes  ; les canaux, les appareils, les autorisations MCP et l'état de l'entité dépendent du stockage persistant.
- SQLite convient aux déploiements personnels ou légers ; préférez PostgreSQL pour une utilisation multi-utilisateurs ou à haute concurrence.
- En cas de charge élevée, inspectez les files d'attente de répartition et les travailleurs avant de supposer un problème de fournisseur ou de base de données.
- Utilisez `PUSHGO_OBSERVABILITY_PROFILE=ops` pour le dépannage de production ; augmenter temporairement à `incident` ou `debug` pour une enquête plus approfondie.
- Pour les problèmes de transport privé Android, commencez par `/gateway/profile` et les ports accessibles en externe.

Paramètres liés à la capacité :

| Variable d'environnement | Descriptif |
| :--- | :--- |
| `PUSHGO_DISPATCH_WORKER_COUNT` | Remplace le nombre de répartiteurs. |
| `PUSHGO_DISPATCH_QUEUE_CAPACITY` | Remplace la capacité de la file d’attente de répartition. |
| `PUSHGO_PRIVATE_FALLBACK_TASK_QUEUE_CAPACITY` | Capacité de la file d’attente des tâches de secours du transport privé. |
| `PUSHGO_PRIVATE_CONNECTION_QUEUE_CAPACITY` | Capacité de file d’attente de livraison privée par connexion. |
| `PUSHGO_APNS_MAX_IN_FLIGHT` | Max APNs envoie en vol par processus. |
| `PUSHGO_DISPATCH_TARGETS_CACHE_TTL_MS` | Répartir la durée de vie du cache cible. |
| `PUSHGO_SQLITE_PAGE_CACHE_KIB` | Cible du cache de pages SQLite. |
| `PUSHGO_SQLITE_WAL_AUTOCHECKPOINT` | Nombre de pages du point de contrôle automatique SQLite WAL. |

## Mise à niveau et restauration

- Sauvegardez la base de données et la configuration d'exécution avant la mise à niveau.
- Gardez l'image/binaire Gateway, les variables d'environnement et la configuration du proxy inverse traçables.
- Validez `/message`, `/event/create` et `/thing/create` par rapport à un Channel de test.
- Si les transports privés sont activés, vérifiez que les clients Android peuvent récupérer le `/gateway/profile` mis à jour.
- Si MCP est activé, vérifiez que `/.well-known/*`, `/oauth/*` et `/mcp` utilisent toujours l'adresse externe HTTPS.