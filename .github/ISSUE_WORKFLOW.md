# Issue Workflow — FinanzApp Travels Frontend

Este proyecto sigue el estándar definido en
`ai-software-company/standards/issue-workflow.md`.

## Extensiones de este proyecto

- **Scope activo:** `scope:mvp` para shell mobile-first, tableros, captura, reportes e ingresos; `scope:v1` para polish PWA, branding rename, offline.
- **Tipos usados:** `type:foundation` para design system/onboarding shell, `type:feature` para pantallas, `type:chore` para skills/tooling.
- **Repo pareja:** APIs en `frangiuliano/finanzapp-travels-backend`. Referenciar dependencias cross-repo en el body (`backend#N`).
- **UI:** Shadcn + Tailwind; mobile-first / PWA. Usar skills en `.cursor/skills/` (`frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`) al implementar pantallas nuevas.
- **Decisión de producto:** selector de **tablero** (individual/compartido; `everyday` | `travel`); viajes = complemento.

## Notas

- El número de issue en GitHub no coincide necesariamente con el orden de
  ejecución. Usar el label `order-NN` para saber qué tomar primero.
- El Developer Agent debe leer este archivo antes de elegir el próximo issue.
