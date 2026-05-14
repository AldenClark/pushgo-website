---
title: KI-Agent-Benachrichtigungen mit MCP
description: Senden Sie PushGo-Benachrichtigungen, Events und Statusupdates aus KI-Agenten und Chatbots über MCP und OAuth.
---

PushGo eignet sich, wenn ein KI-Agent, Chatbot oder MCP-Client Benutzer benachrichtigen, längere Aufgaben melden oder Objektstatus aktualisieren soll, ohne Channel-Passwörter an das Modell weiterzugeben.

## Geeignete Szenarien

- Benutzer nach Abschluss einer Agent-Aufgabe benachrichtigen.
- Agent-Fortschritt als aktualisierbares Event verfolgen.
- Service-, Geräte- oder Aufgabenstatus als Thing aktualisieren.
- MCP-Clients über OAuth mit begrenzten Channel-Rechten ausstatten.

## Wie PushGo diesen Workflow modelliert

| Bedarf | Nutzung | Warum |
| :--- | :--- | :--- |
| Eine Abschlussmeldung | Message | Der Benutzer braucht eine sichtbare Benachrichtigung. |
| Lange Agent-Aufgabe | Event | Dieselbe Aufgabe kann aktualisiert und geschlossen werden. |
| Aktueller Dienst- oder Aufgabenstatus | Thing | Der Agent aktualisiert ein dauerhaftes Objekt. |
| Assistenten-Autorisierung | MCP OAuth | Das Modell braucht kein Channel-Passwort in Tool-Aufrufen. |

## Minimales Beispiel

Ein MCP-Client verbindet sich mit `/mcp`, startet `pushgo.channel.bind.start`, der Benutzer autorisiert einen Channel im Browser, danach kann der Assistent innerhalb dieses Bereichs `pushgo.message.send`, `pushgo.event.update` oder `pushgo.thing.update` aufrufen.

```text
pushgo.channel.bind.start -> user opens bind_url -> pushgo.message.send
```

## Fragen, die diese Seite beantwortet

- **Kann ein KI-Agent eine Push-Benachrichtigung senden?** Ja. Autorisierte MCP-Clients können über PushGo Message-Benachrichtigungen senden.
- **Sollte ein Chatbot Channel-Passwörter kennen?** Nein. Für Produktion sollte MCP OAuth genutzt werden, damit Benutzer Channels im Browser binden.
- **Wie meldet ein Agent Fortschritt?** Für lange Aufgaben ist Event passend, weil es wiederholt aktualisiert und geschlossen werden kann.

## Sicherheit und Betrieb

- Nutzen Sie getrennte Channels und begrenzte Zugangsdaten für riskante Automatisierung.
- Verwenden Sie MCP OAuth für KI-Assistenten, damit Modelle keine Channel-Passwörter halten.
- Nutzen Sie Selbsthosting, wenn Datenpfad, Transportregeln oder Compliance-Grenzen kontrolliert werden müssen.
- Nutzen Sie E2EE für sensible Felder, die nur Clients entschlüsseln sollen.

## Nächste Schritte

- [MCP-Referenz](/de/reference/mcp/)
- [Authentifizierung](/de/reference/auth/)
- [Datenmodelle](/de/guides/data-models/)
