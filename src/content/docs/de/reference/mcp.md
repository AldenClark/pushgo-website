---
title: Model Context Protocol (MCP)
description: Integrieren Sie PushGo mit MCP und OAuth2 in KI-Assistenten-Workflows.
---
PushGo Gateway kann als MCP HTTP-Server fungieren, sodass MCP-fähige KI-Assistenten Message senden, Event verwalten und Thing innerhalb autorisierter Channel-Bereiche aktualisieren können. Die OAuth2-Autorisierung wird empfohlen, damit Benutzer Channels in einem Browser binden, anstatt einem Modell Channel-Passwörter zu geben.

## Geeignete Einsatzfälle

- Lassen Sie einen KI-Assistenten eine PushGo-Benachrichtigung senden, nachdem eine Aufgabe abgeschlossen ist.
- Lassen Sie einen KI-Assistenten lang laufende Arbeiten als Event synchronisieren.
- Lassen Sie einen KI-Assistenten ein Thing für einen Dienst, ein Gerät oder eine Aufgabe aktualisieren.
- Bieten Sie MCP-Clients von Drittanbietern bereichsbezogenen Channel-Zugriff.

MCP sollte die Benutzerbestätigung nicht ersetzen. Bei Workflows mit hoher Auswirkung sollte die Bestätigung weiterhin auf der Client- oder Orchestrierungsebene erfolgen.

## Endpunkt

```text
https://your-gateway-domain/mcp
```

Wenn eine öffentliche Gateway-Instanz MCP/OAuth aktiviert, verwenden Sie den `/mcp`-Endpunkt dieser Region. Selbstgehostete Deployments müssen `PUSHGO_PUBLIC_BASE_URL` auf eine extern erreichbare URL setzen.

## Aktivieren Sie MCP auf einem privaten Gateway

```bash
PUSHGO_MCP_ENABLED=true
PUSHGO_PUBLIC_BASE_URL=https://gateway.example.com
```

Allgemeine Einstellungen:

| Umgebungsvariable | Standard | Beschreibung |
| :--- | :--- | :--- |
| `PUSHGO_MCP_DCR_ENABLED` | `true` | Aktiviert die dynamische Client-Registrierung. |
| `PUSHGO_MCP_PREDEFINED_CLIENTS` | keine | Vordefinierte OAuth-Clients im `client_id:client_secret`-Format. |
| `PUSHGO_MCP_ACCESS_TOKEN_TTL_SECS` | `900` | Lebensdauer des Access Tokens. |
| `PUSHGO_MCP_REFRESH_TOKEN_ABSOLUTE_TTL_SECS` | `2592000` | Absolute Lebensdauer des Refresh Tokens. |
| `PUSHGO_MCP_REFRESH_TOKEN_IDLE_TTL_SECS` | `604800` | Leerlaufzeit des Refresh Tokens. |
| `PUSHGO_MCP_BIND_SESSION_TTL_SECS` | `600` | Lebensdauer der Channel-Bindungssitzung. |

Wenn der Client DCR nicht unterstützt, verwenden Sie `PUSHGO_MCP_PREDEFINED_CLIENTS`.

## Autorisierungsmodi

| Modus | Channel Passwort | Am besten für | Risiko |
| :--- | :--- | :--- | :--- |
| OAuth2-Autorisierung | Nicht in Toolaufrufen übergeben | KI-Assistenten, Drittanbieter-Clients, Produktion | Begrenzt durch Bereiche und Channelzuteilungen. |
| Legacy-Modus | Wird bei jedem Toolaufruf übergeben | Persönliche Skripte, vertrauenswürdige Umgebungen | Der Aufrufer verfügt direkt über die Channel-Passwörter. |

Bevorzugen Sie die OAuth2-Autorisierung in der Produktion.

## Benutzerbindungsablauf

1. Der MCP-Client stellt eine Verbindung zu `/mcp` her.
2. Der Client erhält eine OAuth2-Clientidentität über OAuth oder DCR.
3. Der Assistent ruft `pushgo.channel.bind.start` an.
4. Der Benutzer öffnet das zurückgegebene `bind_url`.
5. Der Benutzer gibt die Channel-ID und das Passwort ein und bestätigt den Autorisierungsumfang.
6. Der Assistent fragt `pushgo.channel.bind.status` ab.
7. Nach der Autorisierung kann der Assistent Tools innerhalb des gebundenen Channelbereichs aufrufen.

