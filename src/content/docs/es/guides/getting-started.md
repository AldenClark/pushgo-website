---
title: Empezando
description: Instale un cliente, cree un canal y reciba su primera notificación PushGo.
---
Esta guía es para usuarios nuevos de PushGo. Al final, tendrá un canal utilizable y una petición HTTP funcional que envía su primer Message.

## Requisitos previos

- Un dispositivo con un cliente PushGo publicado instalado.
- Un terminal que pueda ejecutar `curl`.
- Un ID de canal y una contraseña de canal. Puedes crear un nuevo canal en el cliente o suscribirte a uno compartido por otro dispositivo.

## 1. Instalar un cliente

Instale uno de los clientes lanzados.

| Plataforma | Descargar | Requisito |
| :--- | :--- | :--- |
| iOS/macOS/watchOS | [Tienda de aplicaciones](https://apps.apple.com/app/pushgo) | iOS 18+, macOS 15+, watchOS 11+ |
| Android | [Lanzamientos de GitHub](https://github.com/AldenClark/pushgo-android/releases) | Android 9+ |

## 2. Cree o suscríbase a un Channel

Un canal es el límite de escritura PushGo. Las peticiones van a un canal y los dispositivos suscritos se convierten en objetivos de entrega.

### Crear un nuevo Channel

1. Abra el cliente.
2. Utilice la acción agregar.
3. Elija crear canal.
4. Ingrese un nombre reconocible y una contraseña de 8 a 128 caracteres.
5. Guarde el ID y la contraseña de Channel generado.

### Suscríbete a un Channel existente

1. Abra el cliente.
2. Elija el canal de suscripción.
3. Ingrese el ID de Channel y la contraseña.
4. Después de la suscripción, el dispositivo recibirá contenido para ese canal.

## 3. Elija un Gateway público

Los Gateways públicos son útiles para realizar pruebas sin implementar un servidor.

| Región | Gateway |
| :--- | :--- |
| Mundial | `https://gateway.pushgo.dev` |
| China continental | `https://gateway.pushgo.cn` |

Elija la región más cercana a usted y a sus dispositivos receptores. Si usted mismo aloja, reemplace la URL de ejemplo con su propia URL de Gateway. Si su Gateway usa `PUSHGO_TOKEN`, agregue `Authorization: Bearer <token>`.

## 4. Envía el primer Message

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

Una respuesta exitosa se parece a:

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

`success=true` significa que Gateway aceptó la petición. `accepted=true` significa que entró en despacho; La visualización de la notificación final aún depende del estado del dispositivo, los servicios push de la plataforma y el estado del transporte privado.

## Problemas comunes

| Síntoma | Consultar |
| :--- | :--- |
| Respuesta `400` | Validez de JSON, nombres de campos y `title`, `channel_id`, `password` requeridos. |
| Respuesta `401` | Privadas Gateway `PUSHGO_TOKEN` y `Authorization: Bearer <token>`. |
| Respuesta `404` | ID de Channel y si el dispositivo creó o se suscribió al canal. |
| `success=true` pero sin notificación | Permiso de notificación del dispositivo, estado de la red, transporte privado de Android, entrega APNs/FCM. |
| Carga útil demasiado grande | El cuerpo máximo del JSON es 32 KB; utilice URL de imágenes en lugar de incrustar datos binarios. |

Consulte [Límites y errores](/es/reference/limits-errors/) para obtener más códigos de estado.

## Próximos pasos

- Para comprender por qué PushGo tiene tres modelos, lea [Conceptos básicos](/es/guides/concepts/).
- Para elegir Message, Event o Thing, lea [Modelos de datos](/es/guides/data-models/).
- Para integrar scripts reales, lea [Casos de uso](/es/guides/use-cases/).
- Para ejecutar su propio Gateway, lea [Autoalojamiento](/es/guides/self-hosting/).
