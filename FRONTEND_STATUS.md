# Frontend Status Report

**Analyzer:** frontend-analyzer
**Date:** 2026-03-01
**Commit:** bb7b0ae (main)

---

## 1. Overview

The frontend is a **React 18 single-page application** for "Cozy Village," a browser-based village simulation game. It is built with Vite 5, uses plain JavaScript (no TypeScript), and lives in a Turborepo monorepo at `apps/web/`. A reusable `@cozy-village/zen-garden` package exists at `packages/zen-garden/`.

The app has no client-side routing, no state management library, no component library, and no test infrastructure. It relies on a custom design system built with CSS variables and paired component CSS files. Audio is fully synthesized via the Web Audio API with no external audio assets.

---

## 2. Technology Stack

| Layer            | Choice                                                         |
| ---------------- | -------------------------------------------------------------- |
| Framework        | React 18.2.0                                                   |
| Build Tool       | Vite 5.0.0                                                     |
| Language         | JavaScript / JSX (no TypeScript)                               |
| Monorepo         | Turborepo (npm workspaces)                                     |
| Package Manager  | npm 10.8.2                                                     |
| Styling          | Plain CSS with CSS variables, per-component CSS files          |
| State Management | React hooks (useState/useEffect/useCallback) — no library      |
| Routing          | None — tab-based navigation via local state                    |
| Testing          | None                                                           |
| Authentication   | None (single-player game, no auth)                             |
| API Transport    | fetch wrapper over REST (`/api` proxied to backend at `:8000`) |

### Dependencies (apps/web)

**Runtime:** react, react-dom, @cozy-village/zen-garden
**Dev:** vite, @vitejs/plugin-react

The dependency footprint is minimal — only 3 runtime dependencies and 2 dev dependencies.

---

## 3. Directory Structure

```
apps/web/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                  # ReactDOM entry point
    ├── App.jsx                   # Root component (242 lines)
    ├── App.css                   # Global theme, CSS variables, layout
    ├── api.js                    # REST API client (87 lines, 30 endpoints)
    ├── components/               # 30 JSX components, 22 CSS files
    │   ├── Header.jsx
    │   ├── ActionBar.jsx
    │   ├── EventLog.jsx
    │   ├── WeatherPanel.jsx
    │   ├── VillagersPanel.jsx
    │   ├── GardenPanel.jsx / GardenPlot.jsx
    │   ├── PetsPanel.jsx / PetCard.jsx
    │   ├── EconomyPanel.jsx
    │   ├── InventoryShelf.jsx
    │   ├── JournalPanel.jsx
    │   ├── ZenGardenPanel.jsx / ZenGardenTile.jsx
    │   ├── ConstellationGazer.jsx
    │   ├── TeaBrewingStation.jsx
    │   ├── AmbientLofiMixer.jsx
    │   ├── LofiPlayer.jsx
    │   ├── FocusTimer.jsx
    │   ├── AmbientSounds.jsx
    │   ├── StarryNight.jsx
    │   ├── CozyFireplace.jsx
    │   ├── WindChimes.jsx
    │   ├── SleepingCat.jsx
    │   ├── SwarmBadge.jsx
    │   ├── Modals: PlantModal, SucculentModal, RockModal, GiftModal, AdoptModal
    │   └── VillagerCard.jsx
    └── hooks/
        └── useAmbientSounds.js   # Web Audio API hook (617 lines)

packages/zen-garden/
├── package.json
└── src/
    ├── index.js
    ├── ZenGarden.jsx             # Interactive canvas-based sand raking
    ├── ZenGarden.css
    ├── components/ToolPalette.jsx
    └── hooks/useRakingCanvas.js
```

---

## 4. Architecture

### 4.1 App Structure

`App.jsx` is the single root component. It manages all top-level state and orchestrates the entire UI:

- **Tab navigation:** A 12-item `TABS` array drives tab buttons; `activeTab` state selects which panel renders via a `switch` statement in `renderPanel()`.
- **Game state:** Fetched from `/api/status` on mount, stored in a single `gameState` useState.
- **Side effects:** Three `useCallback` fetchers (`fetchStatus`, `fetchForecast`, `fetchJournal`) called on mount and after mutations.
- **Toast notifications:** Simple `showToast()` function with a 3-second timeout, passed as a prop to child components.
- **Ambient audio:** `useAmbientSounds` hook instantiated once at the App level, providing sound effect methods (`notify`, `dayAdvance`, `windChime`, `tabSwitch`, `success`).

