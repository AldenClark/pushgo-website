---
title: Selbst gehosteter Open-Source-Benachrichtigungsserver
description: Betreiben Sie PushGo Gateway als selbst gehosteten Benachrichtigungsserver mit privaten Transporten, persistentem Zustand, E2EE und MCP/OAuth.
---

Hosten Sie PushGo selbst, wenn Benachrichtigungspfad, Datenspeicher, Gateway-Authentifizierung, Transportregeln und MCP/OAuth-Endpunkt unter Ihrer Kontrolle bleiben sollen.

## Geeignete Szenarien

- Einen privaten Gateway für persönliche oder Team-Automatisierung betreiben.
- Benachrichtigungen, Events und Entitätszustand von öffentlichen Gateways fernhalten.
- Einen eigenen HTTPS-Endpunkt `/mcp` für KI-Assistenten bereitstellen.
- Backups, Reverse Proxies, Logs und Observability in den Betrieb einbeziehen.

## Wie PushGo diesen Workflow modelliert

| Bedarf | Nutzung | Warum |
| :--- | :--- | :--- |
| Privater Zustellpfad | Gateway | Ihre Infrastruktur kontrolliert HTTP-API und Transport-Listener. |
| Sensible Felder | E2EE | Clients entschlüsseln sensible Felder lokal. |
| KI-Assistenten | MCP OAuth | Benutzer binden Channels über Ihre öffentliche Gateway-URL. |

## Minimales Beispiel

Setzen Sie `PUSHGO_PUBLIC_BASE_URL` auf den extern erreichbaren HTTPS-Ursprung, bevor Sie MCP/OAuth aktivieren.

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

- **Kann PushGo als selbst gehosteter Benachrichtigungsserver laufen?** Ja. Der Gateway ist für private Bereitstellung mit persistentem Speicher und konfigurierbaren Transporten ausgelegt.
- **Aktiviert Selbsthosting MCP?** Ja. Ein privater Gateway kann `/mcp` und OAuth-Routen bereitstellen, wenn eine öffentliche HTTPS-Basisadresse gesetzt ist.
- **Sind Backups nötig?** Ja. Channels, Geräte, MCP-Grants, Events und Things hängen von persistentem Speicher ab.

## Sicherheit und Betrieb

- Nutzen Sie getrennte Channels und begrenzte Zugangsdaten für riskante Automatisierung.
- Verwenden Sie MCP OAuth für KI-Assistenten, damit Modelle keine Channel-Passwörter halten.
- Nutzen Sie Selbsthosting, wenn Datenpfad, Transportregeln oder Compliance-Grenzen kontrolliert werden müssen.
- Nutzen Sie E2EE für sensible Felder, die nur Clients entschlüsseln sollen.

## Nächste Schritte

- [Selbsthosting](/de/guides/self-hosting/)
- [Ende-zu-Ende-Verschlüsselung](/de/reference/e2ee/)
- [MCP-Referenz](/de/reference/mcp/)
