---
title: Protocole de contexte de modèle (MCP)
description: Intégrez PushGo dans les workflows de l'assistant IA avec MCP et OAuth2.
---
PushGo Gateway peut agir comme un serveur MCP HTTP afin que les assistants IA compatibles MCP puissent envoyer Message, gérer Event et mettre à jour Thing dans les étendues de Channel autorisées. L'autorisation OAuth2 est recommandée afin que les utilisateurs associent des Channels dans un navigateur au lieu de donner des mots de passe de Channel à un modèle.

## Cas adaptés

- Laissez un assistant IA envoyer une notification PushGo une fois la tâche terminée.
- Laissez un assistant IA synchroniser les travaux de longue durée en tant que Event.
- Permettez à un assistant IA de mettre à jour le Thing d’un service, d’un appareil ou d’une tâche.
- Fournir aux clients MCP tiers un accès limité aux Channels autorisés.

MCP ne doit pas remplacer la confirmation de l'utilisateur. Les workflows à fort impact doivent toujours conserver la confirmation au niveau du client ou de la couche orchestration.

## Point de terminaison

```text
https://your-gateway-domain/mcp
```

Si un Gateway public active MCP/OAuth, utilisez le point de terminaison `/mcp` de cette région. Les déploiements auto-hébergés doivent définir un `PUSHGO_PUBLIC_BASE_URL` accessible en externe.

## Activer MCP sur un Gateway privé

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

Si le client ne prend pas en charge DCR, utilisez `PUSHGO_MCP_PREDEFINED_CLIENTS`.

## Modes d'autorisation

| Mode | Mot de passe Channel | Idéal pour | Risque |
| :--- | :--- | :--- | :--- |
| Autorisation OAuth2 | Non transmis dans les appels d'outils | Assistants IA, clients tiers, production | Limité par les portées et les subventions de Channel. |
| Mode hérité | Transmis à chaque appel d’outil | Scripts personnels, environnements de confiance | L’appelant détient directement les mots de passe des Channels. |

Préférez l’autorisation OAuth2 en production.

## Flux de liaison utilisateur

1. Le client MCP se connecte au `/mcp`.
2. Le client obtient une identité client OAuth2 via OAuth ou DCR.
3. L'assistant appelle `pushgo.channel.bind.start`.
4. L'utilisateur ouvre le `bind_url` renvoyé.
5. L'utilisateur saisit l'ID de Channel et le mot de passe et confirme la portée de l'autorisation.
6. L'assistant interroge `pushgo.channel.bind.status`.
7. Après autorisation, l'assistant peut appeler des outils dans la portée du Channel lié.

La durée de vie de la session de liaison est contrôlée par `PUSHGO_MCP_BIND_SESSION_TTL_SECS`.

## Outils

### Message

| Outil | Objectif |
| :--- | :--- |
| `pushgo.message.send` | Envoie un Message unique. Prend en charge `title`, `body`, `url`, `images`, `severity`, `ttl`, `metadata`, `thing_id` et les champs associés. |

### Event

| Outil | Objectif |
| :--- | :--- |
| `pushgo.event.create` | Crée un événement de cycle de vie et renvoie `event_id`. |
| `pushgo.event.update` | Met à jour un événement existant. |
| `pushgo.event.close` | Ferme un événement existant. |

### Thing

| Outil | Objectif |
| :--- | :--- |
| `pushgo.thing.create` | Crée une entité persistante et renvoie `thing_id`. |
| `pushgo.thing.update` | Met à jour les attributs de l'entité. |
| `pushgo.thing.archive` | Archive une entité. |
| `pushgo.thing.delete` | Supprime ou retire une entité. |

### Channel

| Outil ou ressource | Objectif |
| :--- | :--- |
| `pushgo.channel.bind.start` | Crée une session de liaison ou de révocation et renvoie `bind_url`. |
| `pushgo.channel.bind.status` | Vérifie l’état de la session de liaison. |
| `pushgo.channel.list` | Répertorie les Channels actuellement autorisées. |
| `pushgo.channel.unbind` | Révoque l'autorisation de la Channel. |
| `pushgo://channels` | Liste des ressources des canaux autorisés. |
| `pushgo://channels/{channel_id}` | Informations de base pour une Channel. |

## Notes de configuration du client

- Le point de terminaison MCP est `https://your-gateway-domain/mcp`.
- Les proxys inverses doivent transmettre correctement `Host` et `X-Forwarded-Proto`.
- Les déploiements auto-hébergés doivent définir `PUSHGO_PUBLIC_BASE_URL` sur une URL racine HTTPS accessible en externe.
- Si les métadonnées de l'émetteur OAuth ou les liens de liaison contiennent des adresses internes, vérifiez d'abord `PUSHGO_PUBLIC_BASE_URL`.
- Si un client ne prend pas en charge DCR, utilisez des clients prédéfinis.

## Opérations

- Les subventions MCP sont conservées ; ne traitez pas la base de données ou le répertoire de stockage comme un cache jetable.
- Les jetons d'accès sont de courte durée  ; les jetons d’actualisation ont une durée de vie plus longue. Ajustez les TTL en fonction du risque client.
- Faites régulièrement pivoter les secrets clients prédéfinis.
- Utilisez des canaux séparés pour une automatisation à haut risque au lieu de tout autoriser sur un seul Channel.
- Utilisez les journaux et statistiques structurés Gateway pour le débogage opérationnel.

## Dépannage

| Symptôme | Vérifier |
| :--- | :--- |
| Le client ne peut pas découvrir les métadonnées OAuth | `PUSHGO_PUBLIC_BASE_URL` doit être une URL HTTPS externe ; le proxy inverse doit transmettre des itinéraires bien connus. |
| Le lien de liaison ne s'ouvre pas | DNS public, certificat HTTPS, chemin de proxy inverse et `PUSHGO_MCP_BIND_SESSION_TTL_SECS`. |
| DCR échoue | Prise en charge client DCR et `PUSHGO_MCP_DCR_ENABLED`. |
| L’appel d’outil demande `password` | Vous êtes peut-être en mode hérité ou l’autorisation OAuth est incomplète. |
| Autorisé mais aucune Channel visible | Vérifiez la fin de la session de liaison, les scopes et l’éventuelle révocation de l’accès au Channel. |