### 4.2 Navigation (Tab-Based)

There is no routing library. Navigation is handled by 11 tabs rendered as buttons. The `activeTab` string maps to a component in a `switch` statement. There are no URLs, no deep linking, and no browser history integration.

### 4.3 State Management

All state is managed via React hooks in `App.jsx` and individual components:

- **Global state:** `gameState`, `forecast`, `journalEntries`, `activeTab`, `loading`, `advancing`, `toast` — all in App.jsx.
- **Props drilling:** `showToast`, `onRefresh`, and domain data are passed down to panels.
- **Local state:** Each panel/component manages its own UI state (modal visibility, form inputs, animation state).
- **Persistence:** `localStorage` is used in `useAmbientSounds` and `FocusTimer` for user preferences. Error handling around localStorage is inconsistent.

### 4.4 API Layer

`api.js` exports a single `api` object with ~30 methods wrapping `fetch()` calls. The pattern is simple and consistent:

- Base path: `/api` (proxied to `http://localhost:8000` in dev)
- All responses parsed as JSON
- Errors extracted from response body's `detail` field
- No request cancellation, retry logic, or caching
- No API versioning

### 4.5 Styling

- **CSS variables** define the entire design token system in `App.css` (colors, shadows, border radii).
- **Per-component CSS files** (22 files) provide scoped styles, though they are not true CSS Modules — class names are global.
- **Seasonal theming:** Body class (`season-spring`, `season-summer`, etc.) switches background colors.
- **Responsive design:** A single breakpoint at 900px adjusts layout to single-column.
- **Animations:** CSS keyframes (`spin`, `pulse`, `magical-glow`), CSS transitions, and canvas-based animations (fireplace, starry night).
- **Font:** Nunito (Google Fonts).

### 4.6 Ambient / Decorative Layer

Several "always-on" floating components render over the main content:

| Component     | Purpose                                           |
| ------------- | ------------------------------------------------- |
| LofiPlayer    | Synthesized lo-fi radio player                    |
| FocusTimer    | Pomodoro timer with SVG progress ring             |
| AmbientSounds | Context-aware soundscapes (rain, birds, crickets) |
| StarryNight   | Particle-based night sky canvas                   |
| CozyFireplace | CSS/canvas animated fireplace                     |
| WindChimes    | Sound effects triggered by game events            |
| SleepingCat   | Decorative animated cat                           |
| SwarmBadge    | Firefly particle effect                           |

---

## 5. Active Bugs

### 5.1 Duplicate Tab ID — `zen` (HIGH)

**File:** `apps/web/src/App.jsx:35-37`

```javascript
{ id: 'zen', label: 'Zen Garden', emoji: '🧘' },  // line 35
{ id: 'tea', label: 'Tea', emoji: '🍵' },          // line 36
{ id: 'zen', label: 'Zen', emoji: '🪨' },          // line 37 — DUPLICATE
```

Two tabs share the `id: 'zen'`. This causes:

1. The second "Zen" tab button renders but can never show as `active` (React `key` conflict).
2. In `renderPanel()`, the second `case 'zen':` at line 171-172 is dead code — the first `case 'zen':` (line 167-168, `ZenGardenPanel`) always matches.
3. The `ZenGarden` component from `@cozy-village/zen-garden` (the interactive canvas sand-raking experience) is imported but **never reachable**.

### 5.2 Dead `renderPanel` Case (MEDIUM)

**File:** `apps/web/src/App.jsx:171-172`

The second `case 'zen':` returning `<ZenGarden />` is unreachable due to the duplicate case above it. This means the `@cozy-village/zen-garden` package is a dependency that ships in the bundle but can never be rendered.

---

## 6. Technical Debt & Issues

### 6.1 No Tests

There are zero frontend tests. No test runner is configured (no Vitest, Jest, or React Testing Library). There are no test files anywhere in `apps/web/`.

### 6.2 No TypeScript

