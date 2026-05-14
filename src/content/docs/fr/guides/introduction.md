---
title: Introduction
description: Qu'est-ce que PushGo, à qui s'adresse-t-il et par où commencer.
---
**PushGo** est un système open source de notification et de synchronisation d'état pour les workflows d'automatisation personnelle, de surveillance des serveurs/NAS, de DevOps, de l'IoT et des assistants IA. Il se compose de clients, d'API Gateway et HTTP. Vous pouvez utiliser le Gateway public directement ou déployer le vôtre.

## Ce que le PushGo résout

De nombreux outils de notification envoient uniquement du texte à un téléphone. Cela suffit pour des alertes simples, mais cela devient compliqué lorsque vous avez besoin de la progression des tâches, des cycles de vie des incidents, de l'état de l'appareil ou des actions de l'assistant IA.

PushGo sépare les données en trois modèles :

| Modèle | Objectif | Exemples |
| :--- | :--- | :--- |
| Message | Alerte ponctuelle | Sauvegarde terminée, disque presque plein, prix baissé |
| Event | Processus pouvant être mis à jour et clôturé | Déploiement, gestion des incidents, porte ouverte à fermée |
| Thing | État d'entité persistant | NAS, capteur, salle, service réseau |

Le résultat est que les alertes, les processus et l’état ne sont plus regroupés dans le même champ de texte. Les clients et l’automatisation peuvent raisonner de manière plus fiable.

## Composants du système

```text
Script / Service / AI assistant
        |
        v
PushGo Gateway
        |
        +-- APNs -> Apple clients
        +-- FCM  -> Android clients
        +-- Private transport -> Android low-latency sync
```

Le Gateway gère l'authentification, l'acceptation des API, le stockage d'état et la répartition. Les clients reçoivent, affichent, décryptent et gèrent les abonnements aux Channels.

## À qui s'adresse-t-il

- Utilisateurs personnels : scripts, webhooks, moniteurs de prix et tâches de longue durée.
- Utilisateurs de serveurs domestiques et de NAS : surveillance des disques, des sauvegardes, de l'onduleur et de l'état des services.
- Utilisateurs DevOps : déploiements, builds, incidents et santé du service.
- Utilisateurs IoT / Home Assistant : pièces, capteurs et événements de sécurité.
- Auto-hébergeurs : contrôlez les données, l'authentification, les transports privés et les MCP/OAuth sur votre propre Gateway.

## Par où commencer

| Objectif | Lire |
| :--- | :--- |
| Recevez votre première notification | [Mise en route](/fr/guides/getting-started/) |
| Comprendre le fonctionnement du système | [Concepts de base](/fr/guides/concepts/) |
| Choisissez le bon modèle de données | [Modèles de données](/fr/guides/data-models/) |
| Voir les modèles d'intégration réels | [Cas d'utilisation](/fr/guides/use-cases/) |
| Migrer depuis ntfy, Bark ou ServerChan | [Guide de migration](/fr/guides/migration/) |
| Déployez votre propre Gateway | [Auto-hébergement](/fr/guides/self-hosting/) |
| Intégrer des assistants IA | [Référence MCP](/fr/reference/mcp/) |

Si vous n'avez pas encore de Channel, commencez par Mise en route. Si vous avez déjà un script à intégrer, lisez Modèles de données et API Message.