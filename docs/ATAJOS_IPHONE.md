# Atajos para iPhone

FinanzApp ofrece una integración separada de Telegram para registrar gastos
desde Atajos de Apple sin abrir la PWA. Cada iPhone utiliza un token revocable
y con alcance limitado a consultar opciones y crear gastos.

## Configuración para el usuario

1. Abrí **FinanzApp → Cuenta → Atajos para iPhone**.
2. Elegí el modo:
   - **Guiado:** solicita monto, comercio, categoría y medio de pago.
   - **Rápido adaptativo:** recibe una frase y solicita únicamente los datos
     que no logra reconocer.
3. Asigná un nombre al dispositivo y tocá **Conectar iPhone**.
4. Copiá la configuración. El token completo se muestra una sola vez.
5. Instalá el Atajo oficial y pegá el token cuando lo solicite.
6. Ejecutalo una vez y aceptá el permiso de conexión con FinanzApp.
7. Opcionalmente asignalo a:
   - **Tocar atrás:** Configuración → Accesibilidad → Tocar → Tocar atrás.
   - **Botón de acción:** Configuración → Botón de acción → Atajo.
   - **Siri:** decí el nombre del Atajo, por ejemplo “Cargar gasto”.

El modo se obtiene del servidor en cada ejecución. Cambiarlo desde FinanzApp no
requiere reinstalar el Atajo.

Para mostrar el botón **Instalar Atajo oficial** en producción, publicá la copia
maestra desde Apple Shortcuts y configurá su enlace mediante
`VITE_IOS_SHORTCUT_URL`. El Atajo compartido no debe contener tokens reales: el
token de cada usuario se introduce localmente durante la instalación.

## Flujo guiado

1. `GET /api/shortcut-capture/context`.
2. Si existe más de un tablero, mostrar `boards` con **Elegir de una lista**.
3. Volver a consultar `context?boardId=<id>` para obtener las opciones de ese
   tablero.
4. Solicitar un número para el monto.
5. Solicitar texto para el comercio.
6. Mostrar `categories` con **Elegir de una lista**.
7. Mostrar `paymentMethods` con **Elegir de una lista**.
8. Mostrar un resumen con **Mostrar alerta**.
9. Generar un UUID v4 y ejecutar `POST /api/shortcut-capture/expenses`.
10. Mostrar la respuesta como notificación.

## Flujo rápido adaptativo

1. `GET /api/shortcut-capture/context`.
2. Solicitar o dictar una frase, por ejemplo:
   `Shell 35000 pesos nafta con Visa`.
3. Ejecutar `POST /api/shortcut-capture/resolve` con `text` y `boardId`.
4. Usar los valores presentes en `suggestion`.
5. Por cada elemento de `missingFields`, solicitar únicamente ese dato:
   - `amount`: número.
   - `merchantName`: texto.
   - `categoryId`: lista `context.categories`.
   - `paymentMethodId`: lista `context.paymentMethods`.
6. Confirmar el resumen y enviar el mismo `POST /expenses` del modo guiado.

El modo adaptativo inicial no usa IA generativa. El parser reconoce formatos de
importe locales, monedas soportadas y coincidencias con categorías y medios de
pago reales. Ante ambigüedad no adivina: devuelve el campo como faltante.

## Autenticación

Todas las llamadas del Atajo deben incluir:

```http
X-FinanzApp-Shortcut-Token: fsa_<token>
```

El token no debe enviarse en la URL. Puede revocarse desde FinanzApp y no sirve
como token de sesión web.

## Cuerpo de creación

```json
{
  "boardId": "...",
  "amount": 35000,
  "merchantName": "Shell",
  "description": "Shell",
  "categoryId": "...",
  "paymentMethodId": "...",
  "currency": "ARS",
  "expenseDate": "2026-09-14T19:00:00-03:00",
  "paymentYearMonth": "2026-09",
  "clientRequestId": "UUID-V4"
}
```

`clientRequestId` debe conservarse al reintentar una misma carga para evitar
duplicados.

`expenseDate` y `paymentYearMonth` son opcionales. Si se omiten, el servidor
usa la fecha/hora actual y deriva el mes de pago de esa fecha. Si el Atajo los
envía, `paymentYearMonth` debe tener formato `AAAA-MM` y puede ser distinto al
mes de `expenseDate` (por ejemplo, un gasto de fin de mes que impacta en el
ciclo del mes siguiente).