The entire frontend is plain JavaScript with no type checking. There are no PropTypes either. API contract changes will silently break the UI at runtime.

### 6.3 No Error Boundaries

A single unhandled error in any component will crash the entire application. There are no React Error Boundaries.

### 6.4 No Client-Side Routing

The app has no URL-based navigation. There is no way to deep-link to a specific tab, and the browser back button does not work for tab navigation.

### 6.5 Props Drilling

`showToast` and `onRefresh` are passed through multiple component levels. This is manageable at the current scale but will become unwieldy as features are added.

### 6.6 Sequential API Calls on Load

`App.jsx:80-86` fetches status, forecast, and journal sequentially (`await` one after another). These could be parallelized with `Promise.all()` to reduce initial load time.

### 6.7 `advanceWeek` Makes 7 Sequential API Calls

`App.jsx:107-120` loops 7 times calling `api.advanceDay()` sequentially. This should be a single backend endpoint.

### 6.8 Inline Toast Styles

The toast notification at `App.jsx:229-237` uses inline styles instead of a CSS class, inconsistent with the rest of the codebase.

### 6.9 Global CSS Class Names

CSS files are imported directly (not as CSS Modules), so all class names are global. Name collisions are avoided by convention but not enforced. Components like `.card`, `.btn`, `.grid-2` are shared globally via `App.css`.

### 6.10 Large Components

- `useAmbientSounds.js` — 617 lines (well-encapsulated, but large)
- `AmbientLofiMixer.jsx` — large component with complex audio logic
- `TeaBrewingStation.jsx` — 250+ lines of interactive brewing mechanics

### 6.11 Inconsistent localStorage Error Handling

`useAmbientSounds` wraps localStorage access in try/catch. Other components using localStorage may not, risking runtime errors in private browsing or when storage is full.

---

## 7. Component Inventory

| Component              | Lines (est.) | Purpose                               | Has CSS       |
| ---------------------- | ------------ | ------------------------------------- | ------------- |
| App.jsx                | 242          | Root component, state, tabs, layout   | Yes (App.css) |
| Header.jsx             | —            | Day/season/weather/mood display       | Yes           |
| ActionBar.jsx          | —            | Advance day/week, new game buttons    | Yes           |
| EventLog.jsx           | —            | Sidebar with recent game reports      | Yes           |
| WeatherPanel.jsx       | —            | Weather display, forecast, festivals  | Yes           |
| VillagersPanel.jsx     | —            | Villager list with personality badges | Yes           |
| VillagerCard.jsx       | —            | Individual villager display           | —             |
| GardenPanel.jsx        | —            | Grid-based crop planting/harvesting   | Yes           |
| GardenPlot.jsx         | —            | Single garden tile                    | —             |
| PetsPanel.jsx          | —            | Pet list, adoption, interactions      | Yes           |
| PetCard.jsx            | —            | Individual pet display                | —             |
| EconomyPanel.jsx       | —            | Market prices, buy/sell interface     | Yes           |
| InventoryShelf.jsx     | —            | Categorized item display              | Yes           |
| JournalPanel.jsx       | —            | Text journal with date/season         | Yes           |
| ZenGardenPanel.jsx     | —            | Server-side zen garden management     | Yes           |
| ZenGardenTile.jsx      | —            | Single zen garden tile                | —             |
| ConstellationGazer.jsx | 199          | Seasonal stargazing discovery panel   | Yes           |
| TeaBrewingStation.jsx  | 250+         | Interactive tea brewing               | Yes           |
| CandleWorkshop.jsx     | 265          | Candle crafting with animated flames  | Yes           |
| AmbientLofiMixer.jsx   | Large        | Multi-track audio mixer               | Yes           |
| LofiPlayer.jsx         | —            | Floating lo-fi radio                  | Yes           |
| FocusTimer.jsx         | —            | Pomodoro timer with SVG ring          | Yes           |
| AmbientSounds.jsx      | —            | Context-aware ambient audio           | Yes           |
| StarryNight.jsx        | —            | Canvas particle night sky             | Yes           |
| CozyFireplace.jsx      | —            | Animated fireplace                    | Yes           |
| WindChimes.jsx         | —            | Event-triggered sound effects         | Yes           |
| SleepingCat.jsx        | —            | Decorative animated cat               | Yes           |
| SwarmBadge.jsx         | —            | Firefly particle effect               | Yes           |
| PlantModal.jsx         | —            | Crop selection dialog                 | —             |
| SucculentModal.jsx     | —            | Succulent selection dialog            | —             |
| RockModal.jsx          | —            | Rock selection dialog                 | —             |
| GiftModal.jsx          | —            | Gift giving dialog                    | —             |
| AdoptModal.jsx         | —            | Pet adoption dialog                   | —             |

