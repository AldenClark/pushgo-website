---
title: Chiffrement de bout en bout
description: Utilisez le texte chiffré pour que les clients déchiffrent localement les champs PushGo sensibles.
---
PushGo E2EE protège les domaines d'activité sensibles. L'expéditeur chiffre les champs dans `ciphertext`, le Gateway relaie ce texte chiffré et les clients déchiffrent localement après la configuration d'une clé.

## Ce qu'il protège

| Contenu | Protégé par E2EE | Remarques |
| :--- | :--- | :--- |
| Domaines d'activité à l'intérieur de `ciphertext` | Oui | Le Gateway ne peut pas lire le texte en clair. |
| Champs de requête simples | Non | `channel_id`, `password`, `severity` et les ID d'itinéraire sont des champs de requête normaux. |
| En-têtes HTTP | Non | Protégé par HTTPS/TLS, et non par E2EE. |
| Métadonnées de livraison | Non | Le Gateway a toujours besoin de métadonnées de base pour l'authentification, le routage et la répartition. |

E2EE ne remplace pas l’authentification Gateway. Vous avez toujours besoin des identifiants du Channel, des tokens Gateway Bearer facultatifs et HTTPS.

## Format de cryptage

Les clients PushGo prennent en charge AES-GCM. La longueur de la clé détermine la variante AES.

| Longueur de clé | Algorithme | Nonce / IV | Balise d'authentification |
| :--- | :--- | :--- | :--- |
| 16 octets | AES-128-GCM | 12 octets | 16 octets |
| 24 octets | AES-192-GCM | 12 octets | 16 octets |
| 32 octets | AES-256-GCM | 12 octets | 16 octets |

Disposition binaire :

```text
[ ciphertext (N bytes) ][ auth tag (16 bytes) ][ nonce / iv (12 bytes) ]
```

Encodez en base64 le blob binaire complet et placez-le dans le champ API `ciphertext`.

## Champs chiffrables

Après déchiffrement, `ciphertext` doit contenir un objet JSON. Les clients reconnaissent les champs canoniques suivants et les réécrivent dans la charge utile de notification.

### Champs Message

| Champ | Tapez | Comportement |
| :--- | :--- | :--- |
| `title` | `string` | Remplace le titre de la notification. |
| `body` | `string` | Remplace le corps du message. |
| `url` | `string` | Remplace l'URL de destination. |
| `images` | Chaîne `string[]` ou JSON | Remplace la liste d’images. |
| `tags` | Chaîne `string[]` ou JSON | Remplace la liste de balises. |
| `metadata` | Chaîne `object` ou JSON | Remplace les métadonnées. |

### Champs Event

| Champ | Tapez | Comportement |
| :--- | :--- | :--- |
| `description` | `string` | Remplace la description de l'événement. |
| `status` | `string` | Remplace le statut de l'événement. |
| `message` | `string` | Remplace le message d'événement. |
| `started_at` | `number` | Remplace l’heure de début de l’événement. |
| `ended_at` | `number` | Remplace l’heure de fin de l’événement. |
| `attrs` | Chaîne `object` ou JSON | Remplace le correctif d'attributs d'événement. |

### Champs Thing

| Champ | Tapez | Comportement |
| :--- | :--- | :--- |
| `primary_image` | `string` | Remplace l’image principale. |
| `state` | `string` | Remplace l’état de l’entité. |
| `created_at` | `number` | Remplace l’heure de création. |
| `deleted_at` | `number` | Remplace l’heure de suppression. |
| `external_ids` | Chaîne `object` ou JSON | Remplace les identifiants externes. |
| `location_type` | `string` | Remplace le type d'emplacement. |
| `location_value` | `string` | Remplace la valeur de l'emplacement. |
| `location` | Chaîne `object` ou JSON | Remplace l'objet de localisation. |

:::remarque
Les champs nécessaires à la priorité d'acheminement et de livraison, tels que `channel_id`, `password`, `event_id`, `thing_id`, `event_time`, `observed_at` et `severity`, doivent généralement rester en texte brut.
:::

## Exemple Python

```python
import base64
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_payload(key_hex, payload):
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    plaintext = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    cipher_and_tag = aesgcm.encrypt(nonce, plaintext, None)
    return base64.b64encode(cipher_and_tag + nonce).decode("utf-8")


payload = {
    "title": "Database lag",
    "body": "Replica lag exceeded 60 seconds.",
    "tags": ["encrypted", "database"],
    "metadata": {"source": "replica-monitor"}
}

key_hex = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
print(encrypt_payload(key_hex, payload))
```

L'exemple `key_hex` est une clé de 32 octets pour AES-256-GCM. Utilisez une clé aléatoire générée de manière sécurisée en production et configurez la même clé localement dans le client.

## Utilisation de l'API

```bash
curl -X POST https://gateway.pushgo.dev/message \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "YOUR_CHANNEL_ID",
    "password": "YOUR_CHANNEL_PASSWORD",
    "title": "Encrypted message",
    "body": "Your client will try to decrypt ciphertext.",
    "severity": "normal",
    "ciphertext": "BASE64_ENCODED_CIPHERTEXT"
  }'
```

Les `title` et `body` simples peuvent être un affichage de secours pour les clients sans clé ou lorsque le déchiffrement échoue. Mettez du contenu vraiment sensible dans le `ciphertext`.

## États de déchiffrement

| État | Signification |
| :--- | :--- |
| `decryptOk` | Le déchiffrement a réussi et au moins un champ a été appliqué. |
| `decryptFailed` | Le texte chiffré existe, mais le déchiffrement ou l'analyse a échoué. |
| `notConfigured` | Le client n’a configuré aucune clé utilisable. |
| `algMismatch` | L'algorithme configuré ne correspond pas à la charge utile. |

## Dépannage

| Problème | Vérifier |
| :--- | :--- |
| Le déchiffrement échoue | Même clé, Base64 complète et disposition binaire `ciphertext + tag + nonce`. |
| Le client ne remplace pas les champs | Le JSON déchiffré doit être un objet et les noms de champs doivent être canoniques. |
| Gateway peut toujours voir le titre | Les champs de requête simples ne sont pas protégés par E2EE ; mettez les titres sensibles dans `ciphertext`. |
| `severity` n'est pas crypté | Ceci est recommandé car le Gateway et les services push de plateforme ont besoin d'informations prioritaires. |