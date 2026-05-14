---
title: API de messages
description: Envoyez des notifications ponctuelles avec /message et comprenez les champs, les réponses et la sémantique de répartition.
---
L'API Message envoie des notifications transitoires de niveau supérieur. Utilisez-le pour les alertes, les messages d'achèvement, les instantanés d'images, les notifications de prix et tout autre contenu qui ne nécessite pas de mises à jour ou de fermeture ultérieures.

## Point de terminaison

```http
POST /message
```

Le corps de la requête doit être JSON et les champs inconnus sont rejetés. Si un Gateway privé active `PUSHGO_TOKEN`, incluez `Authorization: Bearer <token>`.

## En-têtes

| En-tête | Obligatoire | Descriptif |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Oui | Format du corps de la requête. |
| `Authorization: Bearer <token>` | Dépendant du Gateway | Requis uniquement lorsqu'un Gateway privé active `PUSHGO_TOKEN`. |

## Champs de requête

| Champ | Tapez | Obligatoire | Descriptif |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Oui | ID du Channel cible. |
| `password` | `string` | Oui | Mot de passe Channel, généralement de 8 à 128 caractères. |
| `title` | `string` | Oui | Titre Message, ne doit pas être vide. |
| `body` | `string` | Non | Corps Message, Markdown est pris en charge. |
| `op_id` | `string` | Non | Clé d'idempotence, 1 à 128 caractères, lettres/chiffres/`_`/`:`/`-`. |
| `thing_id` | `string` | Non | Associez le message à un Thing existant. |
| `occurred_at` | `number` | Non | Heure à laquelle le message s'est produit, en millisecondes Unix. |
| `severity` | `string` | Non | `critical`, `high`, `normal`, `low`  ; les valeurs inconnues se normalisent en `normal`. |
| `ttl` | `number` | Non | Délai d'expiration Unix en millisecondes ; La durée de vie du fournisseur est plafonnée à environ 28 jours. |
| `url` | `string` | Non | URL de destination facultative. |
| `images` | `string[]` | Non | Jusqu'à 32 URL d'images, de 2 048 caractères maximum chacune. |
| `tags` | `string[]` | Non | Jusqu'à 32 balises, 64 caractères maximum chacune, découpées et dédupliquées. |
| `ciphertext` | `string` | Non | Charge utile de texte chiffré E2EE en option. |
| `metadata` | `object` | Non | Valeurs-clés scalaires personnalisées ; clé <= 64, valeur <= 512. |

## Cartographie de la gravité

| `severity` | Niveau d'interruption APNs | Priorité FCM |
| :--- | :--- | :--- |
| `critical` | `critical` | `HIGH` |
| `high` | `time-sensitive` | `HIGH` |
| `normal` | `active` | `HIGH` |
| `low` | `passive` | `NORMAL` |

## Exemple minimal

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Backup completed",
    "body": "The daily NAS backup has finished.",
    "severity": "normal"
  }'
```

## Associer à un Thing

Si l'alerte appartient à une entité persistante, transmettez `thing_id`.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
  "title": "Home NAS disk warning",
  "body": "volume1 usage has reached 92%.",
  "severity": "high",
  "tags": ["nas", "disk"]
}
```

## Réponse réussie

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "message_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` signifie que le Gateway a traité la requête. `accepted=true` signifie la requête est entrée dans le chemin de distribution ; L'affichage final dépend toujours des services push de la plateforme, de l'état de l'appareil et des transports privés.

## Erreurs courantes

| Statut | Raison typique |
| :--- | :--- |
| `400` | Champ obligatoire manquant, champ inconnu, `title` vide, `op_id` non valide. |
| `401` | Le privé Gateway nécessite un jeton Bearer, mais l'en-tête est manquant ou erroné. |
| `404` | Channel n’existe pas ou les informations d’identification ne correspondent pas. |
| `413` | Le corps de la requête dépasse 32 Ko. |
| `503` | Gateway n'a pas pu entrer complètement dans le chemin de distribution ; la réponse peut inclure `accepted=false`. |

Voir [Limites et erreurs](/fr/reference/limits-errors/) pour les limites partagées.

## Points de terminaison de compatibilité

PushGo fournit également des points de terminaison de compatibilité ntfy, Bark et ServerChan pour la migration. Leur couverture de terrain est limitée ; utilisez `/message` natif lorsque vous avez besoin de la sémantique `thing_id`, E2EE ou PushGo complète. Voir le [Guide de migration](/fr/guides/migration/).