---
title: Erste Schritte
description: Installieren Sie einen Client, erstellen Sie einen Channel und erhalten Sie Ihre erste PushGo-Benachrichtigung.
---
Dieses Handbuch richtet sich an Erstbenutzer des PushGo. Am Ende verfügen Sie über einen nutzbaren Channel und eine funktionierende HTTP-Anfrage, die Ihren ersten Message sendet.

## Voraussetzungen

- Ein Gerät, auf dem ein veröffentlichter PushGo-Client installiert ist.
- Ein Terminal, auf dem `curl` ausgeführt werden kann.
- Eine Channel-ID und ein Channel-Passwort. Sie können im Client einen neuen Channel erstellen oder einen von einem anderen Gerät freigegebenen Channel abonnieren.

## 1. Installieren Sie einen Client

Installieren Sie einen der freigegebenen Clients.

| Plattform | Herunterladen | Anforderung |
| :--- | :--- | :--- |
| iOS / macOS / watchOS | [App Store](https://apps.apple.com/app/pushgo) | iOS 18+, macOS 15+, watchOS 11+ |
| Android | [GitHub-Veröffentlichungen](https://github.com/AldenClark/pushgo-android/releases) | Android 9+ |

## 2. Erstellen oder abonnieren Sie einen Channel

Ein Channel ist die PushGo-Schreibgrenze. Anfragen gehen an einen Channel und abonnierte Geräte werden zu Lieferzielen.

### Neuen Channel erstellen

1. Öffnen Sie den Client.
2. Verwenden Sie die Aktion „Hinzufügen“.
3. Wählen Sie „Channel erstellen“.
4. Geben Sie einen erkennbaren Namen und ein 8-128 Zeichen langes Passwort ein.
5. Speichern Sie die generierte Channel-ID und das Passwort.

### Vorhandenen Channel abonnieren

1. Öffnen Sie den Client.
2. Wählen Sie „Channel abonnieren“.
3. Geben Sie die Channel-ID und das Passwort ein.
4. Nach dem Abonnement empfängt das Gerät Inhalte für diesen Channel.

## 3. Öffentliches Gateway auswählen

Öffentliche Gateway-Instanzen eignen sich zum Testen, ohne dass ein Server bereitgestellt werden muss.

| Region | Gateway |
| :--- | :--- |
| Global | `https://gateway.pushgo.dev` |
| Festlandchina | `https://gateway.pushgo.cn` |

Wählen Sie die Region aus, die Ihnen und Ihren Empfangsgeräten am nächsten liegt. Wenn Sie selbst hosten, ersetzen Sie die Beispiel-URL durch Ihre eigene Gateway-URL. Wenn Ihr Gateway `PUSHGO_TOKEN` verwendet, fügen Sie `Authorization: Bearer <token>` hinzu.

## 4. Erste Message senden

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Hello from PushGo",
    "body": "This is a test notification.",
    "severity": "normal"
  }'
```

Eine erfolgreiche Antwort sieht so aus:

```json
{
  "success": true,
  "data": {
    "channel_id": "YOUR_CHANNEL_ID",
    "op_id": "8a1fc4b3d9f04fd2857f92f66f7cc5d1",
    "message_id": "3b7fd2e87d7d4d6d9c7f3a318ac21f02",
    "accepted": true
  },
  "error": null,
  "error_code": null
}
```

`success=true` bedeutet, dass der Gateway die Anfrage akzeptiert hat. `accepted=true` bedeutet, dass es in den Versand gegangen ist; Die endgültige Benachrichtigungsanzeige hängt weiterhin vom Gerätestatus, den Plattform-Push-Diensten und dem Status des privaten Transports ab.

## Häufige Probleme

| Symptom | Prüfen |
| :--- | :--- |
| `400`-Antwort | JSON-Gültigkeit, Feldnamen und erforderliche `title`, `channel_id`, `password`. |
| `401`-Antwort | Privates Gateway `PUSHGO_TOKEN` und `Authorization: Bearer <token>`. |
| `404`-Antwort | Channel-ID und ob das Gerät den Channel erstellt oder abonniert hat. |
| `success=true` aber keine Benachrichtigung | Gerätebenachrichtigungsberechtigung, Netzwerkstatus, privater Android-Transport, APNs/FCM-Zustellung. |
| Nutzlast zu groß | Die maximale Textgröße des JSON beträgt 32 KB; Verwenden Sie Bild-URLs, anstatt Binärdaten einzubetten. |

Weitere Statuscodes finden Sie unter [Grenzwerte und Fehler](/de/reference/limits-errors/).

## Nächste Schritte

- Um zu verstehen, warum der PushGo drei Modelle hat, lesen Sie [Kernkonzepte](/de/guides/concepts/).
- Um Message, Event oder Thing auszuwählen, lesen Sie [Datenmodelle](/de/guides/data-models/).
- Um echte Skripte zu integrieren, lesen Sie [Use Cases](/de/guides/use-cases/).
- Um Ihr eigenes Gateway auszuführen, lesen Sie [Selbsthosting](/de/guides/self-hosting/).
