---
title: API de notification push pour scripts et services
description: Utiliser PushGo comme API HTTP de notification pour curl, webhooks, cron, CI/CD, alertes NAS et scripts d’automatisation.
---

PushGo fournit une API HTTP directe pour les scripts et services qui doivent envoyer des notifications visibles tout en gardant des modèles structurés pour événements et états.

## Cas adaptés

- Envoyer depuis curl, cron, un script shell ou un webhook.
- Signaler fin de tâche, alerte de prix, image ou résultat de monitoring.
- Utiliser Event et Thing au lieu d’un flux de texte désordonné.
- Commencer par les endpoints compatibles puis migrer vers les APIs natives.

## Comment PushGo modélise ce flux

| Besoin | Utiliser | Pourquoi |
| :--- | :--- | :--- |
| Alerte unique | Message | Simple, transitoire et facile à tester avec curl. |
| Tâche avec progression | Event | Le même événement peut être mis à jour jusqu’à la fin. |
| État actuel d’un service ou appareil | Thing | Les clients voient le dernier état plutôt que des alertes périmées. |

## Exemple minimal

L’endpoint natif `/message` accepte du JSON et indique si le Gateway a accepté la demande dans le flux de distribution.

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Bonjour depuis PushGo",
    "body": "Le parcours d’automatisation fonctionne."
  }'
```

## Questions auxquelles cette page répond

- **Puis-je envoyer une notification avec curl ?** Oui. Message API est faite pour curl, les scripts et les clients HTTP simples.
- **PushGo est-il seulement une API mobile ?** Non. PushGo modélise aussi les cycles Event et l’état actuel Thing.
- **Puis-je auto-héberger cette API ?** Oui. Vous pouvez exploiter votre propre Gateway avec authentification, stockage, transports et MCP/OAuth.

## Sécurité et exploitation

- Utilisez des Channels séparés et des identifiants limités pour les automatisations à risque.
- Préférez MCP OAuth pour les assistants IA afin que les modèles ne détiennent pas les mots de passe Channel.
- Auto-hébergez lorsque le chemin de données, les transports ou les contraintes de conformité doivent rester sous contrôle.
- Utilisez E2EE pour les champs sensibles à déchiffrer uniquement côté client.

## Étapes suivantes

- [Bien démarrer](/fr/guides/getting-started/)
- [API Message](/fr/reference/api-message/)
- [Auto-hébergement](/fr/guides/self-hosting/)
