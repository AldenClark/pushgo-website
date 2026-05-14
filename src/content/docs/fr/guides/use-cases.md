---
title: Cas d'utilisation
description: Apprenez les messages, les événements et les objets grâce à des scénarios PushGo pratiques.
---
Cette page est un livre de recettes de modélisation, pas une liste de fonctionnalités. Chaque scénario explique quel modèle utiliser et pourquoi il est plus clair que d'envoyer des notifications en texte brut pour tout.

## Serveurs et NAS

### Alerte disque : Message

Lorsque l’utilisation du disque dépasse un seuil, une seule alerte forte suffit.

```bash
USAGE=$(df / | awk 'NR==2 { gsub("%", "", $5); print $5 }')

if [ "$USAGE" -ge 90 ]; then
  curl -X POST https://gateway.pushgo.dev/message \
    -H "Content-Type: application/json" \
    -d '{
      "channel_id": "YOUR_CHANNEL_ID",
      "password": "YOUR_CHANNEL_PASSWORD",
      "title": "Disk space warning",
      "body": "Root partition usage has reached '"$USAGE"'%.",
      "severity": "high",
      "tags": ["nas", "disk"]
    }'
fi
```

### Tâche de sauvegarde : Event

Une sauvegarde a un début, une progression et un résultat. Event conserve ces mises à jour sous un seul cycle de vie.

```bash
curl -X POST https://gateway.pushgo.dev/event/create \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "NAS backup",
    "status": "running",
    "message": "Backup started",
    "severity": "normal",
    "event_time": 1713750000000,
    "started_at": 1713750000000
  }'
```

Stockez le `event_id` renvoyé, puis appelez `/event/update` et `/event/close` pendant le téléchargement, la vérification, l'achèvement ou l'échec.

### Panneau d'état de l'hôte : Thing

Si vous souhaitez voir l'état actuel d'un serveur au fil du temps, modélisez l'hôte comme un Thing.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Home NAS",
  "observed_at": 1713750000000,
  "tags": ["nas", "home"],
  "attrs": {
    "online": true,
    "cpu": 0.18,
    "disk_used": 0.72,
    "temperature": 43.2
  }
}
```

## Home Assistant et l'IoT

### Pièce ou capteur : Thing

La température, l’humidité et la lumière sont des états persistants. Modélisez chaque pièce ou appareil comme un Thing et mettez à jour le `attrs`.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Living room",
  "observed_at": 1713750000000,
  "external_ids": {
    "home_assistant": "sensor.living_room_temperature"
  },
  "location_type": "physical",
  "location_value": "home/living-room",
  "attrs": {
    "temperature": 22.5,
    "humidity": 0.46
  }
}
```

### Porte ouverte à fermée : Event

Une porte ouverte est un processus qui se termine lorsque la porte se ferme.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Balcony door open",
  "status": "open",
  "message": "The balcony door has been open for more than 5 minutes.",
  "severity": "high",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "tags": ["home", "door"]
}
```

### Instantané de mouvement : Message

Une caméra de détection de mouvement avec un instantané est une Message.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Motion detected",
  "body": "Entry camera detected motion.",
  "severity": "high",
  "images": ["https://example.com/snapshot.jpg"],
  "tags": ["camera", "security"]
}
```

## DevOps et automatisation

### Pipeline de déploiement : Event

Les déploiements ont un état de cycle de vie. Créez dès le début, mettez à jour aux étapes principales et clôturez avec succès ou échec.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Production deployment",
  "status": "building",
  "message": "Building image",
  "severity": "normal",
  "event_time": 1713750000000,
  "started_at": 1713750000000,
  "attrs": {
    "service": "api",
    "revision": "8f3c2a1"
  }
}
```

En cas d'échec, augmentez `severity` en `critical` et fermez l'événement avec `status=failed`.

### État du service : Thing

L'état en ligne, la latence et la version correspondent à l'état actuel.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "API service",
  "observed_at": 1713750000000,
  "location_type": "cloud",
  "location_value": "prod",
  "attrs": {
    "healthy": true,
    "latency_ms": 83,
    "version": "1.8.4"
  }
}
```

### Alerte de panne : Message

Même si le Event enregistre le cycle de vie du déploiement, vous pouvez envoyer un Message au point de défaillance pour une meilleure visibilité mobile.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Production deployment failed",
  "body": "The api service deployment failed. Check the pipeline logs.",
  "severity": "critical",
  "tags": ["deploy", "prod"]
}
```

## Automatisation personnelle

### Moniteur de prix : Message

Un seuil de prix est généralement une alerte.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Price dropped",
  "body": "The tracked product is now 199.",
  "severity": "normal",
  "url": "https://example.com/product"
}
```

### Travail de téléchargement ou de transcodage long : Event

Les tâches de téléchargement, de transcodage et de formation sont des événements car elles démarrent, se mettent à jour et se terminent.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Video transcoding",
  "status": "running",
  "message": "45% complete",
  "severity": "normal",
  "event_time": 1713750000000,
  "attrs": {
    "progress": 0.45
  }
}
```

## Aide-mémoire pour la modélisation

| Scénario | Modèle | Pourquoi |
| :--- | :--- | :--- |
| Échec, succès, baisse de prix, alerte | Message | Alerte ponctuelle. |
| Déploiement, sauvegarde, transcodage, incident | Event | Processus avec mises à jour et résultat. |
| Serveur, capteur, salle, service | Thing | Objet persistant avec l'état actuel. |
| Alerte sur un appareil spécifique | Thing + Message | L'entité et l'alerte restent connectées. |
| Incident sur un service | Thing + Event | Le service est l'entité ; l’incident est le cycle de vie. |