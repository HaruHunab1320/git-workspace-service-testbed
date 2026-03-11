# Current State Report — Cozy Village

## Architecture Overview

### Classification

The repository is a **polyglot monorepo** managed by **Turborepo** with **npm workspaces**. It contains **5 distinct applications** and **3 shared packages**, plus a small root-level `src/` directory with miscellaneous shared code.

### Technology Stack

| Layer | Technology |
|-------|------------|
| Monorepo orchestration | Turborepo v2 |
| Package management | npm workspaces (npm 10.8.2) |
| Backend framework | FastAPI (Python) with Uvicorn |
| Frontend framework | React 18 with Vite 6 |
| Testing | Vitest (JS/TS), Pytest (Python) |
| Linting & formatting | ESLint 9, Prettier 3 |
| Language | Python 3 (backend), JavaScript/JSX (frontend), TypeScript (shared utilities) |

### Applications

| # | Path | Package Name | Type | Stack | Entry Point | Description |
|---|------|-------------|------|-------|-------------|-------------|
| 1 | `/apps/api/` | `@cozy-village/api` | Backend API | Python, FastAPI, Uvicorn | `server.py` | REST API exposing game state and mutations for weather, villagers, garden, pets, economy, crafting, zen garden, candles, constellations, and more. Contains 14 domain modules and 13 test files. |
| 2 | `/apps/web/` | `@cozy-village/web` | Frontend SPA | React, Vite | `src/main.jsx` | Primary game client with 30+ UI components spanning all game features (weather, villagers, garden, pets, economy, crafting, tea, candles, zen garden, constellations, lofi mixer, ambient sounds, fireplace, wind chimes). |
| 3 | `/apps/cozy-companion/` | `@cozy-village/cozy-companion` | Frontend SPA | React, Vite | `src/main.jsx` | Standalone wellness companion app with mood tracking, focus timer, gentle reminders, daily check-in, journal, and settings. Uses the shared Pastel UI design system. |
| 4 | `/apps/mood-journal/` | `@cozy-village/mood-journal` | Frontend SPA | React, Vite | `src/main.jsx` | Lightweight mood journaling app with emoji-based mood selection. No shared package dependencies. |
| 5 | `/apps/beta/` | `@cozy-village/beta` | Frontend SPA | React, Vite | `src/main.jsx` | Placeholder scaffold app with no implemented functionality beyond a welcome message. |

### Shared Packages

| # | Path | Package Name | Type | Description | Consumed By |
|---|------|-------------|------|-------------|-------------|
| 1 | `/packages/ui/` | `@cozy-village/ui` | React component library | Pastel design system exporting 14 reusable components (Button, Card, Badge, Input, Textarea, Toggle, Progress, Modal, Toast, Avatar, Tooltip, Divider, Select, Tabs) plus design tokens CSS. | `cozy-companion` |
| 2 | `/packages/zen-garden/` | `@cozy-village/zen-garden` | React feature package | Interactive zen garden component with a raking canvas hook (`useRakingCanvas`) and tool palette. | `web` |
| 3 | `/packages/utils/` | `@cozy-village/utils` | Utility library | Small JavaScript utility functions: `greet.js`, `shuffle.js`, `starfield.js`, `weather.js`. | No explicit consumers detected |

### Root-Level Shared Code

| Path | Language | Description |
|------|----------|-------------|
| `/src/features/cozy_core.py` | Python | Shared game logic module |
| `/src/logger.ts` | TypeScript | Logging utility |
| `/src/services/cozyGreetingService.js` | JavaScript | Greeting service |
| `/tests/` | Mixed | Root-level test suite (7 files covering components, services, e2e, and Python features) |
| `/docs/` | Markdown | Feature documentation (4 files) |

> **Note:** The root `/src/` directory sits outside the `apps/` and `packages/` workspace globs and lacks its own dependency manifest. It is classified as miscellaneous shared code rather than a standalone app.

### Dependency Graph

```
┌─────────────────────┐
│     apps/web        │──────────► packages/zen-garden
│  (primary client)   │──(HTTP)──► apps/api
└─────────────────────┘

┌─────────────────────┐
│ apps/cozy-companion │──────────► packages/ui
└─────────────────────┘

┌─────────────────────┐
│  apps/mood-journal  │  (standalone, no internal deps)
└─────────────────────┘

┌─────────────────────┐
│     apps/beta       │  (standalone, no internal deps)
└─────────────────────┘

┌─────────────────────┐
│   packages/utils    │  (standalone, no detected consumers)
└─────────────────────┘
```

### Notable Observations

- **No Dockerfiles** exist anywhere in the repository; deployment/containerization is not configured.
- **No CI/CD pipeline** configuration files were found within `.github/`.
- The API backend (`/apps/api/`) and frontend apps communicate over HTTP (CORS configured for `localhost:5173` and `localhost:3000`).
- The API domain is rich: 14 Python modules covering game state, villagers, garden, zen garden, animals, weather, economy, crafting, candles, constellations, swarm logic, cozy sessions, math utilities, and error handling.

---

## Component Maturity Matrix

*Pending evaluation by agent beta.*

---

## Summary of Readiness

*Pending synthesis by agent gamma.*
