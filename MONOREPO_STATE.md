# Monorepo State Summary

**Project:** Cozy Village -- a cozy village life simulator set in Willowbrook
**Monorepo tooling:** Turborepo 2 + npm workspaces
**Node version:** 20+ (via `.nvmrc`)
**Package manager:** npm 10.8.2

---

## Apps

### 1. `apps/api` -- Backend API (`@cozy-village/api`)

- **Language:** Python 3.10+
- **Framework:** FastAPI + Uvicorn
- **Role:** Simulation engine and REST API server powering all game logic
- **Source size:** ~9,400 lines across 18 Python files (including tests)
- **Core modules:**
  - `server.py` -- FastAPI app with 40+ REST endpoints, CORS middleware, in-memory game state
  - `game.py` -- `CozyVillageGame` orchestrator class and `DailyReport` model
  - `villagers.py` -- 6 NPC villagers with personalities, moods, friendship tiers, gift system
  - `weather.py` -- Seasonal temperature cycles, rain/snow/fog, magical events (aurora borealis), festivals
  - `garden.py` -- Grid-based farming with crop growth stages, seasonal planting, crop quality
  - `animals.py` -- 6 adoptable pet species with bonding progression and personality traits
  - `economy.py` -- Market system with supply/demand pricing and seasonal fluctuations
  - `crafting.py` -- Tiered recipe discovery using gathered materials
  - `zen_garden.py` -- Sand raking patterns, succulent/rock placement logic
  - `swarm.py` -- Swarm-related utilities
  - `math_utils.py` -- Minimal math helpers
- **Tests:** 7 test files (`test_animals.py`, `test_economy.py`, `test_game.py`, `test_garden.py`, `test_villagers.py`, `test_weather.py`, `test_zen_garden.py`)
- **Dependencies:** `fastapi`, `uvicorn[standard]`
- **Scripts:** `dev` (uvicorn with reload), `test` (pytest)

### 2. `apps/web` -- Frontend UI (`@cozy-village/web`)

- **Language:** JavaScript (ES modules)
- **Framework:** React 18 + Vite 5
- **Role:** Interactive village UI -- the main player-facing application
- **Components:** 27 component files in `src/components/`, including:
  - Game panels: `WeatherPanel`, `VillagersPanel`, `GardenPanel`, `PetsPanel`, `EconomyPanel`, `InventoryShelf`, `JournalPanel`, `ZenGardenPanel`, `TeaBrewingStation`
  - Ambient/cozy features: `AmbientLofiMixer`, `LofiPlayer`, `AmbientSounds`, `CozyFireplace`, `StarryNight`, `WindChimes`, `SleepingCat`, `FocusTimer`
  - UI structure: `Header`, `ActionBar`, `EventLog`, `SwarmBadge`, `DailyEntry`
  - Modals: `AdoptModal`, `GiftModal`, `PlantModal`, `RockModal`
- **Tabs:** Weather, Villagers, Garden, Pets, Economy, Shelf, Journal, Zen Garden, Tea, Mixer
- **Internal dependency:** `@cozy-village/zen-garden` package
- **Scripts:** `dev` (vite), `build` (vite build), `preview` (vite preview)

### 3. `apps/beta` -- Beta App (`@cozy-village/beta`)

- **Language:** JavaScript (ES modules)
- **Framework:** React 18 + Vite 5
- **Role:** New application scaffolded by agent beta
- **Description:** A Vite + React application configured to run on port 5175.
- **Scripts:** `dev` (vite), `build` (vite build), `preview` (vite preview)

### 4. `apps/cozy-companion` -- Cozy Companion (`@cozy-village/cozy-companion`)

- **Language:** JavaScript (ES modules)
- **Framework:** React 18 + Vite 5
- **Role:** Standalone wellness and focus companion app
- **Description:** A multi-tab app with a companion display, mood selector, focus timer, gentle reminders, personal journal, and settings panel. Built on the shared `@cozy-village/ui` component library.
- **Components:** `CompanionDisplay`, `MoodSelector`, `FocusTimer`, `GentleReminders`, `JournalPanel`, `SettingsPanel`, `MessageLog`, `StudyTimer`, `Companion`
- **Tabs:** Home, Journal, Settings
- **Internal dependency:** `@cozy-village/ui` package
- **Scripts:** `dev` (vite), `build` (vite build), `preview` (vite preview)

