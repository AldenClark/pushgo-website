---
title: Concepts de base
description: Comprendre Channel, Gateway, les clients et les trois modèles de données de PushGo.
---
PushGo peut être vu comme un chemin de synchronisation entre vos scripts, services ou appareils et les clients abonnés à un Channel. Il ne transforme pas seulement du texte en notification système : il conserve aussi les cycles de vie d’Event et les états de Thing afin que l’historique, le filtrage et l’automatisation restent structurés.

## Modèle mental

```text
Sender -> Gateway -> Channel -> Subscribed devices
                  |
                  +-> Message / Event / Thing
```

- **Sender** : script, serveur, Home Assistant, pipeline CI/CD ou assistant IA.
- **Gateway** : valide les requêtes, stocke l’état, choisit les routes de livraison et distribue les données.
- **Channel** : espace de communication auquel un ou plusieurs appareils sont abonnés. Chaque requête doit fournir `channel_id` et `password`.
- **Client** : les clients Apple reçoivent les notifications via APNs ; les clients Android peuvent combiner FCM et transports privés.
- **Modèle de données** : PushGo sépare les alertes ponctuelles, les processus avec cycle de vie et les états persistants dans des objets distincts.

## Channel : limite d’autorisation et d’abonnement

Un Channel est la limite de base de PushGo. Plusieurs appareils peuvent s’abonner au même Channel, et plusieurs expéditeurs peuvent y écrire s’ils disposent des identifiants.

| Concept | Rôle |
| :--- | :--- |
| `channel_id` | Identifie le Channel cible de la requête. |
| `password` | Autorise l’écriture dans ce Channel. |
| Appareils abonnés | Reçoivent le contenu accepté pour le Channel. |

Le mot de passe Channel n’est pas un mot de passe d’administration du Gateway. Les Gateways publics comme privés utilisent toujours l’autorisation au niveau du Channel ; un Gateway privé peut ajouter un token Bearer au niveau Gateway.

## Gateway : acceptation, état et livraison

Quand le Gateway reçoit une requête :

1. Il valide le format, les identifiants du Channel et, le cas échéant, le token Bearer du Gateway.
2. Il crée ou met à jour l’état de Message, Event ou Thing.
3. Il livre le contenu aux appareils abonnés via APNs, FCM ou les transports privés Android.

La réponse HTTP indique si le Gateway a accepté la requête. La notification système est ensuite livrée de manière asynchrone : `accepted` signifie que la requête est entrée dans le chemin de distribution, pas que chaque appareil l’a déjà affichée.

## Trois modèles de données

Le principe central de PushGo n’est pas d’ajouter toujours plus de champs de notification, mais d’utiliser un modèle adapté à chaque type d’objet.

| Modèle | Représente | Exemples | API principale |
| :--- | :--- | :--- | :--- |
| Message | Alerte ponctuelle | Disque presque plein, sauvegarde terminée, prix en baisse | `POST /message` |
| Event | Processus avec mises à jour et clôture | Déploiement, incident, porte ouverte puis fermée | `/event/create`, `/event/update`, `/event/close` |
| Thing | État persistant d’une entité | NAS, capteur, pièce, service réseau | `/thing/create`, `/thing/update`, `/thing/archive`, `/thing/delete` |

Avant de choisir, posez une question simple : voulez-vous prévenir une fois, suivre un processus ou synchroniser l’état courant d’un objet ?

## Chemins de livraison

PushGo n’impose pas à toutes les plateformes la même connexion d’arrière-plan.

| Plateforme | Chemin principal | Notes |
| :--- | :--- | :--- |
| Plateformes Apple | APNs | Livraison gérée par le système pour iOS, macOS et watchOS. |
| Android | FCM + transports privés | FCM peut réveiller l’appareil ; les transports privés réduisent la latence de synchronisation. |
| Gateway auto-hébergé | Dépend du déploiement | Peut activer WSS, QUIC et Raw TCP pour les transports privés Android. |

Voir [applications et plateformes](/fr/guides/apps/) pour connaître les capacités des clients.

## Couches de sécurité

| Couche | Protection apportée |
| :--- | :--- |
| Mot de passe Channel | Empêche les écritures non autorisées dans un Channel. |
| Token Bearer du Gateway | Limite les appelants d’une instance Gateway privée. |
| HTTPS/TLS | Protège les identifiants et les requêtes en transit. |
| E2EE `ciphertext` | Permet aux clients de déchiffrer localement les champs sensibles pendant que le Gateway relaie seulement le texte chiffré. |
| MCP OAuth | Permet à des assistants IA d’agir dans le périmètre de Channels autorisés sans posséder directement leurs mots de passe. |

Si vous voulez seulement envoyer une première notification de test, commencez par Channel et Message. Les guides sur les modèles de données, l’authentification et l’auto-hébergement deviennent utiles lorsque vous avez besoin d’un état durable ou de votre propre Gateway.
