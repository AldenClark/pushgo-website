---
title: Límites y errores
description: Límites compartidos de PushGo Gateway, sobre de respuesta, códigos de estado y puntos de entrada de solución de problemas.
---
Esta página resume las reglas compartidas entre las API. Los campos obligatorios, el comportamiento del ciclo de vida y la semántica específica del modelo aún pertenecen a cada página de API.

## Límites compartidos

| Elemento | Límite |
| :--- | :--- |
| Solicitar tamaño del cuerpo | Máximo 32 KB. |
| ID generados por el Gateway | 32 caracteres hexadecimales en minúscula. |
| Contraseña Channel | Generalmente entre 8 y 128 caracteres. |
| `op_id` | 1-128 caracteres; letras, dígitos, `_`, `:`, `-`. |
| `thing_id` / `event_id` | 1-64 caracteres; letras, dígitos, `_`, `:`, `-`. |
| `images` | Hasta 32 URL, con un máximo de 2048 caracteres cada una. |
| `tags` | Hasta 32 etiquetas, con un máximo de 64 caracteres cada una, recortadas y deduplicadas. |
| `metadata` | Solo valores escalares; clave máx. 64, valor escalar no vacío máx. 512; sin objetos anidados ni arrays. |
| `attrs` | Patch de objeto; `null` elimina una clave; arrays y anidación profunda se rechazan. |
| `ttl` y marcas de tiempo API | Donde esté documentado, acepta segundos o milisegundos Unix y normaliza a milisegundos. |
| Campos desconocidos | Los argumentos de las herramientas nativas Message, Event, Thing y MCP son estrictos; los campos desconocidos devuelven 400. |

## Sobre de respuesta

Éxito:

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

Fracaso:

```json
{
  "success": false,
  "data": null,
  "error": "human readable message",
  "error_code": "machine_readable_code"
}
```

La automatización debería preferir `success` y `error_code` al texto `error` en lenguaje natural.

## Significado de `accepted`

`success=true` significa que Gateway procesó la petición. `accepted=true` significa que entró en despacho.

No garantiza:

- Todos los dispositivos están en línea.
- APNs o FCM ha mostrado una notificación.
- Transporte privado Android entregado en tiempo real.
- El usuario no se ve afectado por los permisos de notificación, el modo de enfoque o la política de batería.

Trate el `accepted` como el estado de aceptación y envío del Gateway, no como un recibo de visualización del dispositivo final.

## Códigos de estado comunes de HTTP

| Estado | Significado | Razón típica | Qué hacer |
| :--- | :--- | :--- | :--- |
| `200` | Gateway procesó la petición | `success=true`, pero aún así verifique `accepted` | Almacene los ID devueltos y `op_id`. |
| `400` | La validación falló | Falta campo obligatorio, campo desconocido, formato incorrecto | Compare el JSON con la tabla de campos API. |
| `401` | Error de autenticación Gateway | El Gateway privado usa `PUSHGO_TOKEN`; Falta el token Bearer o es incorrecto | Verifique `Authorization: Bearer <token>`. |
| `404` | Falta objetivo | El Channel, el Event o el Thing no existe | Compruebe `channel_id`, `event_id`, `thing_id`. |
| `413` | El cuerpo de la petición es demasiado grande | JSON supera los 32 KB | Utilice URL de imágenes; reducir metadatos o atributos. |
| `503` | Envío no aceptado en su totalidad | Proveedor, transporte privado, cola o downstream no disponible | Inspeccione los registros, las estadísticas y la capacidad de la cola del Gateway. |

## Solución de problemas por escenario

### Solicitar devoluciones 400

- JSON debe ser válido.
- No envíe `event_id` a `/event/create` o `thing_id` a `/thing/create`.
- Eliminar campos desconocidos.
- `severity` debe ser `critical`, `high`, `normal` o `low`.
- `attrs` debe ser un parche de objeto, no una matriz o una estructura profundamente anidada.

### Solicitar devoluciones 401

- Comprobar si el Gateway privado tiene `PUSHGO_TOKEN`.
- El encabezado debe ser `Authorization: Bearer <token>`.
- No confunda la contraseña de Channel con el token Gateway.
- Asegúrese de que el proxy inverso no elimine los cabeceras de autorización.

### La petición se realizó correctamente pero el dispositivo no notifica

- El cliente debe estar suscrito al canal.
- El permiso de notificación del dispositivo debe estar habilitado.
- La entrega de Apple puede verse afectada por APNs, los modos de enfoque y la configuración del sistema.
- Los clientes de Android deben poder recuperar el `/gateway/profile` correcto.
- Los puertos de transporte privados, los certificados y las direcciones externas deben ser accesibles.
- Los registros de Gateway pueden mostrar errores de proveedor o de envío privado.

### Transporte privado no disponible

- Debe estar habilitado `PUSHGO_PRIVATE_TRANSPORTS`.
- Se debe poder acceder a WSS a través del dominio HTTPS.
- El puerto UDP QUIC puede estar bloqueado por un firewall o proxy.
- Raw TCP debe manejar TLS o la descarga de TLS correctamente.
- Los puertos anunciados y los puertos de enlace reales pueden diferir detrás de NAT o asignación de puertos.

### Error de enlace de MCP

- Debe estar habilitado `PUSHGO_MCP_ENABLED`.
- `PUSHGO_PUBLIC_BASE_URL` debe ser una URL HTTPS externa.
- El proxy inverso debe reenviar `/.well-known/*`, `/oauth/*` y `/mcp`.
- DCR debe coincidir con la capacidad del cliente.
- Las sesiones de página vinculada pueden caducar.

## Páginas relacionadas

- [Autenticación](/es/reference/auth/)
- [API Message](/es/reference/api-message/)
- [API Event](/es/reference/api-event/)
- [API Thing](/es/reference/api-thing/)
- [Autoalojamiento](/es/guides/self-hosting/)
