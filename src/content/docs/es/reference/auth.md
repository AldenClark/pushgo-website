---
title: Autenticación
description: Comprenda las credenciales del canal, los tokens de Gateway, las claves de compatibilidad y MCP OAuth.
---
La autenticación PushGo depende de la superficie API a la que llame. Primero identifique el modo y luego coloque la credencial en el lugar correcto.

## Modos de autenticación

| Escenario | Credencial requerida | Ubicación | Utilizado por |
| :--- | :--- | :--- | :--- |
| API nativa | `channel_id` + `password` | Cuerpo JSON | `/message`, `/event/*`, `/thing/*` |
| Token privado Gateway | Ficha Bearer | Encabezado `Authorization` | Restringir las llamadas a un Gateway autohospedado |
| Endpoint de compatibilidad | `<channel_id>:<password>` | Ruta o campo de compatibilidad | Migración ntfy, Bark, ServerChan |
| MCP OAuth | Token de acceso OAuth | Gestionado por el cliente MCP | Asistentes de IA y clientes externos |

La autorización Channel y la autorización del Gateway son capas separadas. Si se habilita un token Gateway privado, las peticiones aún necesitan el ID de Channel y la contraseña.

## Autorización Channel

Las API nativas Message, Event y Thing utilizan credenciales de canal en el cuerpo de JSON.

```json
{
  "channel_id": "YOUR_CHANNEL_ID",
  "password": "YOUR_CHANNEL_PASSWORD",
  "title": "Test message"
}
```

| Campo | Descripción |
| :--- | :--- |
| `channel_id` | Canal objetivo. |
| `password` | Contraseña Channel, normalmente de 8 a 128 caracteres. |

La contraseña de Channel controla quién puede escribir en un canal. No es una contraseña de administrador de Gateway y no debe colocarse en repositorios, registros o códigos de interfaz públicos.

## Gateway Bearer Token

Los Gateways autoalojados pueden habilitar la autenticación a nivel de Gateway con `PUSHGO_TOKEN`.

```bash
PUSHGO_TOKEN=replace-with-gateway-token
```

Las peticiones entonces necesitan:

```http
Authorization: Bearer replace-with-gateway-token
```

Ejemplo completo:

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

Restricciones:

- Utilice el nombre de encabezado estándar `Authorization`.
- El tipo Token debe ser `Bearer`.
- La longitud del Token tiene un límite de 4096 caracteres.
- Si `PUSHGO_TOKEN` está vacío, la autenticación de token a nivel de Gateway está deshabilitada.

## Gateways públicos

Los Gateways públicos aún validan el ID y la contraseña de Channel. Los ejemplos de introducción muestran solo la autorización del canal de forma predeterminada. La política de acceso adicional puede depender de la configuración actual del endpoint público.

## Claves de compatibilidad

Los puntos finales de compatibilidad utilizan `<channel_id>:<password>` como `compat_key`.

| Fuente | Ubicación clave |
| :--- | :--- |
| ntfy | `/ntfy/{topic}`, donde `{topic}` es el `compat_key` |
| ServerChan | `/serverchan/{sendkey}`, donde `{sendkey}` es el `compat_key` |
| Bark v1 | `/bark/{device_key}/{body}`, donde `{device_key}` es el `compat_key` |
| Bark v2 | JSON campo `device_key` |

Ejemplo:

```bash
curl -X POST https://gateway.pushgo.dev/ntfy/YOUR_CHANNEL_ID:YOUR_CHANNEL_PASSWORD \
  -H "Title: Backup completed" \
  -d "NAS backup completed"
```

La clave de compatibilidad contiene la contraseña de Channel y debe tratarse como un secreto.

## MCP OAuth

En el modo MCP OAuth, los asistentes de IA no deben pasar contraseñas de canal en llamadas a herramientas. El caudal recomendado es:

1. El cliente MCP se conecta a `https://gateway.example.com/mcp`.
2. El usuario abre un enlace de enlace.
3. El usuario ingresa el ID de Channel y la contraseña y confirma la autorización.
4. El Gateway emite un token OAuth de alcance limitado al cliente MCP.
5. Las llamadas a herramientas utilizan la autorización OAuth para los canales vinculados.

El modo heredado MCP aún puede pasar `password` en cada llamada de herramienta, pero es mejor reservarlo para entornos personales o de confianza. Las integraciones de producción deberían preferir OAuth.

## Recomendaciones de seguridad

- No confirme contraseñas de canales, claves de compatibilidad ni tokens Gateway.
- Utilice HTTPS en producción.
- No codifique contraseñas de canales reales en ejemplos públicos.
- Para Gateways autoalojados, habilite `PUSHGO_TOKEN` y coloque el oyente HTTP detrás de un proxy inverso.
- Para integraciones de asistentes de IA, prefiera MCP OAuth para que el modelo no contenga contraseñas de canal directamente.
- Rotar las contraseñas de Channel y los tokens Gateway de forma independiente; no los establezca en el mismo valor.