**Custom Hooks:**

- `useAmbientSounds` (617 lines) — Web Audio API synthesis for all app sounds

**Shared Package:**

- `@cozy-village/zen-garden` — Canvas-based interactive sand raking (currently unreachable due to duplicate tab bug)

---

## 8. API Surface

The frontend consumes 30 REST endpoints from a FastAPI backend:

| Category       | Endpoints                                                                                                                                                       | Methods           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Game           | `/status`, `/advance-day`, `/new-game`                                                                                                                          | GET, POST         |
| Weather        | `/weather`, `/weather/forecast`                                                                                                                                 | GET               |
| Villagers      | `/villagers`, `/villagers/:id`, `/villagers/:id/gift`                                                                                                           | GET, POST         |
| Garden         | `/garden`, `/garden/crops`, `/garden/plant`                                                                                                                     | GET, POST         |
| Pets           | `/pets`, `/pets/adoptable`, `/pets/adopt`, `/pets/:name/pet`, `/pets/:name/feed`, `/pets/:name/play`                                                            | GET, POST         |
| Economy        | `/economy/prices`, `/economy/summary`, `/economy/wallet`, `/economy/buy`, `/economy/sell`, `/inventory`                                                         | GET, POST         |
| Zen Garden     | `/zen-garden`, `/zen-garden/succulents`, `/zen-garden/rocks`, `/zen-garden/place-succulent`, `/zen-garden/place-rock`, `/zen-garden/rake`, `/zen-garden/remove` | GET, POST         |
| Constellations | `/constellations`, `/constellations/all`, `/constellations/discover`, `/constellations/note`                                                                    | GET, POST         |
| Candles        | `/candles`, `/candles/scents`, `/candles/craft`, `/candles/light`, `/candles/extinguish`, `/candles/remove`                                                     | GET, POST         |
| Journal        | `/journal`, `/journal/:id`                                                                                                                                      | GET, POST, DELETE |

---

## 9. Design System

### Color Palette (CSS Variables)

- `--cream: #faf6f0` (background)
- `--sage: #7a9e7e` (primary accent)
- `--tan: #d4b896` (secondary accent)
- `--rose: #c8848a` (tertiary accent)
- `--brown: #4a3728` (text/dark elements)
- `--highlight: #e8a849` (call-to-action)

### Seasonal Themes

- Spring: `#f0f7e8` | Summer: `#faf6e0` | Autumn: `#f7efe0` | Winter: `#e8eef5`

### Primitives

- `.card` — white bg, shadow, rounded corners
- `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-rose` — button variants
- `.badge-*` — personality/mood badges
- `.tab-btn` — tab navigation
- `.modal` / `.modal-overlay` — dialog overlays
- `.grid-2` / `.grid-3` — layout helpers

### Typography

- Font family: Nunito (Google Fonts), sans-serif fallback
- Responsive breakpoint: 900px

---

## 10. Recommendations (Priority Order)

1. **Fix duplicate `zen` tab ID** — Rename the second tab to a unique ID (e.g., `rocks` or `sand`) to make `ZenGarden` reachable.
2. **Add Error Boundaries** — Wrap the panel area and floating widgets to prevent full-app crashes.
3. **Parallelize initial API calls** — Use `Promise.all()` for status/forecast/journal fetches.
4. **Add a backend `advance-week` endpoint** — Replace the 7-call loop in the frontend.
5. **Introduce Vitest** — Vite's native test runner requires minimal configuration.
6. **Consider TypeScript** — Even gradual adoption (`.jsx` → `.tsx`) would catch API contract issues.
7. **Extract toast into React Context** — Eliminate `showToast` props drilling.
8. **Add basic client-side routing** — Even hash-based routing would enable deep linking and browser back/forward.
