---
title: Commencer
description: Installez un client, créez une Channel et recevez votre première notification PushGo.
---
Ce guide est destiné aux nouveaux utilisateurs du PushGo. À la fin, vous aurez un Channel utilisable et une requête HTTP fonctionnelle qui envoie votre premier Message.

## Prérequis

- Un appareil sur lequel un client PushGo publié est installé.
- Un terminal pouvant exécuter `curl`.
- Un ID de Channel et un mot de passe Channel. Vous pouvez créer une nouvelle Channel dans le client ou vous abonner à une Channel partagée par un autre appareil.

## 1. Installer un client

Installez l'un des clients publiés.

| Plateforme | Télécharger | Exigence |
| :--- | :--- | :--- |
| iOS/macOS/watchOS | [App Store](https://apps.apple.com/app/pushgo) | iOS 18+, macOS 15+, watchOS 11+ |
| Android | [Publications GitHub](https://github.com/AldenClark/pushgo-android/releases) | Android 9+ |

## 2. Créez ou abonnez-vous à un Channel

Un Channel est la limite d'écriture du PushGo. Les requêtes sont dirigées vers un Channel et les appareils abonnés deviennent des cibles de livraison.

### Créer un nouveau Channel

1. Ouvrez le client.
2. Utilisez l'action d'ajout.
3. Choisissez créer une Channel.
4. Entrez un nom reconnaissable et un mot de passe de 8 à 128 caractères.
5. Enregistrez l'ID de Channel et le mot de passe générés.

### Abonnez-vous à un Channel existant

1. Ouvrez le client.
2. Choisissez la Channel d'abonnement.
3. Entrez l'ID de la Channel et le mot de passe.
4. Après l'abonnement, l'appareil recevra le contenu de cette Channel.

## 3. Choisissez un Gateway public

Les Gateways publics sont utiles pour tester sans déployer de serveur.

| Région | Gateway |
| :--- | :--- |
| Mondial | `https://gateway.pushgo.dev` |
| Chine continentale | `https://gateway.pushgo.cn` |

Choisissez la région la plus proche de vous et de vos appareils de réception. Si vous vous auto-hébergez, remplacez l'exemple d'URL par votre propre URL Gateway. Si votre Gateway utilise `PUSHGO_TOKEN`, ajoutez `Authorization: Bearer <token>`.

## 4. Envoyez le premier Message

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Hello from PushGo",
    "body": "This is a test notification.",
    "severity": "normal"
  }'
```

Une réponse réussie ressemble à :

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "message_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` signifie que le Gateway a accepté la requête. `accepted=true` signifie qu'il est entrée dans le chemin de distribution ; L'affichage final de la notification dépend toujours de l'état de l'appareil, des services push de la plateforme et de l'état du transport privé.

## Problèmes courants

| Symptôme | Vérifier |
| :--- | :--- |
| Réponse `400` | Validité JSON, noms de champs et `title`, `channel_id`, `password` requis. |
| Réponse `401` | Privés Gateway `PUSHGO_TOKEN` et `Authorization: Bearer <token>`. |
| Réponse `404` | ID Channel et si l'appareil a créé ou s'est abonné à la Channel. |
| `success=true` mais aucune notification | Autorisation de notification de l'appareil, état du réseau, transport privé Android, livraison APNs/FCM. |
| Charge utile trop importante | La taille maximale du corps du JSON est de 32 Ko ; utilisez des URL d’images au lieu d’intégrer des données binaires. |

Voir [Limites et erreurs](/fr/reference/limits-errors/) pour plus de codes d'état.

## Prochaines étapes

- Pour comprendre pourquoi le PushGo propose trois modèles, lisez [Concepts de base](/fr/guides/concepts/).
- Pour choisir Message, Event ou Thing, lisez [Modèles de données](/fr/guides/data-models/).
- Pour intégrer de vrais scripts, lisez [Use Cases](/fr/guides/use-cases/).
- Pour exécuter votre propre Gateway, lisez [Auto-hébergement](/fr/guides/self-hosting/).
