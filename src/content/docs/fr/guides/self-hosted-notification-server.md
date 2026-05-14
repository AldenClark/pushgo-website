---
title: Serveur de notification open source auto-hébergé
description: Déployer PushGo Gateway comme serveur de notification auto-hébergé avec transports privés, état persistant, E2EE et MCP/OAuth.
---

Auto-hébergez PushGo quand le chemin de notification, le stockage, l’authentification, les transports privés et MCP/OAuth doivent rester sous votre contrôle.

## Cas adaptés

- Exploiter un Gateway privé pour automatisations personnelles ou d’équipe.
- Éviter que notifications, événements et états passent par un Gateway public.
- Exposer votre propre endpoint HTTPS `/mcp` pour les assistants IA.
- Intégrer sauvegardes, reverse proxy, journaux et observabilité.

## Comment PushGo modélise ce flux

| Besoin | Utiliser | Pourquoi |
| :--- | :--- | :--- |
| Chemin privé | Gateway | Votre infrastructure contrôle l’API HTTP et les listeners. |
| Champs sensibles | E2EE | Les clients déchiffrent localement. |
| Accès assistant IA | MCP OAuth | Les utilisateurs lient les Channels via votre URL publique. |

## Exemple minimal

Définissez `PUSHGO_PUBLIC_BASE_URL` sur l’origine HTTPS publique avant d’activer MCP/OAuth.

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

- **PushGo peut-il être un serveur auto-hébergé ?** Oui. Le Gateway est conçu pour un déploiement privé avec stockage persistant.
- **L’auto-hébergement permet-il MCP ?** Oui. Un Gateway privé peut exposer `/mcp` et OAuth avec une base HTTPS publique.
- **Faut-il des sauvegardes ?** Oui. Channels, appareils, autorisations MCP, Events et Things dépendent du stockage persistant.

## Sécurité et exploitation

- Utilisez des Channels séparés et des identifiants limités pour les automatisations à risque.
- Préférez MCP OAuth pour les assistants IA afin que les modèles ne détiennent pas les mots de passe Channel.
- Auto-hébergez lorsque le chemin de données, les transports ou les contraintes de conformité doivent rester sous contrôle.
- Utilisez E2EE pour les champs sensibles à déchiffrer uniquement côté client.

## Étapes suivantes

- [Auto-hébergement](/fr/guides/self-hosting/)
- [Chiffrement de bout en bout](/fr/reference/e2ee/)
- [Référence MCP](/fr/reference/mcp/)
