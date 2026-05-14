---
title: Prise en charge des applications et des plates-formes
description: Comprenez les clients PushGo publiés, la configuration système requise et les chemins de livraison de la plateforme.
---
PushGo publie actuellement des clients de plateforme Apple, un client Android et le Gateway. Ce site Web décrit uniquement les versions accessibles au public.

## Présentation de la plateforme

| Plateforme | Télécharger | Exigence | Voie de livraison principale | Transport privé |
| :--- | :--- | :--- | :--- | :--- |
| iOS | App Store | iOS 18+ | APNs | Non |
| macOS | App Store | macOS 15+ | APNs | Non |
| watchOS | App Store | watchOS 11+ | APNs | Non |
| Android | GitHub Releases | Android 12+ | FCM + transports privés | Oui, QUIC / Raw TCP / WSS |

## Clients Apple

Les clients Apple suivent le modèle push du système. APNs gère la livraison en arrière-plan.

Cas adaptés :

- Recevoir des notifications personnelles sur iPhone, Mac et Apple Watch.
- Utilisation des priorités de notification du système et des extensions de notification pour un contenu riche.
- Garder le comportement du client proche du système d'exploitation au lieu de maintenir une connexion en arrière-plan de longue durée.

Remarques :

- Les clients Apple n'utilisent pas les transports privés Android PushGo.
- La diffusion en arrière-plan dépend du APNs, des autorisations de notification, des modes Focus et de l'état du réseau de l'appareil.
- Les champs E2EE sont déchiffrés localement après la configuration d'une clé ; si aucune clé n'est configurée ou si le déchiffrement échoue, les clients conservent l'état d'affichage de secours.

## Client Android

Le client Android prend en charge à la fois la livraison par le fournisseur et les transports privés PushGo.

Cas adaptés :

- Synchronisation d'état à faible latence.
- Déploiements Gateway auto-hébergés où les appareils se connectent à votre propre point d'entrée de synchronisation.
- Réveil FCM combiné avec un transport privé lorsqu'une synchronisation active est nécessaire.

Les transports privés sont sélectionnés à partir du profil Gateway et des conditions actuelles du réseau.

| Transports | Cas d'utilisation |
| :--- | :--- |
| WSS | Le plus universel ; réutilise HTTPS et constitue le meilleur transport privé par défaut. |
| QUIC | Latence réduite lorsque les ports UDP peuvent être exposés. |
| Raw TCP | Réseaux contrôlés ou points d'entrée dédiés de couche 4. |

Les transports privés nécessitent le Gateway pour activer le transport correspondant et annoncer les ports accessibles, les certificats et l'URL de base publique. Voir [Auto-hébergement](/fr/guides/self-hosting/).

## Gateway

Le Gateway est le composant serveur du PushGo. Il :

- Valide les mots de passe des canaux et les jetons de Gateway Bearer en option.
- Accepte les requêtes Message, Event et Thing.
- Maintient l'état des événements et des entités.
- Distributions via les transports privés APNs, FCM ou Android.
- Peut activer MCP/OAuth pour les assistants IA agissant dans les limites des canaux autorisés.

Vous pouvez utiliser le Gateway public ou auto-hébergé pour contrôler les chemins de données, la politique d'authentification et les opérations.

## Matrice de capacités

| Capacité | Pomme | Android | Gateway |
| :--- | :--- | :--- | :--- |
| Recevez Message | Oui | Oui | Dépêches |
| Écran Event / Thing | Oui | Oui | État des magasins et des distributions |
| Décryptage du champ E2EE | Oui | Oui | Relais texte chiffré uniquement |
| Transport privé | Non | Oui | Nécessite un point d'entrée privé activé |
| MCP/OAuth | N/A | N/A | Facultatif |

Si vous souhaitez uniquement recevoir des notifications, installez un client et suivez [Getting Started](/fr/guides/getting-started/). Si vous avez besoin d'un contrôle du chemin de données et de transports privés, continuez avec l'auto-hébergement.