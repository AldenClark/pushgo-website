---
title: NAS-, IoT- und Home-Assistant-Benachrichtigungen
description: Nutzen Sie PushGo für NAS-Alarme, IoT-Geräte, Home-Assistant-Automationen und langlebige Gerätezustände.
---

Home Automation und Gerätemonitoring brauchen oft mehr als eine einmalige Meldung. PushGo sendet Benachrichtigungen, verfolgt Events und hält aktuellen Zustand fest.

## Geeignete Szenarien

- NAS-Platten-, Backup- und Dienstalarme senden.
- Home Assistant über HTTP- oder Webhook-Aktionen anbinden.
- Geräte, Sensoren, Backup-Jobs oder Medienserver als Thing darstellen.
- Einen privaten Gateway nutzen, wenn Heimdaten unter eigener Kontrolle bleiben sollen.

## Wie PushGo diesen Workflow modelliert

| Bedarf | Nutzung | Warum |
| :--- | :--- | :--- |
| Türkamera oder Plattenalarm | Message | Der Inhalt ist ein einzelner Alarm. |
| Backup- oder Medienscan-Fortschritt | Event | Fortschritt kann bis zum Abschluss aktualisiert werden. |
| Sensor- oder Gerätestatus | Thing | Der neueste Zustand ist wichtiger als jede historische Meldung. |

## Minimales Beispiel

Ein NAS-Skript kann `/message` für Plattenalarme aufrufen; ein Backup-Job kann ein Event erstellen und bis Erfolg oder Fehler aktualisieren.

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Hallo von PushGo",
    "body": "Der Automatisierungspfad funktioniert."
  }'
```

## Fragen, die diese Seite beantwortet

- **Kann PushGo Home-Assistant-Webhooks empfangen?** Ja. Home Assistant kann PushGo über Webhook- oder REST-Aktionen aufrufen.
- **Wie vermeide ich veraltete Gerätemeldungen?** Nutzen Sie Thing, damit Clients den aktuellen Zustand desselben Objekts zeigen.
- **Kann das privat laufen?** Ja. Hosten Sie den Gateway selbst, wenn Datenpfad oder Transportregeln privat bleiben sollen.

## Sicherheit und Betrieb

- Nutzen Sie getrennte Channels und begrenzte Zugangsdaten für riskante Automatisierung.
- Verwenden Sie MCP OAuth für KI-Assistenten, damit Modelle keine Channel-Passwörter halten.
- Nutzen Sie Selbsthosting, wenn Datenpfad, Transportregeln oder Compliance-Grenzen kontrolliert werden müssen.
- Nutzen Sie E2EE für sensible Felder, die nur Clients entschlüsseln sollen.

## Nächste Schritte

- [Anwendungsfälle](/de/guides/use-cases/)
- [Thing API](/de/reference/api-thing/)
- [Selbsthosting](/de/guides/self-hosting/)
