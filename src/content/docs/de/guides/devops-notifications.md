---
title: DevOps- und CI/CD-Benachrichtigungen
description: Nutzen Sie PushGo für CI/CD-, Deployment-, Incident-, Server- und Monitoring-Benachrichtigungen mit Message, Event und Thing.
---

DevOps-Benachrichtigungen bleiben verständlicher, wenn einzelne Alarme, Incident-Lebenszyklen und Dienstzustand getrennt modelliert werden.

## Geeignete Szenarien

- Build-, Deployment- und Release-Benachrichtigungen senden.
- Incident-Fortschritt als aktualisierbares Event verfolgen.
- Aktuellen Status eines Dienstes, einer Queue, eines Backups oder Hosts als Thing zeigen.
- Alarme über öffentlichen oder eigenen Gateway an Apple- und Android-Clients zustellen.

## Wie PushGo diesen Workflow modelliert

| Bedarf | Nutzung | Warum |
| :--- | :--- | :--- |
| Build beendet | Message | Eine sichtbare Meldung reicht aus. |
| Deployment läuft | Event | Der Lebenszyklus kann von gestartet bis fehlgeschlagen oder abgeschlossen aktualisiert werden. |
| Service Health | Thing | Das Objekt hat einen aktuellen Zustand, der sich ändert. |

## Minimales Beispiel

Nutzen Sie Message für einfache Pipeline-Abschlüsse, Event für Deployments mit mehreren Updates und Thing für aktuellen Dienstzustand.

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

- **Eignet sich PushGo für CI/CD?** Ja. CI/CD-Systeme können die HTTP-API direkt aus Shell-Schritten oder Webhooks aufrufen.
- **Wie sollten Incidents dargestellt werden?** Als Event, damit derselbe Incident aktualisiert und geschlossen werden kann.
- **Können Teams DevOps-Benachrichtigungen selbst hosten?** Ja. Ein privater Gateway kontrolliert Datenpfade, Authentifizierung und Betriebspolitik.

## Sicherheit und Betrieb

- Nutzen Sie getrennte Channels und begrenzte Zugangsdaten für riskante Automatisierung.
- Verwenden Sie MCP OAuth für KI-Assistenten, damit Modelle keine Channel-Passwörter halten.
- Nutzen Sie Selbsthosting, wenn Datenpfad, Transportregeln oder Compliance-Grenzen kontrolliert werden müssen.
- Nutzen Sie E2EE für sensible Felder, die nur Clients entschlüsseln sollen.

## Nächste Schritte

- [Datenmodelle](/de/guides/data-models/)
- [Event API](/de/reference/api-event/)
- [Selbsthosting](/de/guides/self-hosting/)
