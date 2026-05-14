---
title: Kernkonzepte
description: Verstehen Sie die Channels, das Gateway, die Clients und die drei Datenmodelle von PushGo.
---
PushGo kann als Synchronisierungspfad von Ihren Skripten, Diensten oder Geräten zu den Clients verstanden werden, die einen Channel abonniert haben. Es verwandelt Text nicht nur in eine Systembenachrichtigung; Darüber hinaus bleiben Ereignislebenszyklen und Entitätsstatus erhalten, sodass Verlauf, Filterung und Automatisierung strukturiert bleiben.

## Ein mentales Modell

```text
Sender -> Gateway -> Channel -> Subscribed devices
                  |
                  +-> Message / Event / Thing
```

- **Absender**: Ihr Skript, Server, Home Assistant, CI/CD-Pipeline oder KI-Assistent.
- **Gateway**: validiert Anfragen, speichert den Status, wählt Zustellpfade aus und versendet Daten.
- **Channel**: der von einem oder mehreren Geräten abonnierte Kommunikationsraum. Für Anfragen sind eine Channel-ID und ein Passwort erforderlich.
- **Client**: Apple-Clients empfangen über APNs; Android-Clients können FCM plus private Transporte nutzen.
- **Datenmodell**: PushGo trennt einmalige Warnungen, Lebenszyklusprozesse und dauerhaften Status in verschiedene Objekte.

## Channel: Berechtigungs- und Abonnementgrenze

Ein Channel ist die grundlegende Grenze des PushGo. Mehrere Geräte können einen Channel abonnieren und mehrere Absender können darauf schreiben, wenn sie die Anmeldeinformationen kennen.

| Konzept | Zweck |
| :--- | :--- |
| `channel_id` | Gibt an, wohin die Anfrage gesendet wird. |
| `password` | Autorisiert Schreibvorgänge in den Channel. |
| Abonnierte Geräte | Erhalten Sie für den Channel akzeptierte Inhalte. |

Das Channel-Passwort ist nicht das Gateway-Administratorkennwort. Sowohl öffentliche als auch private Gateways verwenden die Autorisierung auf Channelebene. Private Gateways erfordern möglicherweise auch ein Bearer-Token auf Gateway-Ebene.

## Gateway: Annahme, Status und Lieferung

Wenn der Gateway eine Anfrage empfängt, geschieht Folgendes:

1. Validiert die Anfrage, die Channel-Zugangsdaten und das optionale Gateway-Token Bearer.
2. Erstellt oder aktualisiert den Status Message, Event oder Thing.
3. Versand an abonnierte Geräte über APNs, FCM oder private Android-Transporte.

Die HTTP-Antwort gibt an, ob der Gateway die Anfrage akzeptiert hat. Die tatsächliche Übermittlung von Systembenachrichtigungen erfolgt asynchron. `accepted` bedeutet also, dass die Anforderung in den Versandpfad gelangt ist, und nicht, dass jedes Gerät sie bereits angezeigt hat.

## Drei Datenmodelle

Die Kernidee von PushGo besteht nicht in „vielen Benachrichtigungsfeldern“. es verwendet unterschiedliche Modelle für unterschiedliche Geschäftsobjekte.

| Modell | Stellt | dar Beispiele | Haupt-API |
| :--- | :--- | :--- | :--- |
| Message | Einmalige Warnung | Festplattenwarnung, Backup abgeschlossen, Preis gesunken | `POST /message` |
| Event | Prozess mit Updates und einem Ende | Einsatz, Umgang mit Vorfällen, Tür offen bis geschlossen | `/event/create`, `/event/update`, `/event/close` |
| Thing | Persistenter Entitätsstatus | NAS, Sensor, Raum, Netzwerkdienst | `/thing/create`, `/thing/update`, `/thing/archive`, `/thing/delete` |

Stellen Sie zunächst eine Frage: Benachrichtigen Sie über etwas, verfolgen Sie einen Prozess oder synchronisieren Sie den aktuellen Status eines Objekts?

## Lieferpfade

PushGo erzwingt nicht, dass jede Plattform dieselbe Hintergrundverbindung verwendet.

| Plattform | Primärer Pfad | Notizen |
| :--- | :--- | :--- |
| Apple-Plattformen | APNs | Systemverwaltete Deployment für iOS, macOS und watchOS. |
| Android | FCM + Privattransporte | FCM zum Aufwecken; Private Transporte für eine Synchronisierung mit geringerer Latenz. |
| Selbstgehostetes Gateway | Deploymentsabhängig | Kann WSS, QUIC und Raw TCP für private Android-Transporte aktivieren. |

Informationen zu Clientfunktionen finden Sie unter [Apps und Plattformunterstützung](/de/guides/apps/).

## Sicherheitsebenen

| Schicht | Was es löst |
| :--- | :--- |
| Channel Passwort | Verhindert unbefugte Schreibvorgänge auf einem Channel. |
| Gateway Bearer-Token | Beschränkt, wer eine private Gateway-Instanz aufrufen kann. |
| HTTPS / TLS | Schützt Anmeldeinformationen und Anfragen während der Übertragung. |
| E2EE `ciphertext` | Ermöglicht Clients die lokale Entschlüsselung vertraulicher Geschäftsfelder, während der Gateway nur Chiffretext weiterleitet. |
| MCP OAuth | Ermöglicht KI-Assistenten, innerhalb autorisierter Channel-Bereiche zu agieren, ohne direkt über Channel-Passwörter zu verfügen. |

Wenn Sie nur Ihre erste Testbenachrichtigung senden möchten, verstehen Sie zunächst Channel und Message. Lesen Sie die Datenmodell-, Authentifizierungs- und Selbsthosting-Anleitungen, wenn Sie einen langlebigen Status oder Ihren eigenen Gateway benötigen.