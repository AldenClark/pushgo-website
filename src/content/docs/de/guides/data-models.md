---
title: Datenmodelle
description: Entscheiden Sie, wann Message, Event oder Thing das passende Modell ist, und verstehen Sie die Grenzen der wichtigsten Felder.
---
Die drei PushGo-Modelle beschreiben unterschiedliche fachliche Situationen. Wenn Sie das richtige Modell wählen, bleiben Client-Darstellung, Verlauf, Zustandsabgleich und Automatisierung nachvollziehbar.

## Entscheidungsmatrix

| Was Sie ausdrücken möchten | Modell | Warum |
| :--- | :--- | :--- |
| „Etwas ist passiert, bitte einmal benachrichtigen.“ | Message | Es gibt keinen dauerhaften Zustand. Jede Nachricht steht für sich. |
| „Etwas beginnt, verändert sich und endet später.“ | Event | Ein `event_id` kann mehrfach aktualisiert und anschließend geschlossen werden. |
| „Dieses Gerät, dieser Dienst, dieser Raum oder diese Aufgabe hat einen aktuellen Zustand.“ | Thing | Ein `thing_id` kann über längere Zeit aktualisiert werden. |
| „Bei einer bestimmten Entität ist eine Warnung aufgetreten.“ | Thing + Message | Thing identifiziert die Entität, Message protokolliert die Warnung. |
| „Eine bestimmte Entität durchläuft einen Prozess.“ | Thing + Event | Thing identifiziert das Objekt, Event protokolliert den Lebenszyklus. |

## Message: einmalige Warnung

Message ist das einfachste Benachrichtigungsmodell. Verwenden Sie es für Inhalte, die später nicht zusammengeführt, aktualisiert oder geschlossen werden müssen.

### Geeignet für

- Festplattennutzung über einem Schwellwert.
- Abgeschlossenes Backup.
- Gesunkener Preis.
- Kamera erkennt Bewegung und liefert ein Bild mit.

### Weniger geeignet für

- Build, Veröffentlichung und Abschluss eines Deployments.
- Aktuellen Zustand eines Servers, Sensors oder Raums.
- Dashboard-Werte, die immer wieder überschrieben werden.

### Feldgruppen

| Gruppe | Felder |
| :--- | :--- |
| Authentifizierung und Routing | `channel_id`, `password`, `op_id`, `thing_id` |
| Anzeige | `title`, `body`, `severity`, `url`, `images`, `tags` |
| Zeit und Sicherheit | `occurred_at`, `ttl`, `ciphertext` |
| Erweiterungen | `metadata` |

### Minimalbeispiel

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Backup completed",
  "body": "The daily NAS backup has finished.",
  "severity": "normal"
}
```

## Event: aktualisierbarer Lebenszyklus

Event beschreibt einen Prozess. Beim Erstellen erhalten Sie ein `event_id`; spätere Updates und der abschließende Close-Aufruf verwenden dieselbe ID.

### Geeignet für

- CI/CD-Deployment: gestartet, gebaut, veröffentlicht, erfolgreich oder fehlgeschlagen.
- Incident-Bearbeitung: erkannt, untersucht, behoben.
- Tür- oder Fensterzustand: geöffnet und später geschlossen.
- Länger laufende Aufgaben: Transcoding, Synchronisierung, Modelltraining.

### Lebenszyklus

```text
/event/create -> event_id
      |
      +-> /event/update  can be called many times
      |
      +-> /event/close   ends the event
```

### Feldgruppen

| Gruppe | Felder |
| :--- | :--- |
| Authentifizierung und Routing | `channel_id`, `password`, `op_id`, `thing_id` |
| Lebenszyklus | `event_id`, `event_time`, `started_at`, `ended_at` |
| Anzeige | `title`, `description`, `status`, `message`, `severity`, `tags`, `images` |
| Erweiterungen | `attrs`, `metadata`, `ciphertext` |

### Modellierungstipps

- Verwenden Sie kurze `status`-Werte wie `running`, `degraded`, `success` oder `failed`.
- Verwenden Sie `message` für den aktuellen Schritt, zum Beispiel „Image pushed“.
- `event_time` beschreibt den Zeitpunkt des jeweiligen Updates.
- `started_at` gehört zum Start des gesamten Events und typischerweise zum Create-Aufruf.
- `ended_at` gehört zum Ende des gesamten Events und typischerweise zum Close-Aufruf.

## Thing: dauerhafter Entitätszustand

Thing beschreibt ein Objekt, das über längere Zeit existiert. Sein Nutzen entsteht dadurch, dass immer dieselbe Entität aktualisiert wird, anstatt bei jeder Änderung eine unabhängige Benachrichtigung zu erzeugen.

### Geeignet für

- Heim-NAS, Server oder Netzwerkdienst.
- Raum, Sensor, Kamera oder Schloss.
- Länger laufendes Asset oder Aufgabe.
- Alles, dessen aktueller Zustand sichtbar bleiben soll.

### Lebenszyklus

```text
/thing/create -> thing_id
      |
      +-> /thing/update   can be called many times
      |
      +-> /thing/archive  inactive but history remains
      |
      +-> /thing/delete   removed or retired
```

### Feldgruppen

| Gruppe | Felder |
| :--- | :--- |
| Authentifizierung und Routing | `channel_id`, `password`, `op_id` |
| Identität und Anzeige | `thing_id`, `title`, `description`, `tags`, `primary_image`, `images` |
| Zeit | `created_at`, `observed_at`, `deleted_at` |
| Externe Systeme | `external_ids`, `location_type`, `location_value` |
| Zustand | `attrs`, `metadata`, `ciphertext` |

### Modellierungstipps

- Verwenden Sie `title` für einen lesbaren Namen, zum Beispiel „Home NAS“.
- Verwenden Sie `attrs` für veränderliche Werte wie CPU, Temperatur oder Online-Status.
- Verwenden Sie `metadata` für Zusatzdaten, die normalerweise nicht direkt angezeigt werden.
- Verwenden Sie `external_ids`, um IDs aus Systemen wie Home Assistant zuzuordnen.

## Modelle kombinieren

| Kombination | Muster |
| :--- | :--- |
| Thing + Message | Auf der Entität „Home NAS“ tritt die Warnung „Disk almost full“ auf. |
| Thing + Event | Auf der Entität „Production database“ läuft ein Event zu Replikationsverzögerungen. |
| Event + Message | Event protokolliert den Lebenszyklus, Message sendet an einem kritischen Punkt eine deutliche Warnung. |

Wenn Sie unsicher sind, beginnen Sie mit Message. Sobald ein Skript wiederholt „gestartet/aktualisiert/beendet“ oder „aktueller Wert geändert“ sendet, wechseln Sie zu Event oder Thing.
