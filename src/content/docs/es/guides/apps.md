---
title: Soporte de aplicaciones y plataformas
description: Comprenda los clientes PushGo publicados, los requisitos del sistema y las rutas de entrega de la plataforma.
---
PushGo actualmente publica clientes de plataforma Apple, un cliente de Android y Gateway. Este sitio web solo describe las versiones disponibles públicamente.

## Descripción general de la plataforma

| Plataforma | Descargar | Requisito | Vía de entrega primaria | Transporte privado |
| :--- | :--- | :--- | :--- | :--- |
| iOS | App Store | iOS 18+ | APNs | No |
| macOS | App Store | macOS 15+ | APNs | No |
| watchOS | App Store | watchOS 11+ | APNs | No |
| Android | GitHub Releases | Android 12+ | FCM + transportes privados | Sí, QUIC / Raw TCP / WSS |

## Clientes de Apple

Los clientes de Apple siguen el modelo de inserción del sistema. APNs maneja la entrega en segundo plano.

Buenos ajustes:

- Recibir notificaciones personales en iPhone, Mac y Apple Watch.
- Uso de prioridades de notificación del sistema y extensiones de notificación para contenido enriquecido.
- Mantener el comportamiento del cliente cerca del sistema operativo en lugar de mantener una conexión en segundo plano de larga duración.

Notas:

- Los clientes Apple no utilizan transportes privados Android PushGo.
- La entrega en segundo plano depende del APNs, los permisos de notificación, los modos de enfoque y el estado de la red del dispositivo.
- Los campos E2EE se descifran localmente después de configurar una clave; Si no se configura ninguna clave o falla el descifrado, los clientes mantienen el estado de visualización alternativo.

## Cliente de Android

El cliente de Android admite tanto la entrega del proveedor como el transporte privado PushGo.

Buenos ajustes:

- Sincronización de estado de menor latencia.
- Implementaciones de Gateway autoalojados donde los dispositivos se conectan a su propio punto de entrada de sincronización.
- Despertador FCM combinado con transporte privado cuando se necesita sincronización activa.

Los transportes privados se seleccionan del perfil Gateway y de las condiciones actuales de la red.

| Transporte | Caso de uso |
| :--- | :--- |
| WSS | Más universal; Reutiliza HTTPS y es el mejor transporte privado por defecto. |
| QUIC | Menor latencia cuando los puertos UDP pueden quedar expuestos. |
| Raw TCP | Redes controladas o puntos de entrada de capa 4 dedicados. |

Los transportes privados requieren que el Gateway habilite el transporte coincidente y anuncie los puertos accesibles, los certificados y la URL base pública. Consulte [Autoalojamiento](/es/guides/self-hosting/).

##Gateway

El Gateway es el componente del servidor del PushGo. Eso:

- Valida las contraseñas del canal y los tokens de Gateway opcionales Bearer.
- Acepta peticiones Message, Event y Thing.
- Mantiene el estado del evento y de la entidad.
- Despachos a través de transportes privados APNs, FCM o Android.
- Puede habilitar MCP/OAuth para asistentes de IA que actúan dentro de los alcances del canal autorizado.

Puede utilizar el Gateway público o uno autohospedado para controlar las rutas de datos, la política de autenticación y las operaciones.

## Matriz de capacidades

| Capacidad | manzana | Android | Gateway |
| :--- | :--- | :--- | :--- |
| Reciba Message | Sí | Sí | Despachos |
| Pantalla Event / Thing | Sí | Sí | Estado de almacenes y despachos |
| Descifrado de campo E2EE | Sí | Sí | Retransmite sólo texto cifrado |
| Transporte privado | No | Sí | Requiere punto de entrada privado habilitado |
| MCP/OAuth | N/A | N/A | Opcional |

Si solo desea recibir notificaciones, instale un cliente y siga [Introducción](/es/guides/getting-started/). Si necesita control de ruta de datos y transportes privados, continúe con el autoalojamiento.