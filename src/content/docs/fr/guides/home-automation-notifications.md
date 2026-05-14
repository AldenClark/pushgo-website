---
title: Notifications NAS, IoT et Home Assistant
description: Utiliser PushGo pour alertes NAS, appareils IoT, automatisations Home Assistant et états durables.
---

La domotique et le monitoring d’appareils demandent souvent plus qu’une alerte unique. PushGo envoie des notifications, suit des événements et maintient l’état courant.

## Cas adaptés

- Envoyer alertes disque, sauvegarde et services NAS.
- Relier Home Assistant par requête HTTP ou webhook.
- Modéliser appareil, capteur, sauvegarde ou service média comme Thing.
- Utiliser un Gateway privé quand les données domestiques doivent rester contrôlées.

## Comment PushGo modélise ce flux

| Besoin | Utiliser | Pourquoi |
| :--- | :--- | :--- |
| Snapshot ou alerte disque | Message | Le contenu est une alerte unique. |
| Progression sauvegarde ou scan | Event | La progression peut être mise à jour jusqu’à la fin. |
| État capteur ou appareil | Thing | Le dernier état compte plus que chaque historique. |

## Exemple minimal

Un script NAS peut appeler `/message` pour un disque; un job de sauvegarde peut créer un Event et le mettre à jour.

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

- **PushGo peut-il recevoir des webhooks Home Assistant ?** Oui. Home Assistant peut appeler PushGo via webhook ou action REST.
- **Comment éviter les notifications obsolètes ?** Utilisez Thing pour afficher l’état courant du même objet.
- **Cela peut-il tourner en privé ?** Oui. Auto-hébergez le Gateway pour garder le chemin de données privé.

## Sécurité et exploitation

- Utilisez des Channels séparés et des identifiants limités pour les automatisations à risque.
- Préférez MCP OAuth pour les assistants IA afin que les modèles ne détiennent pas les mots de passe Channel.
- Auto-hébergez lorsque le chemin de données, les transports ou les contraintes de conformité doivent rester sous contrôle.
- Utilisez E2EE pour les champs sensibles à déchiffrer uniquement côté client.

## Étapes suivantes

- [Cas d’usage](/fr/guides/use-cases/)
- [API Thing](/fr/reference/api-thing/)
- [Auto-hébergement](/fr/guides/self-hosting/)
