---
title: Authentifizierung
description: Verstehen Sie Channel-Zugangsdaten, Gateway-Tokens, Kompatibilitätsschlüssel und MCP OAuth.
---
Die PushGo-Authentifizierung hängt von der von Ihnen aufgerufenen API-Oberfläche ab. Identifizieren Sie zuerst den Modus und platzieren Sie dann die Anmeldeinformationen an der richtigen Stelle.

## Authentifizierungsmodi

| Szenario | Erforderliche Anmeldeinformationen | Ort | Verwendet von |
| :--- | :--- | :--- | :--- |
| Native API | `channel_id` + `password` | JSON Körper | `/message`, `/event/*`, `/thing/*` |
| Privater Gateway-Token | Bearer-Token | `Authorization`-Header | Aufrufer eines selbstgehosteten Gateways |
| Kompatibilitätsendpunkt | `<channel_id>:<password>` | Pfad oder Kompatibilitätsfeld | ntfy, Bark, ServerChan Migration |
| MCP OAuth | OAuth Access Tokens | Verwaltet vom MCP-Client | KI-Assistenten und Drittanbieter-Clients |

Channel-Autorisierung und Gateway-Autorisierung sind separate Ebenen. Wenn ein privates Gateway-Token aktiviert ist, benötigen Anfragen weiterhin eine Channel-ID und ein Passwort.

## Channel-Autorisierung

Native Message-, Event- und Thing-APIs verwenden Channel-Zugangsdaten im JSON-Körper.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Test message"
}
```

| Feld | Beschreibung |
| :--- | :--- |
| `channel_id` | Zielkanal. |
| `password` | Channel-Passwort, normalerweise 8-128 Zeichen. |

Das Channel-Passwort steuert, wer auf einen Channel schreiben kann. Es ist kein Gateway-Administratorkennwort und sollte nicht in öffentlichen Repositorys, Protokollen oder Frontend-Code abgelegt werden.

## Gateway-Bearer-Token

Selbstgehostete Gateways können mit `PUSHGO_TOKEN` eine Authentifizierung auf Gateway-Ebene ermöglichen.

```bash
PUSHGO_TOKEN=replace-with-gateway-token
```

Anfragen benötigen dann:

```http
Authorization: Bearer replace-with-gateway-token
```

Vollständiges Beispiel:

```bash
curl -X POST https://gateway.example.com/message \
  -H "Authorization: Bearer replace-with-gateway-token" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Private Gateway test"
  }'
```

Einschränkungen:

- Verwenden Sie den Standard-Headernamen `Authorization`.
- Der Typ Token muss `Bearer` sein.
- Die Länge von Token ist auf 4096 Zeichen begrenzt.
- Wenn `PUSHGO_TOKEN` leer ist, ist die Token-Authentifizierung auf Gateway-Ebene deaktiviert.

## Öffentliche Gateway-Instanzen

Öffentliche Gateway-Instanzen validieren weiterhin die Channel-ID und das Channel-Passwort. In den „Erste Schritte“-Beispielen wird standardmäßig nur die Channel-Autorisierung angezeigt. Zusätzliche Zugriffsrichtlinien können von der aktuellen Konfiguration des öffentlichen Endpunkts abhängen.

## Kompatibilitätsschlüssel

Kompatibilitätsendpunkte verwenden `<channel_id>:<password>` als `compat_key`.

| Quelle | Schlüsselstandort |
| :--- | :--- |
| ntfy | `/ntfy/{topic}`, wobei `{topic}` für `compat_key` steht |
| ServerChan | `/serverchan/{sendkey}`, wobei `{sendkey}` für `compat_key` steht |
| Bark v1 | `/bark/{device_key}/{body}`, wobei `{device_key}` für `compat_key` steht |
| Bark v2 | JSON-Feld `device_key` |

Beispiel:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -d "NAS backup completed"
```

Der Kompatibilitätsschlüssel enthält das Channel-Passwort und muss als Geheimnis behandelt werden.

## MCP OAuth

Im MCP OAuth-Modus sollten KI-Assistenten bei Tool-Aufrufen keine Channel-Passwörter weitergeben. Der empfohlene Ablauf ist:

1. Der MCP-Client stellt eine Verbindung zum `https://gateway.example.com/mcp` her.
2. Der Benutzer öffnet einen Bindungslink.
3. Der Benutzer gibt die Channel-ID und das Passwort ein und bestätigt die Autorisierung.
4. Der Gateway gibt ein bereichsbegrenztes OAuth-Token an den MCP-Client aus.
5. Tool-Aufrufe verwenden die OAuth-Autorisierung für die gebundenen Channels.

Der Legacy-Modus MCP kann weiterhin `password` bei jedem Toolaufruf übergeben, ist jedoch am besten für persönliche oder vertrauenswürdige Umgebungen reserviert. Produktionsintegrationen sollten OAuth bevorzugen.

## Sicherheitsempfehlungen

- Übergeben Sie keine Channel-Passwörter, Kompatibilitätsschlüssel oder Gateway-Tokens.
- Verwenden Sie HTTPS in der Produktion.
- Codieren Sie in öffentlichen Beispielen keine echten Channel-Passwörter fest.
- Aktivieren Sie für selbstgehostete Gateways `PUSHGO_TOKEN` und platzieren Sie den HTTP-Listener hinter einem Reverse-Proxy.
- Für KI-Assistenten-Integrationen bevorzugen Sie MCP OAuth, damit das Modell Channel-Passwörter nicht direkt speichert.
- Rotieren Sie Channel-Passwörter und Gateway-Tokens unabhängig voneinander; setzen Sie sie nicht auf denselben Wert.