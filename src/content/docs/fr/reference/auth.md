---
title: Authentification
description: Comprenez les identifiants du Channel, les jetons de Gateway, les clés de compatibilité et MCP OAuth.
---
L'authentification PushGo dépend de la surface API que vous appelez. Identifiez d’abord le mode, puis placez les informations d’identification au bon endroit.

## Modes d'authentification

| Scénario | Titre requis | Localisation | Utilisé par |
| :--- | :--- | :--- | :--- |
| API native | `channel_id` + `password` | Corps JSON | `/message`, `/event/*`, `/thing/*` |
| Jeton privé Gateway | Jeton Bearer | En-tête `Authorization` | Restreindre les appelants à un Gateway auto-hébergé |
| Point de terminaison de compatibilité | `<channel_id>:<password>` | Champ de chemin ou de compatibilité | Migration des ntfy, Bark, ServerChan |
| MCP OAuth | Jeton d'accès OAuth | Géré par le client MCP | Assistants IA et clients tiers |

L'autorisation Channel et l'autorisation de Gateway sont des couches distinctes. Si un jeton privé Gateway est activé, les requêtes nécessitent toujours un ID de Channel et un mot de passe.

## Autorisation Channel

Les API natives Message, Event et Thing utilisent les identifiants de Channel dans le corps JSON.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Test message"
}
```

| Champ | Descriptif |
| :--- | :--- |
| `channel_id` | Channel cible. |
| `password` | Mot de passe Channel, généralement de 8 à 128 caractères. |

Le mot de passe Channel contrôle qui peut écrire sur un Channel. Il ne s'agit pas d'un mot de passe administrateur Gateway et ne doit pas être placé dans des référentiels publics, des journaux ou du code frontal.

## Gateway Bearer Token

Les Gateways auto-hébergés peuvent activer l'authentification au niveau du Gateway avec `PUSHGO_TOKEN`.

```bash
PUSHGO_TOKEN=replace-with-gateway-token
```

Les requêtes nécessitent alors :

```http
Authorization: Bearer replace-with-gateway-token
```

Exemple complet :

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

Contraintes :

- Utilisez le nom d'en-tête standard `Authorization`.
- Le type Token doit être `Bearer`.
- La longueur du Token est limitée à 4 096 caractères.
- Si `PUSHGO_TOKEN` est vide, l'authentification par jeton au niveau du Gateway est désactivée.

## Gateways publiques

Les Gateways publics valident toujours l'ID du Channel et le mot de passe Channel. Les exemples de mise en route affichent uniquement l'autorisation de Channel par défaut. La stratégie d'accès supplémentaire peut dépendre de la configuration actuelle du point de terminaison public.

## Clés de compatibilité

Les points de terminaison de compatibilité utilisent `<channel_id>:<password>` comme `compat_key`.

| Source | Emplacement clé |
| :--- | :--- |
| ntfy | `/ntfy/{topic}`, où `{topic}` est le `compat_key` |
| ServerChan | `/serverchan/{sendkey}`, où `{sendkey}` est le `compat_key` |
| Bark v1 | `/bark/{device_key}/{body}`, où `{device_key}` est le `compat_key` |
| Bark v2 | Champ JSON `device_key` |

Exemple :

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -d "NAS backup completed"
```

La clé de compatibilité contient le mot de passe Channel et doit être traitée comme un secret.

## MCP OAuth

En mode MCP OAuth, les assistants IA ne doivent pas transmettre les mots de passe des canaux lors des appels d'outils. Le débit recommandé est :

1. Le client MCP se connecte au `https://gateway.example.com/mcp`.
2. L'utilisateur ouvre un lien de liaison.
3. L'utilisateur saisit l'ID de Channel et le mot de passe et confirme l'autorisation.
4. Le Gateway émet un jeton OAuth à portée limitée au client MCP.
5. Les appels d'outils utilisent l'autorisation OAuth pour les canaux liés.

Le mode MCP hérité peut toujours transmettre `password` dans chaque appel d'outil, mais il est préférable de le réserver aux environnements personnels ou de confiance. Les intégrations de production devraient préférer OAuth.

## Recommandations de sécurité

- Ne transmettez pas les mots de passe des Channels, les clés de compatibilité ou les tokens Gateway.
-Utilisez le HTTPS en production.
- Ne codez pas en dur les vrais mots de passe de Channel dans les exemples publics.
- Pour les Gateways auto-hébergées, activez `PUSHGO_TOKEN` et placez l'écouteur HTTP derrière un proxy inverse.
- Pour les intégrations d'assistant AI, préférez MCP OAuth afin que le modèle ne conserve pas directement les mots de passe des canaux.
- Faites pivoter les mots de passe des canaux et les jetons Gateway indépendamment ; ne les définissez pas sur la même valeur.