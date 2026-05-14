---
title: Von ntfy, Bark oder ServerChan migrieren
description: Migrieren Sie bestehende ntfy-, Bark-, ServerChan- oder Webhook-Skripte mit Kompatibilitätsendpunkten und nativen PushGo-Modellen.
---

PushGo kann bestehende Benachrichtigungs-Workflows aufnehmen, während wichtige Pfade schrittweise auf Message, Event und Thing umgestellt werden.

## Geeignete Szenarien

- Einfache Skripte während der Evaluation weiter betreiben.
- Einen Alarmweg nach dem anderen migrieren.
- Textmeldungen bei Bedarf in strukturierte Lebenszyklen oder Zustand überführen.
- Für sensible Workflows E2EE und Selbsthosting kombinieren.

## Wie PushGo diesen Workflow modelliert

| Bedarf | Nutzung | Warum |
| :--- | :--- | :--- |
| Einfacher migrierter Alarm | Message | Die alte Meldung bleibt eine einmalige Message. |
| Workflow mit Statuswechseln | Event | Wiederholte Updates gehören zu einem Lebenszyklus. |
| Langlebiges Objekt | Thing | Dieselbe Entität kann fortlaufend aktualisiert werden. |

## Minimales Beispiel

Starten Sie mit Kompatibilitätsendpunkten für risikoarme Skripte und migrieren Sie reichere Workflows später zu `/message`, `/event/*` oder `/thing/*`.

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

- **Muss ich sofort alle Skripte umschreiben?** Nein. Nutzen Sie Kompatibilität und migrieren Sie zuerst wertvolle Workflows.
- **Wann reicht Text nicht mehr?** Wenn Fortschritt, Abschluss, aktueller Zustand, Bilder, Metadaten oder Sicherheitsanforderungen wichtig werden.
- **Ist das ein direkter Feature-Vergleich?** Nein. Migration ist eine Modellierungsentscheidung.

## Sicherheit und Betrieb

- Nutzen Sie getrennte Channels und begrenzte Zugangsdaten für riskante Automatisierung.
- Verwenden Sie MCP OAuth für KI-Assistenten, damit Modelle keine Channel-Passwörter halten.
- Nutzen Sie Selbsthosting, wenn Datenpfad, Transportregeln oder Compliance-Grenzen kontrolliert werden müssen.
- Nutzen Sie E2EE für sensible Felder, die nur Clients entschlüsseln sollen.

## Nächste Schritte

- [Migrationsleitfaden](/de/guides/migration/)
- [Message API](/de/reference/api-message/)
- [Datenmodelle](/de/guides/data-models/)