Die Lebensdauer der Bindungssitzung wird von `PUSHGO_MCP_BIND_SESSION_TTL_SECS` gesteuert.

## Werkzeuge

### Message

| Werkzeug | Zweck |
| :--- | :--- |
| `pushgo.message.send` | Sendet einen einmaligen Message. Unterstützt `title`, `body`, `url`, `images`, `severity`, `ttl`, `metadata`, `thing_id` und verwandte Felder. |

### Event

| Werkzeug | Zweck |
| :--- | :--- |
| `pushgo.event.create` | Erstellt ein Lebenszyklusereignis und gibt `event_id` zurück. |
| `pushgo.event.update` | Aktualisiert ein vorhandenes Ereignis. |
| `pushgo.event.close` | Schließt ein vorhandenes Ereignis. |

### Thing

| Werkzeug | Zweck |
| :--- | :--- |
| `pushgo.thing.create` | Erstellt eine persistente Entität und gibt `thing_id` zurück. |
| `pushgo.thing.update` | Aktualisiert Entitätsattribute. |
| `pushgo.thing.archive` | Archiviert eine Entität. |
| `pushgo.thing.delete` | Löscht eine Entität oder zieht sie zurück. |

### Channel

| Werkzeug oder Ressource | Zweck |
| :--- | :--- |
| `pushgo.channel.bind.start` | Erstellt eine Bindungs- oder Widerrufssitzung und gibt `bind_url` zurück. |
| `pushgo.channel.bind.status` | Überprüft den Bindungssitzungsstatus. |
| `pushgo.channel.list` | Listet derzeit autorisierte Channels auf. |
| `pushgo.channel.unbind` | Widerruft die Channel-Autorisierung. |
| `pushgo://channels` | Liste der autorisierten Channelressourcen. |
| `pushgo://channels/{channel_id}` | Grundlegende Informationen für einen Channel. |

## Client-Konfigurationshinweise

- Der MCP-Endpunkt ist `https://your-gateway-domain/mcp`.
- Reverse-Proxys müssen `Host` und `X-Forwarded-Proto` korrekt übergeben.
- Selbstgehostete Deployments müssen `PUSHGO_PUBLIC_BASE_URL` auf eine extern erreichbare HTTPS-Stamm-URL festlegen.
- Wenn OAuth-Ausstellermetadaten oder Bindungslinks interne Adressen enthalten, überprüfen Sie zuerst `PUSHGO_PUBLIC_BASE_URL`.
- Wenn ein Client DCR nicht unterstützt, verwenden Sie vordefinierte Clients.

## Operationen

- MCP-Zuschüsse bleiben bestehen; Behandeln Sie die Datenbank oder das Speicherverzeichnis nicht als verfügbaren Cache.
- Access Tokens sind kurzlebig; Refresh Tokens sind langlebiger. Passen Sie die TTLs basierend auf dem Clientsrisiko an.
- Rotieren Sie vordefinierte Client-Geheimnisse regelmäßig.
- Verwenden Sie separate Channels für die Automatisierung mit hohem Risiko, anstatt alles in einem Channel zu autorisieren.
- Verwenden Sie strukturierte Gateway-Protokolle und -Statistiken für das betriebliche Debugging.

## Fehlerbehebung

| Symptom | Prüfen |
| :--- | :--- |
| Client kann OAuth-Metadaten nicht erkennen | `PUSHGO_PUBLIC_BASE_URL` muss eine externe HTTPS-URL sein; Reverse-Proxy muss bekannte Routen weiterleiten. |
| Bindungslink lässt sich nicht öffnen | Öffentliches DNS, HTTPS-Zertifikat, Reverse-Proxy-Pfad und `PUSHGO_MCP_BIND_SESSION_TTL_SECS`. |
| DCR schlägt fehl | Client-DCR-Unterstützung und `PUSHGO_MCP_DCR_ENABLED`. |
| Werkzeugaufruf fragt nach `password` | Möglicherweise befinden Sie sich im Legacy-Modus oder die OAuth-Autorisierung ist unvollständig. |
| Autorisiert, aber keine Channels sichtbar | Abschluss der Bindungssitzung, Scopes und ob die Channel-Freigabe widerrufen wurde. |