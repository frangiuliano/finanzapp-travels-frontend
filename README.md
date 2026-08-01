# FinanzApp Travels — Frontend

PWA mobile-first para tableros de finanzas cotidianas y viajes compartidos.

## Requisitos

- Node.js 22+
- Backend en `../finanzapp-travels-backend` (API en `http://localhost:8080`)

## Desarrollo local

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173` y proxea `/api` al backend.

### Variables de entorno

| Variable              | Descripción                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `VITE_API_URL`        | URL base de la API (opcional; por defecto usa el proxy `/api`)   |
| `VITE_USE_HTTPS=true` | Habilita HTTPS en dev (necesario para probar PWA con `basicSsl`) |

## PWA — instalación y pruebas

### Build de preview (HTTPS recomendado para PWA)

```bash
npm run build
npm run preview
```

Para probar el service worker en desarrollo:

```bash
VITE_USE_HTTPS=true npm run dev
```

### Android (Chrome)

1. Abrí la app en Chrome (HTTPS o `localhost`).
2. Iniciá sesión; en la barra inferior debería aparecer el banner **Instalar FinanzApp** (o usá el menú ⋮ → **Instalar app** / **Agregar a pantalla de inicio**).
3. Tras instalar, abrí la app desde el ícono del launcher.
4. Verificá que el botón central **Captura** en la bottom nav abre `/capture` en un toque.

### iOS (Safari) — limitaciones

Safari **no** expone el evento `beforeinstallprompt`. La app muestra instrucciones para **Agregar a inicio** (Compartir → Agregar a inicio).

| Funcionalidad                                | Android Chrome         | iOS Safari (A2HS)                                |
| -------------------------------------------- | ---------------------- | ------------------------------------------------ |
| Instalación en pantalla de inicio            | Sí (prompt nativo)     | Sí (manual, sin prompt)                          |
| Modo standalone (sin barra del navegador)    | Sí                     | Sí                                               |
| Service worker / actualizaciones automáticas | Sí                     | Parcial (SW limitado; updates menos predecibles) |
| Captura desde bottom nav                     | Sí                     | Sí                                               |
| Cola offline de gastos                       | No (issue v1 separado) | No                                               |

**Notas iOS:**

- Usá Safari; Chrome/Firefox en iOS no permiten A2HS con la misma fiabilidad.
- Tras agregar a inicio, abrí la app desde el ícono (no desde una pestaña de Safari).
- Las notificaciones push y la instalación automática no están soportadas en este issue.

### Actualizaciones del service worker

Cuando hay una nueva versión desplegada, aparece un toast **Hay una nueva versión disponible** con botón **Actualizar**. El SW usa `autoUpdate` y no cachea respuestas de `/api` para no interferir con la autenticación.

### Lighthouse

Con `npm run build && npm run preview`, ejecutá Lighthouse (PWA + Performance) en Chrome DevTools contra la URL de preview.

## Scripts

| Comando           | Descripción                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Servidor de desarrollo Vite     |
| `npm run build`   | Typecheck + build de producción |
| `npm run preview` | Sirve el build local            |
| `npm run lint`    | ESLint                          |

## Stack

React 19 · Vite 7 · TypeScript · Tailwind CSS 4 · Shadcn UI · Zustand · React Router 7 · vite-plugin-pwa
