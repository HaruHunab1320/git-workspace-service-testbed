# NERV COMMAND CENTER UI — OPERATIONS MANUAL

```
=====================================================
  CLASSIFIED — NERV HEADQUARTERS — TOKYO-3
  DOCUMENT: MAGI SYSTEM INTERFACE MANUAL
  CLEARANCE: LEVEL 5 — COMMAND STAFF ONLY
  STATUS: ACTIVE
=====================================================
```

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Visual Identity](#visual-identity)
5. [Component Reference](#component-reference)
6. [Standard Operating Procedure — `useNervStore` API](#standard-operating-procedure--usenervstore-api)
7. [Terminal Commands](#terminal-commands)
8. [Testing Protocol](#testing-protocol)
9. [File Structure](#file-structure)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

The NERV Command Center UI is a high-stability dashboard interface built with **React**, **TypeScript**, and **Tailwind CSS**. It reconstructs the MAGI System monitoring interface used by NERV headquarters for Evangelion operations, Angel threat detection, and command consensus management.

### Technology Stack

| Layer          | Technology                  |
| -------------- | --------------------------- |
| Framework      | React 18+ with TypeScript   |
| Styling        | Tailwind CSS                |
| State          | Zustand                     |
| Testing        | Jest + React Testing Library|
| Build          | Vite                        |

---

## Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or equivalent package manager)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nerv-command-center

# Install dependencies
npm install

# Start the development server
npm run dev
```

The UI will be available at **http://localhost:5173** by default (Vite dev server).

### Available Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the development server             |
| `npm run build`   | Create a production build in `dist/`     |
| `npm run preview` | Preview the production build locally     |
| `npm run test`    | Run the Jest test suite                  |
| `npm run lint`    | Run the linter                           |

---

## Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      App.tsx                            │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ MagiDashboard│ │ SyncMonitor  │ │  GeoFrontMap     │ │
│  │  (Unit-01)   │ │  (Unit-02)   │ │  (Unit-03)       │ │
│  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │
│         │                │                   │           │
│         └────────────────┼───────────────────┘           │
│                          │                               │
│                ┌─────────▼──────────┐                    │
│                │   useNervStore     │                    │
│                │    (Zustand)       │                    │
│                │    (Unit-05)       │                    │
│                └─────────▲──────────┘                    │
│                          │                               │
│               ┌──────────┴───────────┐                   │
│               │    NervTerminal      │                   │
│               │     (Unit-04)        │                   │
│               └──────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **`useNervStore`** is the single source of truth for all application state. It is implemented with Zustand and accessed via the `useNervStore` hook.
2. **Components** subscribe to the store and reactively update when state changes.
3. **`NervTerminal`** provides a command-line interface that dispatches actions to the store, enabling operator control of the system state.
4. **`MagiDashboard`** reads MAGI votes from the store and computes consensus in real-time.
5. **`SyncMonitor`** reads the sync ratio and emergency level, adjusting its visualization accordingly.
6. **`GeoFrontMap`** renders an SVG hexagonal grid whose colors respond to the current emergency level.

---

## Visual Identity

The NERV Command Center UI follows the **Terminal-Retro** aesthetic — a dark, high-contrast interface inspired by the MAGI supercomputer systems.

### Color Palette

| Name           | Hex Code    | CSS Variable / Tailwind             | Usage                                   |
| -------------- | ----------- | ------------------------------------ | --------------------------------------- |
| Deep Black     | `#050505`   | `bg-[#050505]`                       | Primary background for all panels       |
| NERV Red       | `#FF3300`   | `text-[#FF3300]`, `border-[#FF3300]` | Primary text, active/positive states, critical alerts |
| Warning Orange | `#FF9900`   | `text-[#FF9900]`, `border-[#FF9900]` | Borders, warnings, alert/rejected states|

### Typography

- **Font Family:** `Share-Tech-Mono` is used for **all** text across the UI. Import via Google Fonts or include locally.
- **Sizing:** Use Tailwind's standard sizing scale (`text-xs` through `text-4xl`).
- **Casing:** UI labels and headings should use UPPERCASE for the brutalist Terminal-Retro feel.

### UI Patterns

All components follow these styling conventions:

```
┌─ border-1 border-[#FF9900] ──────────────────────┐
│  bg-[#050505]                                     │
│  text-[#FF3300] font-['Share-Tech-Mono']          │
│                                                   │
│  Content area with NERV Red text on Deep Black     │
│  background. Orange border frames each panel.      │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Tailwind class pattern for all panels:**
```html
<div class="bg-[#050505] text-[#FF3300] border border-[#FF9900] font-['Share-Tech-Mono'] p-4">
  <!-- Panel content -->
</div>
```

### Visual States

| State       | Text Color   | Border Color | Special Effect               |
| ----------- | ------------ | ------------ | ---------------------------- |
| NORMAL      | `#FF3300`    | `#FF9900`    | None                         |
| ALERT       | `#FF9900`    | `#FF9900`    | Amber text for warnings      |
| EMERGENCY   | `#FF3300`    | `#FF3300`    | Pulsing red animation        |

---

## Component Reference

### `MagiDashboard` — `src/components/MagiDashboard.tsx`

The MAGI supercomputer voting interface. Displays the three MAGI components and their consensus decision.

**MAGI Components:**
- **MELCHIOR-1** — The Scientist personality
- **BALTHASAR-2** — The Mother personality
- **CASPER-3** — The Woman personality

**Consensus Logic (2/3 majority):**
```
IF (2 or more of 3 votes are TRUE)
  → magiStatus = 'AGREE'
  → Display "[SYSTEM_REPORT] PRIORITY: APPROVED" in NERV Red (#FF3300)
ELSE
  → magiStatus = 'DISAGREE'
  → Display "[SYSTEM_REPORT] PRIORITY: REJECTED" in Warning Orange (#FF9900)
```

Each MAGI component displays its current vote state (APPROVE / REJECT) and contributes to the overall consensus calculation. The consensus result element uses `data-testid="consensus-result"` for test targeting.

**Store Dependencies:** `magiVotes.melchior`, `magiVotes.balthasar`, `magiVotes.casper`, `magiStatus`

---

### `SyncMonitor` — `src/components/SyncMonitor.tsx`

Evangelion sync-ratio monitoring widget with animated vertical progress bars.

**Behavior:**
- Displays per-pilot `syncRatios` values (0–100) as vertical progress bars.
- Bar height corresponds directly to the sync ratio percentage for each pilot.
- Under normal conditions, bars render in NERV Red (`#FF3300`).
- When `emergencyLevel` is `'EMERGENCY'`, bars **pulse** with a CSS animation.
- When `systemAlerts` is populated, an Emergency overlay is rendered.

**Store Dependencies:** `syncRatios`, `emergencyLevel`, `systemAlerts`

---

### `GeoFrontMap` — `src/components/GeoFrontMap.tsx`

SVG-based hexagonal grid visualization of the GeoFront underground facility.

**Behavior:**
- Renders a 9x7 flat-top hexagonal SVG grid using `<polygon>` elements.
- An elliptical dome mask (`isInDome()`) differentiates interior GeoFront sectors from exterior sectors.
- Uses `hex-coordinates` as the primary key for state updates.
- Pulls real-time EVA positions from the `useNervStore`.
- Dome (interior) hexagons toggle color based on `emergencyLevel`:
  - `NORMAL` → NERV Red fill (`#FF3300`) with glow filter
  - `ALERT` → Orange fill (`#FF9900`)
  - `EMERGENCY` → Orange fill (`#FF9900`) with orange glow filter and pulsing opacity animation
- Exterior hexagons render at reduced opacity with muted background colors.
- A center "GEOFRONT" label is overlaid on the SVG.

**Store Dependencies:** `emergencyLevel`, `syncRatios`

---

### `NervTerminal` — `src/components/NervTerminal.tsx`

Command-line terminal interface for NERV operators.

**Behavior:**
- Displays a boot sequence on initialization (MAGI uplink messages).
- Presents a scrollable terminal output area and a text input field.
- Processes mock commands and displays responses in the terminal log.
- Supports command history navigation via Arrow Up/Down keys.

See [Terminal Commands](#terminal-commands) for the full command reference.

**Store Dependencies:** All store state (read/write)

---

## Shared Data Interface — `Pilot`

All pilot and EVA data must follow the `Pilot` interface defined in `src/types/nerv.d.ts`:

```typescript
interface Pilot {
  id: string;
  name: string;
  syncRate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BERSERK';
}
```

This interface is the single source of truth for pilot data across all components. Use it whenever referencing pilot records in the store, components, or tests.

---

## Standard Operating Procedure — `useNervStore` API

The global state is managed by a Zustand store exported from `src/store/useNervStore.ts`. The store exports a single hook: `useNervStore`.

### State Shape

```typescript
interface NervState {
  // Current threat level of the facility
  emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY';

  // Per-pilot synchronization ratios (keyed by pilot ID)
  syncRatios: Record<string, number>;

  // MAGI supercomputer consensus status
  magiStatus: 'AGREE' | 'DISAGREE' | 'CONFLICT';

  // MAGI supercomputer voting state (individual votes)
  magiVotes: {
    melchior: boolean;   // MELCHIOR-1 vote
    balthasar: boolean;  // BALTHASAR-2 vote
    casper: boolean;     // CASPER-3 vote
  };

  // Active system alerts (populated triggers Emergency overlay)
  systemAlerts: string[];

  // Angel detection flag — set via triggerAngelDetected()
  angelDetected: boolean;
}
```

### Default State

```typescript
{
  emergencyLevel: 'NORMAL',
  syncRatios: {},
  magiStatus: 'DISAGREE',
  magiVotes: {
    melchior: false,
    balthasar: false,
    casper: false,
  },
  systemAlerts: [],
  angelDetected: false,
}
```

### MAGI Consensus Logic

The `magiStatus` field is derived from the tripartite MAGI voting system (MELCHIOR, BALTHASAR, CASPER). Critical actions require a **2/3 majority**:

```
IF (3/3 votes agree)   → magiStatus = 'AGREE'
IF (2/3 votes agree)   → magiStatus = 'AGREE'
IF (1/3 or 0/3 agree)  → magiStatus = 'DISAGREE'
IF (system error)      → magiStatus = 'CONFLICT'
```

The consensus result is stored in the Zustand state and consumed by both the `MagiDashboard` and `NervTerminal` components.

### Actions

The store exposes the following actions for state mutation:

| Action                  | Signature                                                   | Description                          |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `setEmergencyLevel`     | `(level: 'NORMAL' \| 'ALERT' \| 'EMERGENCY') => void`      | Set the facility emergency level     |
| `setSyncRatio`          | `(pilotId: string, ratio: number) => void`                  | Update a pilot's sync ratio (clamped to 0–100) |
| `setMagiVotes`          | `(votes: Partial<MagiVotes>) => void`                       | Merge partial MAGI votes and recompute `magiStatus` |
| `randomizeMagiVotes`    | `() => void`                                                | Randomize all three MAGI votes and recompute consensus |
| `addSystemAlert`        | `(alert: string) => void`                                   | Push a new alert to `systemAlerts`   |
| `clearSystemAlerts`     | `() => void`                                                | Clear all system alerts              |
| `triggerAngelDetected`  | `() => void`                                                | Set `angelDetected: true`, `emergencyLevel: 'EMERGENCY'`, add alert |
| `resetEmergency`        | `() => void`                                                | Reset `angelDetected: false`, `emergencyLevel: 'NORMAL'`, clear alerts |

### Usage Example

```tsx
import { useNervStore } from '../store/useNervStore';

function MyComponent() {
  const magiStatus = useNervStore((state) => state.magiStatus);
  const systemAlerts = useNervStore((state) => state.systemAlerts);
  const setEmergencyLevel = useNervStore((state) => state.setEmergencyLevel);

  return (
    <div>
      <p>[SYSTEM_REPORT] MAGI STATUS: {magiStatus}</p>
      {systemAlerts.length > 0 && <EmergencyOverlay alerts={systemAlerts} />}
      <button onClick={() => setEmergencyLevel('EMERGENCY')}>
        TRIGGER ALERT
      </button>
    </div>
  );
}
```

### Selector Best Practices

Always use **selectors** to subscribe to specific slices of state. This prevents unnecessary re-renders:

```tsx
// Good — subscribes only to syncRatios
const syncRatios = useNervStore((state) => state.syncRatios);

// Good — subscribes only to magiStatus
const magiStatus = useNervStore((state) => state.magiStatus);

// Avoid — subscribes to entire store
const store = useNervStore();
```

---

## Terminal Commands

The `NervTerminal` component accepts the following mock commands:

### `system --status`

Returns the current state of the NERV system.

```
> system --status

[SYSTEM_REPORT] --- NERV SYSTEM STATUS ---
[SYSTEM_REPORT] Emergency Level : NORMAL
[SYSTEM_REPORT] MAGI Status     : DISAGREE
[SYSTEM_REPORT] Sync Ratios:
[SYSTEM_REPORT]   (no pilots registered)
[SYSTEM_REPORT] MAGI Votes:
[SYSTEM_REPORT]   MELCHIOR-1  : REJECT
[SYSTEM_REPORT]   BALTHASAR-2 : REJECT
[SYSTEM_REPORT]   CASPER-3    : REJECT
[SYSTEM_REPORT] System Alerts   : NONE
[SYSTEM_REPORT] --------------------------
```

### `magi --vote`

Randomizes the MAGI voting state. Each of the three MAGI components receives a random boolean vote, and the consensus result is displayed.

```
> magi --vote

[SYSTEM_REPORT] MAGI VOTING INITIATED...
[SYSTEM_REPORT]   MELCHIOR-1  : REJECT
[SYSTEM_REPORT]   BALTHASAR-2 : APPROVE
[SYSTEM_REPORT]   CASPER-3    : REJECT
[SYSTEM_REPORT] PRIORITY: REJECTED (consensus not reached)
[SYSTEM_REPORT] MAGI STATUS: DISAGREE
```

### `signal --emergency`

Sets the facility emergency level to `EMERGENCY`. All components will respond accordingly (pulsing red animations, orange hex grid, etc.).

```
> signal --emergency

[SYSTEM_REPORT] !!! EMERGENCY SIGNAL ACTIVATED !!!
[SYSTEM_REPORT] All units to battle stations.
[SYSTEM_REPORT] Emergency level set to: EMERGENCY
```

### `signal --alert`

Sets the facility emergency level to `ALERT`.

```
> signal --alert

[SYSTEM_REPORT] ALERT STATUS ACTIVATED.
[SYSTEM_REPORT] Emergency level set to: ALERT
```

### `signal --normal`

Returns the facility to normal operations.

```
> signal --normal

[SYSTEM_REPORT] All clear. Returning to normal operations.
[SYSTEM_REPORT] Emergency level set to: NORMAL
```

### `help`

Displays the list of available commands.

### `clear`

Clears the terminal output history.

### Unrecognized Commands

Any unrecognized input returns:

```
> hello

Unknown command: "hello". Type "help" for available commands.
```

---

## Testing Protocol

Tests are located in `src/__tests__/` and use **Jest** with **React Testing Library**.

### Running Tests

```bash
npm run test
```

### Test Coverage

#### MagiDashboard Tests (`src/__tests__/MagiDashboard.test.tsx`)

| Test Case                                    | Description                                                       |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Renders APPROVED when 2/3 votes are true     | Mocks `magiVotes` with 2 true → expects "PRIORITY: APPROVED"     |
| Renders APPROVED when 3/3 votes are true     | Mocks `magiVotes` with 3 true → expects "PRIORITY: APPROVED"     |
| Renders REJECTED when fewer than 2 are true  | Mocks `magiVotes` with 1 true → expects "PRIORITY: REJECTED"     |
| Renders REJECTED when 0/3 votes are true     | Mocks `magiVotes` with 0 true → expects "PRIORITY: REJECTED"     |

#### SyncMonitor Tests (`src/__tests__/SyncMonitor.test.tsx`)

| Test Case                                    | Description                                                       |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Displays correct bar height for syncRatio    | Mocks `syncRatio: 50` → expects bar at 50% height/width          |
| Displays full bar at 100                     | Mocks `syncRatio: 100` → expects bar at 100% height/width        |
| Pulses red during EMERGENCY                  | Mocks `emergencyLevel: 'EMERGENCY'` → expects red pulse animation |
| No pulse during NORMAL                       | Mocks `emergencyLevel: 'NORMAL'` → expects no pulse class         |

### Pattern Blue Test Suite

All UI components must include a "Pattern Blue" test that verifies the Emergency overlay renders correctly when the global `systemAlerts` state is populated. This ensures every component reacts to Angel detection events:

```typescript
describe('Pattern Blue — Emergency Overlay', () => {
  it('renders Emergency overlay when systemAlerts is populated', () => {
    // Mock store with active system alerts
    mockUseNervStore.mockImplementation((selector) =>
      selector({
        ...defaultState,
        systemAlerts: ['PATTERN BLUE DETECTED — ANGEL APPROACHING'],
        emergencyLevel: 'EMERGENCY',
      })
    );

    render(<ComponentUnderTest />);
    expect(screen.getByText(/PATTERN BLUE/)).toBeInTheDocument();
  });
});
```

### Mocking the Store

Tests mock `useNervStore` to isolate component behavior:

```typescript
import { useNervStore } from '../store/useNervStore';

jest.mock('../store/useNervStore');

const mockUseNervStore = useNervStore as jest.MockedFunction<typeof useNervStore>;

const defaultState = {
  emergencyLevel: 'NORMAL' as const,
  syncRatios: {},
  magiStatus: 'DISAGREE' as const,
  magiVotes: { melchior: false, balthasar: false, casper: false },
  systemAlerts: [],
  angelDetected: false,
  setEmergencyLevel: jest.fn(),
  setSyncRatio: jest.fn(),
  setMagiVotes: jest.fn(),
  randomizeMagiVotes: jest.fn(),
  addSystemAlert: jest.fn(),
  clearSystemAlerts: jest.fn(),
  triggerAngelDetected: jest.fn(),
  resetEmergency: jest.fn(),
};

beforeEach(() => {
  mockUseNervStore.mockImplementation((selector) =>
    selector(defaultState)
  );
});
```

---

## File Structure

```
nerv-command-center/
├── public/
│   └── index.html
├── src/
│   ├── __tests__/
│   │   ├── MagiDashboard.test.tsx    # MAGI consensus tests
│   │   └── SyncMonitor.test.tsx      # Sync ratio & emergency tests
│   ├── components/
│   │   ├── MagiDashboard.tsx         # MAGI voting UI
│   │   ├── SyncMonitor.tsx           # Sync-ratio progress bars
│   │   ├── GeoFrontMap.tsx           # SVG hexagonal map
│   │   └── NervTerminal.tsx          # Command terminal
│   ├── store/
│   │   └── useNervStore.ts           # Zustand global state
│   ├── types/
│   │   └── nerv.d.ts                 # Shared data interfaces (Pilot, etc.)
│   ├── App.tsx                       # Root layout component
│   ├── index.css                     # Tailwind imports & global styles
│   └── main.tsx                      # Application entry point
├── CLAUDE.md                         # Agent coordination config
├── NERV_MANUAL.md                    # This document
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Troubleshooting

### Dev server won't start

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

### Tailwind custom colors not rendering

Ensure `tailwind.config.js` includes the custom content paths:
```js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // ...
}
```

Arbitrary values like `text-[#FF3300]` require Tailwind JIT mode (enabled by default in Tailwind v3+).

### Tests failing with store mock errors

Ensure the mock implementation returns all state properties **and** all actions, including the new `syncRatios`, `magiStatus`, `systemAlerts`, `addSystemAlert`, and `clearSystemAlerts` fields. Missing properties will cause selector functions to throw.

### Components not updating on state change

Verify you are using **selectors** rather than destructuring the entire store. Zustand only triggers re-renders when the selected slice changes.

---

### Sync-Ratio Fluctuations

Sync-ratio values in `syncRatios` may fluctuate unexpectedly. Use this checklist to diagnose:

1. **Verify pilot registration.** Ensure `setSyncRatio(pilotId, ratio)` is called with a valid pilot ID matching a `Pilot` record. Unregistered pilot IDs will create orphan entries in the `syncRatios` object.

2. **Check clamping bounds.** The store clamps sync ratios to the 0–100 range. Values outside this range are silently clamped — if you observe unexpected capping, verify the upstream data source.

3. **Rapid state updates.** If multiple components dispatch `setSyncRatio` in rapid succession (e.g., during simulated telemetry), Zustand batches updates within a single React render cycle. Ensure your selectors subscribe to the specific pilot's ratio rather than the entire `syncRatios` object to avoid unnecessary re-renders:
   ```tsx
   // Good — subscribes to a specific pilot
   const ratio = useNervStore((state) => state.syncRatios['pilot-01']);

   // Avoid — re-renders on ANY pilot change
   const allRatios = useNervStore((state) => state.syncRatios);
   ```

4. **Emergency state interaction.** When `triggerAngelDetected()` fires, the emergency level jumps to `EMERGENCY`. This does not reset sync ratios, but the `SyncMonitor` visual changes (pulsing animation) may give the impression of a ratio change. Verify the actual numeric value via `system --status` in the terminal.

5. **Stale closures.** If a component captures `syncRatios` in a callback or effect, the value may be stale. Use the Zustand `getState()` escape hatch for imperative reads:
   ```tsx
   const currentRatio = useNervStore.getState().syncRatios['pilot-01'];
   ```

---

### MAGI Consensus Failures

The MAGI system uses tripartite consensus (MELCHIOR, BALTHASAR, CASPER) with a 2/3 majority requirement. When consensus fails or enters `CONFLICT` state, follow these steps:

1. **Verify vote state.** Run `system --status` or `magi --vote` in the `NervTerminal` to inspect individual MAGI votes. The `magiStatus` field should reflect:
   - `'AGREE'` — 2 or 3 of 3 votes are `true`
   - `'DISAGREE'` — fewer than 2 votes are `true`
   - `'CONFLICT'` — system error or inconsistent state

2. **Check `setMagiVotes` calls.** The action accepts `Partial<MagiVotes>`, merging into existing state. If only one vote is updated at a time, the consensus recomputation uses the previous values for the other two. Ensure all three votes are set together when performing a full vote cycle:
   ```tsx
   setMagiVotes({ melchior: true, balthasar: false, casper: true });
   ```

3. **Stale `magiStatus` after vote.** If the UI shows a stale consensus result after calling `randomizeMagiVotes()`, verify that the action both updates `magiVotes` AND recomputes `magiStatus` in a single Zustand `set()` call. Split updates will cause an intermediate render with inconsistent state.

4. **Terminal vs. Dashboard disagreement.** Both `NervTerminal` and `MagiDashboard` read `magiStatus` from the same Zustand store. If they show different results, one component may be using a local copy instead of a selector. Ensure both use:
   ```tsx
   const magiStatus = useNervStore((state) => state.magiStatus);
   ```

5. **CONFLICT state recovery.** The `CONFLICT` state indicates a system-level error. To recover:
   - Call `resetEmergency()` to clear emergency state
   - Call `randomizeMagiVotes()` to re-initiate a fresh vote cycle
   - If the `CONFLICT` persists, check for errors in the browser console — the Zustand middleware may have logged the root cause

---

```
=====================================================
  END OF DOCUMENT — NERV OPERATIONS MANUAL
  "GOD'S IN HIS HEAVEN, ALL'S RIGHT WITH THE WORLD."
=====================================================
```
