---
title: Notifications DevOps et CI/CD
description: Utiliser PushGo pour CI/CD, déploiements, incidents, serveurs et monitoring avec Message, Event et Thing.
---

Les notifications DevOps restent lisibles quand les alertes uniques, cycles d’incident et états de service sont modélisés séparément.

## Cas adaptés

- Envoyer notifications de build, déploiement et release.
- Suivre un incident comme Event actualisable.
- Montrer l’état actuel d’un service, job de sauvegarde, queue ou host comme Thing.
- Acheminer les alertes vers les clients Apple et Android.

## Comment PushGo modélise ce flux

| Besoin | Utiliser | Pourquoi |
| :--- | :--- | :--- |
| Build terminé | Message | Une notification visible suffit. |
| Déploiement en cours | Event | Le cycle peut évoluer de démarré à échoué ou terminé. |
| Santé service | Thing | L’objet a un état courant qui change. |

## Exemple minimal

Utilisez Message pour une fin de pipeline, Event pour un déploiement à plusieurs étapes, Thing pour l’état courant d’un service.

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

- **PushGo convient-il au CI/CD ?** Oui. Les systèmes CI/CD peuvent appeler l’API HTTP depuis des étapes shell ou webhooks.
- **Comment représenter un incident ?** Comme Event, pour le mettre à jour puis le fermer.
- **Une équipe peut-elle auto-héberger ces alertes ?** Oui. Un Gateway privé contrôle données, authentification et exploitation.

## Sécurité et exploitation

- Utilisez des Channels séparés et des identifiants limités pour les automatisations à risque.
- Préférez MCP OAuth pour les assistants IA afin que les modèles ne détiennent pas les mots de passe Channel.
- Auto-hébergez lorsque le chemin de données, les transports ou les contraintes de conformité doivent rester sous contrôle.
- Utilisez E2EE pour les champs sensibles à déchiffrer uniquement côté client.

## Étapes suivantes

- [Modèles de données](/fr/guides/data-models/)
- [API Event](/fr/reference/api-event/)
- [Auto-hébergement](/fr/guides/self-hosting/)
