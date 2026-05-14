---
title: Notifications pour agents IA avec MCP
description: Envoyer des notifications, événements et mises à jour d’état depuis des agents IA et chatbots via PushGo MCP et OAuth.
---

PushGo convient lorsqu’un agent IA, un chatbot ou un client MCP doit prévenir un utilisateur, suivre une tâche longue ou mettre à jour l’état d’un objet sans exposer le mot de passe du Channel au modèle.

## Cas adaptés

- Prévenir un utilisateur quand une tâche d’agent se termine.
- Suivre la progression comme un Event actualisable.
- Mettre à jour un service, appareil ou tâche comme Thing.
- Accorder un accès limité aux clients MCP via OAuth.

## Comment PushGo modélise ce flux

| Besoin | Utiliser | Pourquoi |
| :--- | :--- | :--- |
| Alerte de fin unique | Message | L’utilisateur a besoin d’une notification visible. |
| Tâche longue d’agent | Event | La même tâche peut être mise à jour puis fermée. |
| État actuel d’un service ou d’une tâche | Thing | L’agent met à jour un objet persistant. |
| Autorisation assistant | MCP OAuth | Le modèle n’a pas besoin du mot de passe Channel dans les appels d’outil. |

## Exemple minimal

Un client MCP se connecte à `/mcp`, lance `pushgo.channel.bind.start`, l’utilisateur autorise un Channel dans le navigateur, puis l’assistant peut appeler `pushgo.message.send`, `pushgo.event.update` ou `pushgo.thing.update` dans ce périmètre.

```text
pushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send
```

## Questions auxquelles cette page répond

- **Un agent IA peut-il envoyer une notification mobile ?** Oui. Les outils MCP de PushGo permettent aux agents autorisés d’envoyer des Messages.
- **Un chatbot doit-il connaître le mot de passe du Channel ?** Non. En production, utilisez MCP OAuth pour lier le Channel dans le navigateur.
- **Comment suivre la progression ?** Utilisez Event pour les tâches longues, car il peut être mis à jour puis fermé.

## Sécurité et exploitation

- Utilisez des Channels séparés et des identifiants limités pour les automatisations à risque.
- Préférez MCP OAuth pour les assistants IA afin que les modèles ne détiennent pas les mots de passe Channel.
- Auto-hébergez lorsque le chemin de données, les transports ou les contraintes de conformité doivent rester sous contrôle.
- Utilisez E2EE pour les champs sensibles à déchiffrer uniquement côté client.

## Étapes suivantes

- [Référence MCP](/fr/reference/mcp/)
- [Authentification](/fr/reference/auth/)
- [Modèles de données](/fr/guides/data-models/)
