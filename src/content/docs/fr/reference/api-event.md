---
title: API d'événement
description: Utilisez /event/create, /event/update et /event/close pour modéliser les cycles de vie pouvant être mis à jour.
---
L'API Event représente un processus qui évolue au fil du temps et qui finit par se terminer. La création d'un événement renvoie un `event_id`  ; les mises à jour et les appels de clôture utilisent cet identifiant pour rester attachés au même cycle de vie.

## Points de terminaison

```http
POST /event/create
POST /event/update
POST /event/close
```

Le corps de la requête doit être JSON et les champs inconnus sont rejetés. Si un Gateway privé active `PUSHGO_TOKEN`, incluez `Authorization: Bearer <token>`.

## En-têtes

| En-tête | Obligatoire | Descriptif |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Oui | Format du corps de la requête. |
| `Authorization: Bearer <token>` | Dépendant du Gateway | Requis uniquement lorsqu'un Gateway privé active `PUSHGO_TOKEN`. |

## Cycle de vie

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   marks the event as ended
```

## Champs communs

| Champ | Tapez | Obligatoire | Descriptif |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Oui | ID du Channel cible. |
| `password` | `string` | Oui | Mot de passe Channel, généralement de 8 à 128 caractères. |
| `op_id` | `string` | Non | Clé d'idempotence ; généré et renvoyé en cas d'omission. |
| `thing_id` | `string` | Non | Associez cette répartition d'événement à un Thing existant. |
| `ciphertext` | `string` | Non | Charge utile de texte chiffré E2EE en option. |

## Champs obligatoires par itinéraire

| Itinéraire | Champs professionnels obligatoires |
| :--- | :--- |
| `/event/create` | `title`, `status`, `message`, `severity`, `event_time` |
| `/event/update` | `event_id`, `status`, `message`, `severity`, `event_time` |
| `/event/close` | `event_id`, `status`, `message`, `severity`, `event_time` |

## Règles de champ

| Champ | Tapez | Règles |
| :--- | :--- | :--- |
| `event_id` | `string` | Obligatoire pour la mise à jour et la fermeture ; ne doit pas être envoyé lors de la création. |
| `title` | `string` | Obligatoire lors de la création ; facultatif lors de la mise à jour et de la fermeture. |
| `description` | `string` | Facultatif ; les chaînes vides sont traitées comme manquantes. |
| `status` | `string` | Requis; non vide, maximum 24 caractères. |
| `message` | `string` | Requis; non vide, maximum 512 caractères. |
| `severity` | `string` | Requis; uniquement `critical`, `high`, `normal`, `low`. |
| `event_time` | `number` | Requis; lorsque cette mise à jour s'est produite, en millisecondes Unix. |
| `started_at` | `number` | Créer uniquement ; heure globale de début de l’événement. |
| `ended_at` | `number` | Fermer uniquement ; heure globale de fin de l’événement. |
| `tags` | `string[]` | Jusqu'à 32 éléments, 64 caractères maximum chacun, découpés et dédupliqués. |
| `images` | `string[]` | Jusqu'à 32 URL d'images, de 2 048 caractères maximum chacune. |
| `attrs` | `object` | Correctif d'objet ; `null` supprime une clé  ; les tableaux ne sont pas autorisés. |
| `metadata` | `object` | Valeurs scalaires uniquement ; clé <= 64, valeur <= 512. |

## Créer un Event

```bash
curl -X POST https://gateway.pushgo.dev/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Production deployment",
    "status": "running",
    "message": "Deployment started",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000,
    "attrs": {
      "service": "api",
      "revision": "8f3c2a1"
    }
  }'
```

Réponse :

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "op-20260422-001",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

Enregistrez le `event_id` renvoyé  ; les appels de mise à jour et de clôture en ont besoin.

## Mettre à jour un Event

```bash
curl -X POST https://gateway.pushgo.dev/event/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "publishing",
    "message": "Image pushed, publishing release",
    "severity": "normal",
    "event_time": 1713750300000,
    "attrs": {
      "progress": 0.75
    }
  }'
```

`/event/update` peut être appelé plusieurs fois. Chaque mise à jour doit décrire le changement actuel et non répéter tout l'historique.

## Fermer un Event

```bash
curl -X POST https://gateway.pushgo.dev/event/close \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "event_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "status": "success",
    "message": "Production deployment completed",
    "severity": "normal",
    "event_time": 1713750600000,
    "ended_at": 1713750600000,
    "attrs": {
      "progress": 1
    }
  }'
```

En cas d'échec, utilisez `status=failed` et augmentez `severity` le cas échéant.

## Associer à un Thing

Si l'événement se produit sur une entité persistante, incluez `thing_id`.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "thing_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
  "title": "Database lag",
  "status": "open",
  "message": "Replica lag exceeded 30 seconds",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000
}
```

Thing identifie l'objet ; Event décrit le processus qui lui arrive.

## Sémantique de réponse

Les API Event utilisent l'enveloppe de réponse partagée. `accepted=true` signifie que le Gateway est entré dans la répartition, et non que chaque appareil a affiché une notification système.

## Erreurs courantes

| Statut | Raison typique |
| :--- | :--- |
| `400` | Champ requis pour l'itinéraire manquant, champ inconnu, `severity` non valide, `attrs` non valide. |
| `401` | Jeton privé Gateway Bearer manquant ou erroné. |
| `404` | Channel ou `event_id` n'existe pas. |
| `413` | Le corps de la requête dépasse 32 Ko. |
| `503` | L'distribution n'a pas pleinement réussi. |