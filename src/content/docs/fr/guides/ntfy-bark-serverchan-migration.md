---
title: Migrer depuis ntfy, Bark ou ServerChan
description: Migrer des scripts ntfy, Bark, ServerChan ou webhook vers PushGo avec endpoints compatibles et modèles natifs.
---

PushGo peut accueillir des workflows existants pendant que les chemins importants migrent vers Message, Event et Thing.

## Cas adaptés

- Garder les scripts simples pendant l’évaluation.
- Migrer un chemin d’alerte à la fois.
- Remplacer le texte brut par cycles ou états structurés quand utile.
- Associer E2EE et auto-hébergement pour les flux sensibles.

## Comment PushGo modélise ce flux

| Besoin | Utiliser | Pourquoi |
| :--- | :--- | :--- |
| Alerte simple migrée | Message | L’ancienne notification reste un message ponctuel. |
| Workflow avec changements | Event | Les mises à jour répétées appartiennent au même cycle. |
| Objet durable surveillé | Thing | La même entité peut être mise à jour. |

## Exemple minimal

Commencez par les endpoints compatibles pour scripts peu risqués, puis migrez vers `/message`, `/event/*` ou `/thing/*`.

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

- **Dois-je tout réécrire ?** Non. Utilisez la compatibilité et migrez d’abord les flux à forte valeur.
- **Quand le texte brut ne suffit-il plus ?** Quand progression, clôture, état actuel, images, métadonnées ou sécurité comptent.
- **Est-ce une comparaison directe ?** Non. La migration est une décision de modélisation.

## Sécurité et exploitation

- Utilisez des Channels séparés et des identifiants limités pour les automatisations à risque.
- Préférez MCP OAuth pour les assistants IA afin que les modèles ne détiennent pas les mots de passe Channel.
- Auto-hébergez lorsque le chemin de données, les transports ou les contraintes de conformité doivent rester sous contrôle.
- Utilisez E2EE pour les champs sensibles à déchiffrer uniquement côté client.

## Étapes suivantes

- [Guide de migration](/fr/guides/migration/)
- [API Message](/fr/reference/api-message/)
- [Modèles de données](/fr/guides/data-models/)
