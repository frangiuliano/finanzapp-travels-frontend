# Issue Workflow — FinanzApp Travels Frontend

Este proyecto sigue el estándar definido en
`ai-software-company/standards/issue-workflow.md`.

## Extensiones de este proyecto

- **Scope activo:** `scope:mvp` para shell mobile-first, tableros, captura, reportes e ingresos; `scope:v1` para polish PWA, branding rename, offline.
- **Tipos usados:** `type:foundation` para design system/onboarding shell, `type:feature` para pantallas, `type:chore` para skills/tooling.
- **Repo pareja:** APIs en `frangiuliano/finanzapp-travels-backend`. Referenciar dependencias cross-repo en el body (`backend#N`).
- **UI:** Shadcn + Tailwind; mobile-first / PWA. Usar skills en `.cursor/skills/` (`frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`) al implementar pantallas nuevas.
- **Decisión de producto:** selector de **tablero** (individual/compartido; `everyday` | `travel`); viajes = complemento.

## GLOBAL_BACKLOG (multi-repo) — obligatorio para `/dev siguiente`

- **Puntero local:** `.github/GLOBAL_BACKLOG.md`
- **Canónico:** `../finanzapp-travels-backend/.github/GLOBAL_BACKLOG.md`
- Al elegir el próximo issue, el Developer debe usar el algoritmo
  **A) Producto multi-repo** de `issue-workflow.md` y la tabla `G-NN` del
  canónico (puede indicar un issue del **backend**).
- El `order-NN` local sigue siendo útil dentro del repo; el orden **entre**
  repos lo define `G-NN`.

## Notas

- El número de issue en GitHub no coincide necesariamente con el orden de
  ejecución. Usar `G-NN` (global) o `order-NN` (local).
- El Developer Agent debe leer este archivo antes de elegir el próximo issue.
