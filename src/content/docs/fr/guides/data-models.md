---
title: Modèles de données
description: Décidez quand utiliser Message, Événement ou Objet et comprenez les limites de leurs champs.
---
Les trois modèles de données de PushGo comportent des sémantiques métier différentes. Choisir le bon modèle facilite le raisonnement sur la présentation du client, l'historique, la fusion d'états et l'automatisation.

## Matrice de décision

| Ce que vous devez exprimer | Utiliser | Pourquoi |
| :--- | :--- | :--- |
| "Quelque chose s'est passé ; prévenez-moi une fois" | Message | Aucun état persistant ; chaque message est autonome. |
| "Quelque chose a commencé, change avec le temps et finit par se terminer" | Event | Un `event_id` peut être mis à jour plusieurs fois puis fermé. |
| "Cet appareil, service, salle ou tâche a un état actuel" | Thing | Un `thing_id` peut être mis à jour au fil du temps. |
| "Une alerte s'est produite sur une entité spécifique" | Thing + Message | Thing identifie l'entité ; Message enregistre l'alerte. |
| "Une entité spécifique traverse un processus" | Thing + Event | Thing identifie l'objet ; Event enregistre le cycle de vie. |

## Message : Alerte ponctuelle

Message est le modèle de notification le plus simple. Utilisez-le pour le contenu qui n’a pas besoin d’être fusionné ou fermé ultérieurement.

### Cas adaptés

- L'utilisation du disque a dépassé un seuil.
- Sauvegarde terminée.
- Le prix a baissé.
- Une caméra a détecté un mouvement et inclut un instantané.

### Mauvais ajustements

- Le cycle de vie de création, de publication et de fin d'un déploiement.
- Le dernier état d'un serveur, d'un capteur ou d'une salle.
- Une valeur du tableau de bord qui doit être écrasée au fil du temps.

### Groupes de champs

| Groupe | Champs |
| :--- | :--- |
| Authentification et routage | `channel_id`, `password`, `op_id`, `thing_id` |
| Affichage | `title`, `body`, `severity`, `url`, `images`, `tags` |
| Temps et sécurité | `occurred_at`, `ttl`, `ciphertext` |
| Rallonges | `metadata` |

### Exemple minimal

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Backup completed",
  "body": "The daily NAS backup has finished.",
  "severity": "normal"
}
```

## Event : cycle de vie pouvant être mis à jour

Event représente un processus. Sa création renvoie un `event_id`  ; les mises à jour ultérieures et le dernier appel rapproché utilisent cet identifiant.

### Cas adaptés

- Déploiement CI/CD : démarré, build, publié, réussi ou échoué.
- Gestion des incidents : détectés, investigués, récupérés.
- Etat porte/fenêtre : ouverte puis fermée.
- Tâches de longue durée : transcodage, synchronisation, formation de modèles.

### Cycle de vie

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   ends the event
```

### Groupes de champs

| Groupe | Champs |
| :--- | :--- |
| Authentification et routage | `channel_id`, `password`, `op_id`, `thing_id` |
| Cycle de vie | `event_id`, `event_time`, `started_at`, `ended_at` |
| Affichage | `title`, `description`, `status`, `message`, `severity`, `tags`, `images` |
| Rallonges | `attrs`, `metadata`, `ciphertext` |

### Conseils de modélisation

- Utilisez des valeurs `status` courtes telles que `running`, `degraded`, `success` ou `failed`.
- Utilisez `message` pour la mise à jour actuelle, telle que "image poussée".
- `event_time` est le moment où cette mise à jour a eu lieu.
- `started_at` est l'heure globale de début de l'événement et appartient à la création.
- `ended_at` est l'heure de fin globale de l'événement et appartient à la clôture.

## Thing : État d'entité persistant

Thing représente un objet à longue durée de vie. Sa valeur vient de la mise à jour du même objet au lieu de créer des notifications sans rapport.

### Cas adaptés

- NAS domestique, serveur ou service réseau.
- Pièce, capteur, caméra ou serrure.
- Actif ou tâche de longue durée.
- Tout ce qui devrait montrer l'état actuel.

### Cycle de vie

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

### Groupes de champs

| Groupe | Champs |
| :--- | :--- |
| Authentification et routage | `channel_id`, `password`, `op_id` |
| Identité et affichage | `thing_id`, `title`, `description`, `tags`, `primary_image`, `images` |
| Temps | `created_at`, `observed_at`, `deleted_at` |
| Systèmes externes | `external_ids`, `location_type`, `location_value` |
| État | `attrs`, `metadata`, `ciphertext` |

### Conseils de modélisation

- Utilisez `title` pour le nom lisible par l'homme, tel que « Home NAS ».
- Utilisez `attrs` pour modifier des valeurs telles que le processeur, la température ou l'état en ligne.
- Utilisez `metadata` pour les données auxiliaires qui ne sont généralement pas affichées.
- Utilisez `external_ids` pour vous connecter aux identifiants de systèmes tels que Home Assistant.

## Combinaison de modèles

| Combinaison | Modèle |
| :--- | :--- |
| Thing + Message | Une alerte « disque presque plein » s'est produite sur l'entité « Home NAS ». |
| Thing + Event | L'entité « base de données de production » rencontre un événement de décalage de réplication. |
| Event + Message | Event enregistre le cycle de vie ; Le Message envoie une alerte forte à un point critique. |

En cas de doute, commencez par Message. Lorsqu'un script envoie à plusieurs reprises « démarré/mis à jour/terminé » ou « valeur actuelle modifiée », effectuez une mise à niveau vers Event ou Thing.