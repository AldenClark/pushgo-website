---
title: Grenzen und Fehler
description: Gemeinsame PushGo-Gateway-Grenzwerte, Antwortumschlag, Statuscodes und Einstiegspunkte für die Fehlerbehebung.
---
Auf dieser Seite werden Regeln zusammengefasst, die von allen APIs gemeinsam genutzt werden. Erforderliche Felder, Lebenszyklusverhalten und modellspezifische Semantik gehören weiterhin zu jeder API-Seite.

## Gemeinsame Limits

| Artikel | Grenze |
| :--- | :--- |
| Körpergröße anfragen | Maximal 32 KB. |
| Vom Gateway generierte IDs | 32 hexadezimale Kleinbuchstaben. |
| Channel Passwort | Normalerweise 8-128 Zeichen. |
| `op_id` | 1-128 Zeichen; Buchstaben, Ziffern, `_`, `:`, `-`. |
| `images` | Bis zu 32 URLs mit jeweils maximal 2048 Zeichen. |
| `tags` | Bis zu 32 Tags mit jeweils maximal 64 Zeichen, gekürzt und dedupliziert. |
| `metadata` | Nur Skalarwerte; Schlüssel max. 64, Wert max. 512. |
| `attrs` | Objektpatch; `null` entfernt einen Schlüssel; Vermeiden Sie komplexe Verschachtelungen. |
| `ttl` | Unix-Millisekunden-Zeitstempel; Die TTL für die Zustellung durch den Anbieter ist auf etwa 28 Tage begrenzt. |
| Unbekannte Felder | Die nativen Werkzeugargumente Message, Event, Thing und MCP sind streng; Unbekannte Felder geben 400 zurück. |

## Antwortumschlag

Erfolg:

```json
{
  "success": true,
  "data": {
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

Fehler:

```json
{
  "success": false,
  "data": null,
  "error": "human readable message",
  "error_code": "machine_readable_code"
}
```

Die Automatisierung sollte `success` und `error_code` gegenüber natürlichsprachlichem `error`-Text bevorzugen.

## Bedeutung von `accepted`

`success=true` bedeutet, dass der Gateway die Anfrage verarbeitet hat. `accepted=true` bedeutet, dass es in den Versand gegangen ist.

Es wird nicht garantiert:

- Jedes Gerät ist online.
- APNs oder FCM hat eine Benachrichtigung angezeigt.
- Android-Privattransport in Echtzeit bereitgestellt.
- Der Benutzer ist von Benachrichtigungsberechtigungen, dem Fokusmodus oder der Batterierichtlinie nicht betroffen.

Behandeln Sie `accepted` als Gateway-Annahme- und Versandstatus, nicht als Empfangsbestätigung für das Endgerät.

## Allgemeine HTTP-Statuscodes

| Status | Bedeutung | Typischer Grund | Was zu tun ist |
| :--- | :--- | :--- | :--- |
| `200` | Gateway hat die Anfrage verarbeitet | `success=true`, aber überprüfen Sie trotzdem `accepted` | Speichern Sie zurückgegebene IDs und `op_id`. |
| `400` | Validierung fehlgeschlagen | Fehlendes erforderliches Feld, unbekanntes Feld, falsches Format | Vergleichen Sie JSON mit der API-Feldtabelle. |
| `401` | Gateway-Authentifizierung fehlgeschlagen | Privates Gateway verwendet `PUSHGO_TOKEN`; Bearer-Token fehlt oder ist falsch | Überprüfen Sie `Authorization: Bearer <token>`. |
| `404` | Ziel fehlt | Channel, Event oder Thing existiert nicht | Überprüfen Sie `channel_id`, `event_id`, `thing_id`. |
| `413` | Anfragetext zu groß | JSON überschreitet 32 KB | Bild-URLs verwenden; Metadaten oder Attribute reduzieren. |
| `503` | Versand nicht vollständig angenommen | Anbieter, privater Transport, Warteschlange oder Downstream nicht verfügbar | Überprüfen Sie Gateway-Protokolle, Statistiken und Warteschlangenkapazität. |

## Fehlerbehebung nach Szenario

### Anfrage gibt 400 zurück

- JSON muss gültig sein.
- Senden Sie `event_id` nicht an `/event/create` oder `thing_id` an `/thing/create`.
- Unbekannte Felder entfernen.
- `severity` muss `critical`, `high`, `normal` oder `low` sein.
- `attrs` muss ein Objekt-Patch sein, kein Array oder eine tief verschachtelte Struktur.

### Anfrage gibt 401 zurück

- Prüfen Sie, ob der private Gateway über `PUSHGO_TOKEN` verfügt.
- Header muss `Authorization: Bearer <token>` sein.
- Verwechseln Sie das Channel-Passwort nicht mit dem Gateway-Token.
- Stellen Sie sicher, dass der Reverse-Proxy keine Autorisierungsheader entfernt.

### Die Anfrage ist erfolgreich, aber das Gerät benachrichtigt nicht

- Der Client muss den Channel abonniert haben.
- Die Gerätebenachrichtigungsberechtigung muss aktiviert sein.
- Die Apple-Lieferung kann durch APNs, Fokusmodi und Systemeinstellungen beeinträchtigt werden.
- Android-Clients müssen in der Lage sein, den richtigen `/gateway/profile` abzurufen.
- Private Transportports, Zertifikate und externe Adressen müssen erreichbar sein.
- Gateway-Protokolle können Anbieter- oder private Versandfehler anzeigen.

### Privater Transport nicht verfügbar

- `PUSHGO_PRIVATE_TRANSPORTS` muss aktiviert sein.
- WSS muss über die HTTPS-Domäne erreichbar sein.
- Der UDP-Port QUIC wird möglicherweise durch eine Firewall oder einen Proxy blockiert.
- Raw TCP muss TLS oder TLS-Offload korrekt verarbeiten.
- Die angekündigten Ports und die tatsächlichen Bind-Ports können je nach NAT oder Port-Mapping unterschiedlich sein.

### MCP-Bindung schlägt fehl

- `PUSHGO_MCP_ENABLED` muss aktiviert sein.
- `PUSHGO_PUBLIC_BASE_URL` muss eine externe HTTPS-URL sein.
- Der Reverse-Proxy muss `/.well-known/*`, `/oauth/*` und `/mcp` weiterleiten.
- DCR muss mit der Client-Fähigkeit übereinstimmen.
- Bindungsseitensitzungen können ablaufen.

## Verwandte Seiten

- [Authentifizierung](/de/reference/auth/)
- [Message API](/de/reference/api-message/)
- [Event API](/de/reference/api-event/)
- [Thing API](/de/reference/api-thing/)
- [Selbsthosting](/de/guides/self-hosting/)