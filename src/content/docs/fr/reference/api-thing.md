---
title: API d'objet
description: Utilisez /thing/create, /thing/update, /thing/archive et /thing/delete pour gérer l'état de l'entité persistante.
---
L'API Thing représente des objets de longue durée qui changent au fil du temps, tels que des serveurs, des salles, des capteurs, des services réseau ou des tâches de longue durée. La création d'un Thing renvoie un `thing_id`  ; les appels de mise à jour, d’archivage et de suppression utilisent cet identifiant.

## Points de terminaison

```http
POST /thing/create
POST /thing/update
POST /thing/archive
POST /thing/delete
```

Le corps de la requête doit être JSON et les champs inconnus sont rejetés. Si un Gateway privé active `PUSHGO_TOKEN`, incluez `Authorization: Bearer <token>`.

## En-têtes

| En-tête | Obligatoire | Descriptif |
| :--- | :--- | :--- |
| `Content-Type: application/json` | Oui | Format du corps de la requête. |
| `Authorization: Bearer <token>` | Dépendant du Gateway | Requis uniquement lorsqu'un Gateway privé active `PUSHGO_TOKEN`. |

## Cycle de vie

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

## Champs communs

| Champ | Tapez | Obligatoire | Descriptif |
| :--- | :--- | :--- | :--- |
| `channel_id` | `string` | Oui | ID du Channel cible. |
| `password` | `string` | Oui | Mot de passe Channel, généralement de 8 à 128 caractères. |
| `op_id` | `string` | Non | Clé d'idempotence ; généré et renvoyé en cas d'omission. |
| `ciphertext` | `string` | Non | Charge utile de texte chiffré E2EE en option. |

## Champs obligatoires par itinéraire

| Itinéraire | Champs professionnels obligatoires |
| :--- | :--- |
| `/thing/create` | `observed_at` |
| `/thing/update` | `thing_id`, `observed_at` |
| `/thing/archive` | `thing_id`, `observed_at` |
| `/thing/delete` | `thing_id`, `observed_at` |

## Règles de champ

| Champ | Tapez | Règles |
| :--- | :--- | :--- |
| `thing_id` | `string` | Requis pour la mise à jour, l'archivage et la suppression ; ne doit pas être envoyé lors de la création. |
| `title` | `string` | Recommandé lors de la création ; le Gateway ne rejette actuellement pas le `title` manquant. |
| `description` | `string` | Facultatif ; les chaînes vides sont traitées comme manquantes. |
| `tags` | `string[]` | Jusqu'à 32 éléments, 64 caractères maximum chacun, découpés et dédupliqués. |
| `primary_image` | `string` | URL facultative, 2 048 caractères maximum. |
| `images` | `string[]` | Jusqu'à 32 URL d'images, de 2 048 caractères maximum chacune. |
| `created_at` | `number` | Créer uniquement ; revient à `observed_at` en cas d'omission. |
| `deleted_at` | `number` | Supprimer uniquement ; revient à `observed_at` en cas d'omission. |
| `observed_at` | `number` | Requis; temps d'observation pour cette mise à jour d'état, millisecondes Unix. |
| `external_ids` | `object` | modèle de clé `[A-Za-z0-9_:.\-]`, clé <= 64 ; la valeur est `string` ou `null`. |
| `location_type` + `location_value` | `string` + `string` | Doit apparaître ensemble ; le type est `physical`, `geo`, `cloud`, `datacenter` ou `logical`. |
| `attrs` | `object` | Correctif d'objet ; `null` supprime une clé  ; les tableaux ne sont pas autorisés ; un seul niveau d'objet imbriqué. |
| `metadata` | `object` | Valeurs scalaires uniquement ; clé <= 64, valeur <= 512. |

## Créer un Thing

```bash
curl -X POST https://gateway.pushgo.dev/thing/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Home NAS",
    "description": "Primary storage in the living room rack",
    "observed_at": 1713750000000,
    "tags": ["nas", "home"],
    "location_type": "physical",
    "location_value": "home/living-room",
    "attrs": {
      "online": true,
      "disk_used": 0.72,
      "temperature": 43.2
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
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

Enregistrez le `thing_id` renvoyé ; la mise à jour, l'archivage et la suppression des appels en ont besoin.

## Mettre à jour un Thing

```bash
curl -X POST https://gateway.pushgo.dev/thing/update \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713750600000,
    "attrs": {
      "disk_used": 0.74,
      "temperature": 44.1
    }
  }'
```

`attrs` est un correctif. Vous n'avez pas besoin d'envoyer l'état complet à chaque fois. Pour supprimer une clé, transmettez `null`.

```json
{
  "attrs": {
    "temporary_alarm": null
  }
}
```

## Archiver un Thing

L'archive concerne les objets qui ne sont plus actifs mais qui doivent conserver l'historique.

```bash
curl -X POST https://gateway.pushgo.dev/thing/archive \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751200000,
    "attrs": {
      "online": false
    }
  }'
```

## Supprimer un Thing

Utilisez `/thing/delete` lorsqu'un objet est supprimé ou retiré.

```bash
curl -X POST https://gateway.pushgo.dev/thing/delete \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "thing_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "observed_at": 1713751800000,
    "deleted_at": 1713751800000
  }'
```

## Associer Message et Event

Thing représente un objet persistant. Les alertes associées peuvent utiliser Message avec `thing_id`  ; les processus associés peuvent utiliser Event avec `thing_id`.

| Scénario | Modèle |
| :--- | :--- |
| CPU NAS actuel, température, utilisation du disque | Thing |
| Un avertissement de disque sur le NAS | Message + `thing_id` |
| Sauvegarde NAS du début à la fin | Event + `thing_id` |

## Sémantique de réponse

Les API Thing utilisent l'enveloppe de réponse partagée. `accepted=true` signifie que le Gateway est entré dans la répartition, et non que chaque appareil a affiché une notification système.

## Erreurs courantes

| Statut | Raison typique |
| :--- | :--- |
| `400` | `observed_at` manquant, champ inconnu, `attrs` ou `external_ids` non valide. |
| `401` | Jeton privé Gateway Bearer manquant ou erroné. |
| `404` | Channel ou `thing_id` n'existe pas. |
| `413` | Le corps de la requête dépasse 32 Ko. |
| `503` | L'distribution n'a pas pleinement réussi. |