### 5. `apps/mood-journal` -- Mood Journal (`@cozy-village/mood-journal`)

- **Language:** JavaScript (ES modules)
- **Framework:** React 18 + Vite 5
- **Role:** Standalone mood tracking companion app
- **Description:** Simple single-page app with a mood picker (6 moods: Happy, Calm, Sad, Frustrated, Tired, Excited). Branded as "Part of the Cozy Village universe."
- **Status:** Minimal -- single component, no API integration, no persistence
- **Scripts:** `dev` (vite), `build` (vite build), `preview` (vite preview)

---

## Packages

### 1. `packages/ui` -- Shared UI Component Library (`@cozy-village/ui`)

- **Type:** Reusable React component library (ES module)
- **Entry point:** `src/index.js`
- **Contents:** 14 pastel-themed components with paired CSS files, plus a design token file (`tokens.css`)
- **Components:** PastelButton, PastelCard, PastelBadge, PastelInput, PastelTextarea, PastelToggle, PastelProgress, PastelModal, PastelToast, PastelAvatar, PastelTooltip, PastelDivider, PastelSelect, PastelTabs
- **Peer dependency:** React 18
- **Used by:** `@cozy-village/cozy-companion`

### 2. `packages/zen-garden` -- Zen Garden Component (`@cozy-village/zen-garden`)

- **Type:** Reusable React component library (ES module)
- **Entry point:** `src/index.js`
- **Contents:** `ZenGarden.jsx` + `ZenGarden.css`, plus `src/components/` and `src/hooks/` subdirectories
- **Features:** Interactive canvas-based zen garden with rake patterns, succulent/rock placement, and tool palette
- **Peer dependency:** React 18

### 3. `packages/utils` -- Shared Utilities (`@cozy-village/utils`)

- **Type:** Utility library
- **Contents:** `greet.js` (greeting generator), `shuffle.js` (Fisher-Yates shuffle), `hello.js` (console utility), `weather.js` (deterministic weather forecast generator using seeded PRNG / mulberry32)
- **No framework dependencies**

---

## Root-Level Modules

### `src/logger.ts` -- Standardized Logger

- **Type:** TypeScript utility module
- **Exports:** `Logger` class, `createLogger` factory, `LogLevel` enum, `LogEntry` interface, `LogTransport` type
- **Features:** Configurable log levels (DEBUG/INFO/WARN/ERROR/SILENT), pluggable transports, child loggers with context chaining, dynamic level changes at runtime
- **Default transport:** `Logger.consoleTransport` -- routes to `console.debug/info/warn/error`
- **Tests:** `tests/logger.test.ts` -- 46 unit tests via Vitest
- **Documentation:** `docs/logging.md`

---

## Workspace Configuration

| File | Purpose |
|------|---------|
| `package.json` | Root workspace definition (`apps/*`, `packages/*`) |
| `turbo.json` | Turborepo pipeline -- `build`, `dev`, `test`, `lint` tasks |
| `.prettierrc` | Code formatting config |
| `.editorconfig` | Editor settings |
| `.nvmrc` | Node.js version pin (20) |

## Existing Documentation

| File | Description |
|------|-------------|
| `README.md` | Project overview, structure, setup instructions, game systems |
| `CONTRIBUTING.md` | Contribution guidelines |
| `MONOREPO_STATE.md` | This file -- monorepo inventory and state summary |
| `BACKEND_STATUS.md` | Backend implementation status and details |
| `FRONTEND_STATUS.md` | Frontend implementation status and details |
| `TEA_RECIPES.md` | Tea recipe content for the tea brewing feature |
| `CLAUDE_TEST.md` | Test marker file |
| `docs/logging.md` | Logger utility API documentation |

---

*Updated by agent gamma*
