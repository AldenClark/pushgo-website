---
title: Limites et erreurs
description: Limites du Gateway PushGo partagée, enveloppe de réponse, codes d'état et points d'entrée de dépannage.
---
Cette page résume les règles partagées entre les API. Les champs obligatoires, le comportement du cycle de vie et la sémantique spécifique au modèle appartiennent toujours à chaque page API.

## Limites partagées

| Article | Limite |
| :--- | :--- |
| Demander la taille du corps | 32 Ko maximum. |
| ID générés par le Gateway | 32 caractères hexadécimaux minuscules. |
| Mot de passe Channel | Généralement 8 à 128 caractères. |
| `op_id` | 1 à 128 caractères ; lettres, chiffres, `_`, `:`, `-`. |
| `thing_id` / `event_id` | 1 à 64 caractères ; lettres, chiffres, `_`, `:`, `-`. |
| `images` | Jusqu'à 32 URL, de 2 048 caractères maximum chacune. |
| `tags` | Jusqu'à 32 balises, de 64 caractères maximum chacune, découpées et dédupliquées. |
| `metadata` | Valeurs scalaires uniquement ; clé max 64, valeur scalaire non vide max 512 ; objets imbriqués et tableaux interdits. |
| `attrs` | Patch objet ; `null` supprime une clé ; tableaux et imbrication profonde sont rejetés. |
| `ttl` et horodatages API | Lorsque documenté, les secondes ou millisecondes Unix sont acceptées et normalisées en millisecondes. |
| Champs inconnus | Les arguments des outils natifs Message, Event, Thing et MCP sont stricts  ; les champs inconnus renvoient 400. |

## Enveloppe de réponse

Succès :

```json
{
  "success": true,
  "data": {
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

Échec :

```json
{
  "success": false,
  "data": null,
  "error": "human readable message",
  "error_code": "machine_readable_code"
}
```

L'automatisation devrait préférer `success` et `error_code` au texte `error` en langage naturel.

## Signification de `accepted`

`success=true` signifie que le Gateway a traité la requête. `accepted=true` signifie qu'il est entré dans l'distribution.

Il ne garantit pas :

- Chaque appareil est en ligne.
- APNs ou FCM a affiché une notification.
- Transport privé Android livré en temps réel.
- L'utilisateur n'est pas affecté par les autorisations de notification, le mode Focus ou la politique de batterie.

Traitez le `accepted` comme le statut d'acceptation et d'distribution du Gateway, et non comme un reçu d'affichage du périphérique final.

## Codes d'état courants HTTP

| Statut | Signification | Raison typique | Que faire |
| :--- | :--- | :--- | :--- |
| `200` | Gateway a traité la requête | `success=true`, mais vérifiez toujours `accepted` | Stockez les identifiants renvoyés et `op_id`. |
| `400` | Échec de la validation | Champ obligatoire manquant, champ inconnu, mauvais format | Comparez le JSON avec la table de champs API. |
| `401` | L'authentification Gateway a échoué | Le privé Gateway utilise `PUSHGO_TOKEN` ; Jeton Bearer manquant ou erroné | Vérifiez `Authorization: Bearer <token>`. |
| `404` | Cible manquante | Le Channel, l’Event ou le Thing n’existe pas | Vérifiez `channel_id`, `event_id`, `thing_id`. |
| `413` | Corps de la requête trop grand | JSON dépasse 32 Ko | Utilisez des URL d'images ; réduire les métadonnées ou les attributs. |
| `503` | Distribution non entièrement acceptée | Fournisseur, transport privé, file d'attente ou aval indisponible | Inspectez les journaux, les statistiques et la capacité de la file d'attente du Gateway. |

## Dépannage par scénario

### La requête renvoie 400

- JSON doit être valide.
- N'envoyez pas `event_id` à `/event/create` ou `thing_id` à `/thing/create`.
- Supprimez les champs inconnus.
- `severity` doit être `critical`, `high`, `normal` ou `low`.
- `attrs` doit être un patch d'objet, et non un tableau ou une structure profondément imbriquée.

### La requête renvoie 401

- Vérifiez si le Gateway privé a `PUSHGO_TOKEN`.
- L'en-tête doit être `Authorization: Bearer <token>`.
- Ne confondez pas le mot de passe Channel avec le jeton Gateway.
- Assurez-vous que le proxy inverse ne supprime pas les en-têtes d'autorisation.

### La requête réussit mais l'appareil ne notifie pas

- Le client doit être abonné au Channel.
- L'autorisation de notification de l'appareil doit être activée.
- La livraison Apple peut être affectée par le APNs, les modes de mise au point et les paramètres système.
- Les clients Android doivent pouvoir récupérer le bon `/gateway/profile`.
- Les ports de transport privés, les certificats et les adresses externes doivent être accessibles.
- Les journaux Gateway peuvent afficher des erreurs de fournisseur ou de répartition privée.

### Transport privé indisponible

- `PUSHGO_PRIVATE_TRANSPORTS` doit être activé.
- WSS doit être accessible via le domaine HTTPS.
- Le port UDP QUIC peut être bloqué par un pare-feu ou un proxy.
- Raw TCP doit gérer correctement le déchargement TLS ou TLS.
- Les ports annoncés et les ports de liaison réels peuvent différer derrière le NAT ou le mappage des ports.

### Échec de la liaison MCP

- `PUSHGO_MCP_ENABLED` doit être activé.
- `PUSHGO_PUBLIC_BASE_URL` doit être une URL HTTPS externe.
- Le proxy inverse doit transmettre `/.well-known/*`, `/oauth/*` et `/mcp`.
- Le DCR doit correspondre aux capacités du client.
- Les sessions de page de liaison peuvent expirer.

## Pages connexes

- [Authentification](/fr/reference/auth/)
- [API Message](/fr/reference/api-message/)
- [API Event](/fr/reference/api-event/)
- [API Thing](/fr/reference/api-thing/)
- [Auto-hébergement](/fr/guides/self-hosting/)