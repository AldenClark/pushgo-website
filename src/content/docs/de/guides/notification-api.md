---
title: Push Notification API für Skripte und Dienste
description: Nutzen Sie PushGo als HTTP-Benachrichtigungs-API für curl, Webhooks, cron, CI/CD, NAS-Alarme und Automatisierungsskripte.
---

PushGo bietet eine direkt aufrufbare HTTP-API für Skripte und Dienste, die sichtbare Benachrichtigungen und strukturierte Ereignis- oder Zustandsmodelle benötigen.

## Geeignete Szenarien

- Benachrichtigungen aus curl, cron, Shell-Skripten oder Webhooks senden.
- Jobabschluss, Preisalarme, Bild-Snapshots oder Monitoring-Ergebnisse melden.
- Event und Thing nutzen, statt alle Informationen als Textstrom zu senden.
- Kompatibilitätsendpunkte nutzen und schrittweise auf native PushGo-APIs umstellen.

## Wie PushGo diesen Workflow modelliert

| Bedarf | Nutzung | Warum |
| :--- | :--- | :--- |
| Ein Skriptalarm | Message | Einfach, flüchtig und gut mit curl testbar. |
| Aufgabe mit Fortschritt | Event | Dasselbe Event kann bis zum Abschluss aktualisiert werden. |
| Aktueller Geräte- oder Dienststatus | Thing | Clients sehen den neuesten Zustand statt veralteter Meldungen. |

## Minimales Beispiel

Der native Endpunkt `/message` akzeptiert JSON und meldet, ob der Gateway die Anfrage in die Verteilung aufgenommen hat.

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

- **Kann ich mit curl eine Benachrichtigung senden?** Ja. Die Message API ist für curl, Skripte und einfache HTTP-Clients geeignet.
- **Ist PushGo nur eine Handy-Benachrichtigungs-API?** Nein. PushGo modelliert auch Event-Lebenszyklen und aktuellen Thing-Zustand.
- **Kann ich die API selbst hosten?** Ja. Sie können Ihren eigenen Gateway mit eigener Authentifizierung, Speicherung, Transporten und MCP/OAuth betreiben.

## Sicherheit und Betrieb

- Nutzen Sie getrennte Channels und begrenzte Zugangsdaten für riskante Automatisierung.
- Verwenden Sie MCP OAuth für KI-Assistenten, damit Modelle keine Channel-Passwörter halten.
- Nutzen Sie Selbsthosting, wenn Datenpfad, Transportregeln oder Compliance-Grenzen kontrolliert werden müssen.
- Nutzen Sie E2EE für sensible Felder, die nur Clients entschlüsseln sollen.

## Nächste Schritte

- [Erste Schritte](/de/guides/getting-started/)
- [Message API](/de/reference/api-message/)
- [Selbsthosting](/de/guides/self-hosting/)
