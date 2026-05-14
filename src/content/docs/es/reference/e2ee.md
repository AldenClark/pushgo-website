---
title: Cifrado de extremo a extremo
description: Utilice texto cifrado para que los clientes descifren localmente los campos sensibles de PushGo.
---
PushGo E2EE protege campos comerciales sensibles. El remitente cifra los campos en `ciphertext`, el Gateway transmite ese texto cifrado y los clientes lo descifran localmente después de configurar una clave.

## Qué protege

| Contenido | Protegido por E2EE | Notas |
| :--- | :--- | :--- |
| Campos de negocio dentro de `ciphertext` | Sí | El Gateway no puede leer texto sin formato. |
| Campos de petición simples | No | `channel_id`, `password`, `severity` y los ID de ruta son campos de petición normales. |
| Cabeceras HTTP | No | Protegido por HTTPS/TLS, no por E2EE. |
| Metadatos de entrega | No | El Gateway todavía necesita metadatos básicos para autenticación, enrutamiento y envío. |

E2EE no reemplaza la autenticación Gateway. Aún necesita credenciales de canal, tokens Gateway Bearer opcionales y HTTPS.

## Formato de cifrado

Los clientes PushGo admiten AES-GCM. La longitud de la clave determina la variante AES.

| Longitud de clave | Algoritmo | Nonce / IV | Etiqueta de autenticación |
| :--- | :--- | :--- | :--- |
| 16 bytes | AES-128-GCM | 12 bytes | 16 bytes |
| 24 bytes | AES-192-GCM | 12 bytes | 16 bytes |
| 32 bytes | AES-256-GCM | 12 bytes | 16 bytes |

Diseño binario:

```text
[ ciphertext (N bytes) ][ auth tag (16 bytes) ][ nonce / iv (12 bytes) ]
```

Codifique en Base64 el blob binario completo y colóquelo en el campo API `ciphertext`.

## Campos cifrables

Después del descifrado, `ciphertext` debe contener un objeto JSON. Los clientes reconocen los siguientes campos canónicos y los vuelven a escribir en la carga útil de notificación.

### Campos Message

| Campo | Tipo | Comportamiento |
| :--- | :--- | :--- |
| `title` | `string` | Anula el título de la notificación. |
| `body` | `string` | Anula el cuerpo del mensaje. |
| `url` | `string` | Anula la URL de destino. |
| `images` | Cadena `string[]` o JSON | Anula la lista de imágenes. |
| `tags` | Cadena `string[]` o JSON | Anula la lista de etiquetas. |
| `metadata` | Cadena `object` o JSON | Anula los metadatos. |

### Campos Event

| Campo | Tipo | Comportamiento |
| :--- | :--- | :--- |
| `description` | `string` | Anula la descripción del evento. |
| `status` | `string` | Anula el estado del evento. |
| `message` | `string` | Anula el mensaje de evento. |
| `started_at` | `number` | Anula la hora de inicio del evento. |
| `ended_at` | `number` | Anula la hora de finalización del evento. |
| `attrs` | Cadena `object` o JSON | Anula el parche de atributos de eventos. |

### Campos Thing

| Campo | Tipo | Comportamiento |
| :--- | :--- | :--- |
| `primary_image` | `string` | Anula la imagen principal. |
| `state` | `string` | Anula el estado de la entidad. |
| `created_at` | `number` | Anula el tiempo de creación. |
| `deleted_at` | `number` | Anula el tiempo de eliminación. |
| `external_ids` | Cadena `object` o JSON | Anula los ID externos. |
| `location_type` | `string` | Anula el tipo de ubicación. |
| `location_value` | `string` | Anula el valor de ubicación. |
| `location` | Cadena `object` o JSON | Anula el objeto de ubicación. |

:::nota
Los campos necesarios para la prioridad de enrutamiento y entrega, como `channel_id`, `password`, `event_id`, `thing_id`, `event_time`, `observed_at` y `severity`, normalmente deben permanecer en texto sin formato.
:::

## Ejemplo de Python

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

El ejemplo `key_hex` es una clave de 32 bytes para AES-256-GCM. Utilice una clave aleatoria generada de forma segura en producción y configure la misma clave localmente en el cliente.

## Uso de API

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

Los `title` y `body` simples pueden ser una visualización alternativa para clientes sin una clave o cuando falla el descifrado. Coloque contenido verdaderamente confidencial dentro de `ciphertext`.

## Estados de descifrado

| Estado | Significado |
| :--- | :--- |
| `decryptOk` | El descifrado se realizó correctamente y se aplicó al menos un campo. |
| `decryptFailed` | El texto cifrado existe, pero no se pudo descifrar ni analizar. |
| `notConfigured` | El cliente no tiene ninguna clave utilizable configurada. |
| `algMismatch` | El algoritmo configurado no coincide con la carga útil. |

## Solución de problemas

| Problema | Consultar |
| :--- | :--- |
| El descifrado falla | Misma clave, Base64 completo y diseño binario `ciphertext + tag + nonce`. |
| El cliente no anula los campos | El JSON descifrado debe ser un objeto y los nombres de los campos deben ser canónicos. |
| Gateway todavía puede ver el título | Los campos de petición simples no están protegidos por E2EE; Poner títulos sensibles en `ciphertext`. |
| `severity` no está cifrado | Se recomienda esto porque el Gateway y los servicios push de plataforma necesitan información prioritaria. |