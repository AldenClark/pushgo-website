---
title: Einführung
description: Was PushGo ist, für wen es ist und wo man anfangen soll.
---
**PushGo** ist ein Open-Source-Benachrichtigungs- und Statussynchronisierungssystem für persönliche Automatisierung, Server-/NAS-Überwachung, DevOps, IoT und KI-Assistenten-Workflows. Es besteht aus Clients, einer Gateway- und einer HTTP-API. Sie können den öffentlichen Gateway direkt verwenden oder Ihren eigenen bereitstellen.

## Was PushGo löst

Viele Benachrichtigungstools senden nur Text an ein Telefon. Das reicht für einfache Warnungen aus, aber es wird unübersichtlich, wenn Sie den Aufgabenfortschritt, den Lebenszyklus eines Vorfalls, den Gerätestatus oder Aktionen des KI-Assistenten benötigen.

PushGo unterteilt Daten in drei Modelle:

| Modell | Zweck | Beispiele |
| :--- | :--- | :--- |
| Message | Einmalige Warnung | Backup abgeschlossen, Festplatte fast voll, Preis gesunken |
| Event | Prozess, der aktualisiert und geschlossen werden kann | Einsatz, Umgang mit Vorfällen, Tür offen bis geschlossen |
| Thing | Persistenter Entitätsstatus | NAS, Sensor, Raum, Netzwerkdienst |

Das Ergebnis ist, dass Warnungen, Prozesse und Status nicht mehr in dasselbe Textfeld gequetscht werden. Clients und Automatisierung können zuverlässigere Schlüsse daraus ziehen.

## Systemkomponenten

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

Der Gateway übernimmt die Authentifizierung, API-Akzeptanz, Statusspeicherung und den Versand. Clients empfangen, zeigen an, entschlüsseln und verwalten Channelabonnements.

## Für wen es ist

- Persönliche Benutzer: Skripte, Webhooks, Preismonitore und lang laufende Aufgaben.
- Heimserver- und NAS-Benutzer: Festplatten-, Backup-, USV- und Servicestatusüberwachung.
- DevOps-Benutzer: Deployments, Builds, Vorfälle und Dienstzustand.
- IoT/Home Assistant-Benutzer: Räume, Sensoren und Sicherheitsereignisse.
- Selbsthoster: Kontrollieren Sie Daten, Authentifizierung, private Transporte und MCP/OAuth auf Ihrem eigenen Gateway.

## Wo soll ich anfangen?

| Ziel | Lesen |
| :--- | :--- |
| Erhalten Sie Ihre erste Benachrichtigung | [Erste Schritte](/de/guides/getting-started/) |
| Verstehen Sie, wie das System funktioniert | [Kernkonzepte](/de/guides/concepts/) |
| Wählen Sie das richtige Datenmodell | [Datenmodelle](/de/guides/data-models/) |
| Sehen Sie echte Integrationsmuster | [Anwendungsfälle](/de/guides/use-cases/) |
| Von ntfy, Bark oder ServerChan | migrieren [Migrationsleitfaden](/de/guides/migration/) |
| Stellen Sie Ihren eigenen Gateway | bereit [Selbsthosting](/de/guides/self-hosting/) |
| KI-Assistenten integrieren | [MCP-Referenz](/de/reference/mcp/) |

Wenn Sie noch keinen Channel haben, beginnen Sie mit „Erste Schritte“. Wenn Sie bereits über ein zu integrierendes Skript verfügen, lesen Sie Datenmodelle und die Message-API.