---
title: Apps- und Plattformunterstützung
description: Verstehen Sie veröffentlichte PushGo-Clients, Systemanforderungen und Plattformbereitstellungspfade.
---
PushGo veröffentlicht derzeit Apple-Plattform-Clients, einen Android-Client und den Gateway. Auf dieser Website werden nur öffentlich verfügbare Veröffentlichungen beschrieben.

## Plattformübersicht

| Plattform | Herunterladen | Anforderung | Primärer Lieferpfad | Privater Transport |
| :--- | :--- | :--- | :--- | :--- |
| iOS | App Store | iOS 18+ | APNs | Nein |
| macOS | App Store | macOS 15+ | APNs | Nein |
| watchOS | App Store | watchOS 11+ | APNs | Nein |
| Android | GitHub-Veröffentlichungen | Android 9+ | FCM + Privattransporte | Ja, QUIC / Raw TCP / WSS |

## Apple-Clients

Apple-Clients folgen dem System-Push-Modell. APNs übernimmt die Hintergrundzustellung.

Gute Passformen:

- Empfangen persönlicher Benachrichtigungen auf iPhone, Mac und Apple Watch.
- Verwendung von Systembenachrichtigungsprioritäten und Benachrichtigungserweiterungen für Rich Content.
- Das Verhalten des Clients sollte nah am Betriebssystem gehalten werden, anstatt eine lang andauernde Hintergrundverbindung aufrechtzuerhalten.

Hinweise:

- Apple-Clients verwenden keine privaten PushGo-Android-Transporte.
- Die Hintergrundzustellung hängt von APNs, Benachrichtigungsberechtigungen, Fokusmodi und dem Netzwerkstatus des Geräts ab.
- E2EE-Felder werden lokal entschlüsselt, nachdem ein Schlüssel konfiguriert wurde; Wenn kein Schlüssel konfiguriert ist oder die Entschlüsselung fehlschlägt, behalten Clients den Fallback-Anzeigestatus bei.

## Android-Client

Der Android-Client unterstützt sowohl die Anbieterzustellung als auch private PushGo-Transporte.

Gute Passformen:

- Zustandssynchronisierung mit geringerer Latenz.
- Selbstgehostete Gateway-Deployments, bei denen Geräte eine Verbindung zu Ihrem eigenen Synchronisierungs-Einstiegspunkt herstellen.
- FCM-Weckfunktion kombiniert mit privatem Transport, wenn eine aktive Synchronisierung erforderlich ist.

Private Transporte werden aus dem Gateway-Profil und den aktuellen Netzwerkbedingungen ausgewählt.

| Transport | Anwendungsfall |
| :--- | :--- |
| WSS | Am universellsten; verwendet HTTPS wieder und ist der beste Standard-Privattransport. |
| QUIC | Geringere Latenz, wenn UDP-Ports verfügbar gemacht werden können. |
| Raw TCP | Kontrollierte Netzwerke oder dedizierte Layer-4-Einstiegspunkte. |

Für private Transporte muss der Gateway den passenden Transport aktivieren und erreichbare Ports, Zertifikate und öffentliche Basis-URLs ankündigen. Siehe [Selbsthosting](/de/guides/self-hosting/).

## Gateway

Der Gateway ist die Serverkomponente des PushGo. Es:

- Validiert Channel-Passwörter und optionale Gateway-Bearer-Token.
- Akzeptiert Message-, Event- und Thing-Anfragen.
- Behält den Ereignis- und Entitätsstatus bei.
- Versand über private Transportmittel APNs, FCM oder Android.
- Kann MCP/OAuth für KI-Assistenten aktivieren, die innerhalb autorisierter Channel-Bereiche agieren.

Sie können den öffentlichen Gateway oder einen selbst gehosteten Server verwenden, um Datenpfade, Authentifizierungsrichtlinien und Vorgänge zu steuern.

## Fähigkeitsmatrix

| Fähigkeit | Apfel | Android | Gateway |
| :--- | :--- | :--- | :--- |
| Erhalten Sie Message | Ja | Ja | Sendungen |
| Anzeige Event / Thing | Ja | Ja | Lager- und Versandstatus |
| E2EE Feldentschlüsselung | Ja | Ja | Leitet nur Chiffretext weiter |
| Privater Transport | Nein | Ja | Erfordert einen aktivierten privaten Einstiegspunkt |
| MCP/OAuth | N/A | N/A | Optional |

Wenn Sie nur Benachrichtigungen erhalten möchten, installieren Sie einen Client und befolgen Sie die Schritte [Erste Schritte](/de/guides/getting-started/). Wenn Sie Datenpfadkontrolle und private Transporte benötigen, fahren Sie mit Selbsthosting fort.
