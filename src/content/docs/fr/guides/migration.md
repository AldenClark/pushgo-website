---
title: Guide de migration
description: Migrez les scripts ntfy, Bark, ServerChan ou webhook existants vers PushGo.
---
La migration vers PushGo ne nécessite pas de réécrire tous les scripts en même temps. Commencez par des points de terminaison de compatibilité pour que les scripts existants continuent de fonctionner, puis mettez à niveau les workflows importants vers les API natives Message, Event ou Thing.

## Chemin recommandé

1. **Modifiez le point de terminaison** : pointez votre requête ntfy, Bark ou ServerChan vers le point de terminaison de compatibilité PushGo.
2. **Remplacez la clé** : utilisez `<channel_id>:<password>` comme clé de compatibilité.
3. **Normaliser les champs** : mappez les champs de priorité, de niveau, de groupe, d'icône et similaires dans `severity`, `tags`, `images` ou `metadata`.
4. **Modèles de mise à niveau** : conservez des alertes ponctuelles comme Message ; mettre à niveau les cycles de vie vers Event ; mettez à niveau l'état persistant vers Thing.

## Points de terminaison de compatibilité

| Source | Méthode | Chemin PushGo | Emplacement clé |
| :--- | :--- | :--- | :--- |
| ntfy | `POST` / `PUT` | `/ntfy/{topic}` | `{topic}` = `<channel_id>:<password>` |
| ServerChan | `GET` / `POST` | `/serverchan/{sendkey}` | `{sendkey}` = `<channel_id>:<password>` |
| Bark v1 | `GET` | `/bark/{device_key}/{body}` | `{device_key}` = `<channel_id>:<password>` |
| Bark v2 | `POST` | `/bark/push` | Champ JSON `device_key` |

Les points de terminaison de compatibilité réduisent les coûts de migration. Ils n'expriment pas le modèle de données PushGo complet. Utilisez des API natives lorsque vous avez besoin des cycles de vie `thing_id`, Event ou de l'état Thing complet.

## De ntfy

Ancienne requête :

```bash
curl -d "NAS backup completed" https://ntfy.example.com/my-topic
```

Point de terminaison de compatibilité PushGo :

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -H "Priority: 3" \
  -d "NAS backup completed"
```

Message natif :

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The NAS backup task has finished.",
    "severity": "normal",
    "tags": ["nas", "backup"]
  }'
```

## De Bark

Bark place généralement la clé de l'appareil dans le chemin. Remplacez cette clé par `<channel_id>:<password>`.

```bash
curl "https://gateway.pushgo.dev/bark/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD/Server%20alert?title=CPU%20High&level=timeSensitive"
```

Si vous utilisez déjà les requêtes JSON, préférez migrer directement vers le Message natif. Les API natives expriment plus clairement `images`, `tags`, `metadata`, `thing_id` et E2EE.

## De ServerChan

```bash
curl -X POST https://gateway.pushgo.dev/serverchan/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -d "title=Deployment completed" \
  -d "desp=Production deployment succeeded"
```

Le ServerChan est principalement un modèle d'alerte ponctuel. Si votre script envoie "démarré", "en cours d'exécution" et "terminé", effectuez une mise à niveau directement vers Event.

## Quand passer à Event

Si la même tâche envoie des mises à jour en plusieurs étapes, Event est mieux adapté.

| Comportement de l'ancien script | Expression Event |
| :--- | :--- |
| Envoyer "déploiement démarré" | `/event/create` |
| Envoyer "build terminé" ou "publication" | `/event/update` |
| Envoyer "déploiement réussi/échoué" | `/event/close` |

Cela permet aux clients d'afficher une chronologie cohérente au lieu de messages sans rapport.

## Quand passer à Thing

Si votre script signale à plusieurs reprises l'état actuel du même objet, utilisez Thing.

| Comportement de l'ancien script | Expression Thing |
| :--- | :--- |
| Envoyer CPU/mémoire toutes les minutes | `/thing/update` avec `attrs` |
| Envoyer la température ambiante à plusieurs reprises | Une pièce ou un capteur par `thing_id` |
| Service d'alertes en ligne/hors ligne | Thing pour le service, Message ou Event pour les incidents |

## Limites de compatibilité

- Les clés de compatibilité contiennent le mot de passe de la Channel ; ne les écrivez pas dans les journaux publics.
- Le point de terminaison de compatibilité ntfy ne prend pas en charge `thing_id`.
- Les points de terminaison de compatibilité ne peuvent pas exprimer le cycle de vie complet du Thing.
- La priorité et les noms de champs spécifiques au fournisseur sont mappés et ne peuvent pas être conservés un à un.
- Les métadonnées complexes, E2EE et les relations entre entités sont plus claires après la migration vers les API natives.