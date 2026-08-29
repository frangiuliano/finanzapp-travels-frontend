# Seguridad — FinanzApp Frontend

Checklist vivo para mantener el nivel de seguridad alcanzado tras la remediación de agosto 2026. No es un historial de auditorías (eso vive fuera del repo, en los documentos de planificación del workspace) — es qué revisar y cuándo, y qué reglas seguir al escribir código nuevo.

## Reportar un problema de seguridad

Proyecto personal de un solo mantenedor. Si encontrás algo, avisale directamente al dueño del repositorio.

## Dónde viven los secretos (y dónde no deben vivir)

- Todo lo que empieza con `VITE_` termina en el bundle público que corre en el navegador de cualquiera. **Nunca** pongas ahí una API key con permisos reales — hoy sólo hay `VITE_API_URL` (una ruta relativa) y flags de feature, y así debe seguir.
- `.env` real nunca versionado. `.env.qa.local` (credencial de QA) tampoco debería vivir como archivo dentro de la carpeta del proyecto — moverlo a un gestor de secretos local es una tarea pendiente (ver `HANDOFF_SEGURIDAD_2026-08-28.md` en la raíz del workspace).
- El token de sesión (`accessToken`) vive **sólo en memoria** (`authStore.ts`) — nunca en `localStorage`/`sessionStorage`. Es la defensa principal contra robo de sesión vía XSS. No lo persistas "para comodidad" sin pensar el trade-off de seguridad primero.

## Checklist de mantenimiento recurrente

**Cada vez que aparece un PR de Dependabot:** revisarlo y mergearlo si CI pasa.

**Mensual:**

- Correr `npm audit --omit=dev` a mano como doble chequeo.
- Revisar que la Content-Security-Policy de `vercel.json` siga sin `unsafe-inline`/`unsafe-eval` en `script-src` — es fácil que un nuevo script de terceros "solucione" un problema aflojándola sin darse cuenta.

**Trimestral:**

- Revisar si se agregó algún script o SDK de terceros que necesite un dominio nuevo en la CSP — agregar sólo el dominio exacto, nunca un wildcard amplio.
- Revisar el comportamiento de la cola offline (`offlineExpenseQueue.ts`) contra la política de retención vigente en el plan de seguridad — si cambió el enfoque (auto-purga vs. confirmación explícita), que este archivo y el código coincidan.

## Reglas al escribir código nuevo

- **Cualquier HTML generado dinámicamente (`dangerouslySetInnerHTML`):** sanitizar o validar con una allowlist antes de interpolar, como ya se hace en `chart.tsx`. Nunca interpolar un valor que venga de input de usuario sin pasar por esa validación.
- **Nueva llamada a una API externa desde el cliente:** si necesita una API key, esa key va a quedar pública — evaluar si el llamado debe pasar por el backend en cambio.
- **Nuevo dato sensible que se persiste localmente (IndexedDB, localStorage):** preguntarse qué pasa si el dispositivo se pierde o se comparte. Preferir TTL corto y datos mínimos antes que guardar todo "por si acaso".
- **Nuevo log a consola con un objeto de error:** no volcar el objeto completo si puede contener datos de la request (payload, headers). Usar `error instanceof Error ? error.message : String(error)` como mínimo.
- **Nueva ruta protegida:** que quede dentro del árbol de `<ProtectedApp>` en `App.tsx`. Recordar que esto es sólo UX — el backend es quien realmente aplica el control de acceso.

## Decisiones ya tomadas (no las reviertas sin una razón nueva)

- Access token en memoria, nunca persistido: implica que cada carga de la app necesita red para restablecer la sesión. El trade-off de seguridad es intencional; la continuidad offline se resuelve con un identity snapshot no sensible aparte (ver `src/lib/offlineIdentity.ts` si ya existe, o el punto correspondiente en el handoff si todavía no se implementó).
- CSP estricta en `vercel.json`: sin `unsafe-inline`/`unsafe-eval`, `frame-ancestors: none`, HSTS. No aflojarla para "que ande" un script de terceros sin evaluar una alternativa primero.
- `zod` está instalado pero sin adoptar en formularios — es una decisión pendiente, no una omisión silenciosa; ver el handoff antes de asumir cuál es el estado.
