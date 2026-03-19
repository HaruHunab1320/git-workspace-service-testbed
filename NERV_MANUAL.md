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

| Name         | Hex Code    | CSS Variable / Tailwind             | Usage                                   |
| ------------ | ----------- | ------------------------------------ | --------------------------------------- |
| NERV Black   | `#000000`   | `bg-black`                           | Primary background for all panels       |
| Neon Green   | `#39FF14`   | `text-[#39FF14]`, `border-[#39FF14]` | Primary text, active/positive states    |
| NERV Orange  | `#FF9900`   | `text-[#FF9900]`, `border-[#FF9900]` | Borders, warnings, alert/rejected states|
| Emergency Red| `#FF0000`   | `text-red-500`                       | Emergency pulse, critical alerts        |

### Typography

- **Font Family:** `font-mono` (monospace) is used for **all** text across the UI.
- **Sizing:** Use Tailwind's standard sizing scale (`text-xs` through `text-4xl`).
- **Casing:** UI labels and headings should use UPPERCASE for the Terminal-Retro feel.

### UI Patterns

All components follow these styling conventions:

```
┌─ border-1 border-[#FF9900] ──────────────────────┐
│  bg-black                                         │
│  text-[#39FF14] font-mono                         │
│                                                   │
│  Content area with neon green text on black        │
│  background. Orange border frames each panel.      │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Tailwind class pattern for all panels:**
```html
<div class="bg-black text-[#39FF14] border border-[#FF9900] font-mono p-4">
  <!-- Panel content -->
</div>
```

### Visual States

| State       | Text Color   | Border Color | Special Effect               |
| ----------- | ------------ | ------------ | ---------------------------- |
| NORMAL      | `#39FF14`    | `#FF9900`    | None                         |
| ALERT       | `#FF9900`    | `#FF9900`    | Amber text for warnings      |
| EMERGENCY   | `#FF0000`    | `#FF9900`    | Pulsing red animation        |

---

## Component Reference

### `MagiDashboard` — `src/components/MagiDashboard.tsx`

The MAGI supercomputer voting interface. Displays the three MAGI components and their consensus decision.

**MAGI Components:**
- **MELCHIOR-1** — The Scientist personality
- **BALTHASAR-2** — The Mother personality
- **CASPER-3** — The Woman personality

**Consensus Logic:**
```
IF (2 or more of 3 votes are TRUE)
  → Display "PRIORITY: APPROVED" in green (#39FF14)
ELSE
  → Display "PRIORITY: REJECTED" in orange (#FF9900)
```

Each MAGI component displays its current vote state (APPROVE / DENY) and contributes to the overall consensus calculation.

**Store Dependencies:** `magiVotes.melchior`, `magiVotes.balthasar`, `magiVotes.casper`

---

### `SyncMonitor` — `src/components/SyncMonitor.tsx`

Evangelion sync-ratio monitoring widget with animated vertical progress bars.

**Behavior:**
- Displays the current `syncRatio` value (0–100) as a vertical progress bar.
- Bar height corresponds directly to the sync ratio percentage.
- Under normal conditions, the bar renders in neon green (`#39FF14`).
- When `emergencyLevel` is `'EMERGENCY'`, the bar **pulses red** with a CSS animation.

**Store Dependencies:** `syncRatio`, `emergencyLevel`

---

### `GeoFrontMap` — `src/components/GeoFrontMap.tsx`

SVG-based hexagonal grid visualization of the GeoFront underground facility.

**Behavior:**
- Renders a hexagonal grid using SVG `<polygon>` elements.
- Each hexagon toggles color based on the `emergencyLevel`:
  - `NORMAL` → Green fill (`#39FF14`)
  - `ALERT` or `EMERGENCY` → Orange fill (`#FF9900`)
- Hexagons may include interactive hover or click states.

**Store Dependencies:** `emergencyLevel`

---

### `NervTerminal` — `src/components/NervTerminal.tsx`

Command-line terminal interface for NERV operators.

**Behavior:**
- Presents a scrollable terminal output area and a text input field.
- Processes mock commands and displays responses in the terminal log.
- Supports command history and standard terminal aesthetics.

See [Terminal Commands](#terminal-commands) for the full command reference.

**Store Dependencies:** All store state (read/write)

---

## Standard Operating Procedure — `useNervStore` API

The global state is managed by a Zustand store exported from `src/store/useNervStore.ts`.

### State Shape

```typescript
interface NervState {
  // Current threat level of the facility
  emergencyLevel: 'NORMAL' | 'ALERT' | 'EMERGENCY';

  // Evangelion pilot synchronization ratio (0–100)
  syncRatio: number;

  // MAGI supercomputer voting state
  magiVotes: {
    melchior: boolean;   // MELCHIOR-1 vote
    balthasar: boolean;  // BALTHASAR-2 vote
    casper: boolean;     // CASPER-3 vote
  };
}
```

### Default State

```typescript
{
  emergencyLevel: 'NORMAL',
  syncRatio: 75,
  magiVotes: {
    melchior: true,
    balthasar: true,
    casper: false,
  },
}
```

### Actions

The store exposes the following actions for state mutation:

| Action                  | Signature                                                   | Description                          |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `setEmergencyLevel`     | `(level: 'NORMAL' \| 'ALERT' \| 'EMERGENCY') => void`      | Set the facility emergency level     |
| `setSyncRatio`          | `(ratio: number) => void`                                   | Update the Evangelion sync ratio     |
| `setMagiVotes`          | `(votes: { melchior: boolean; balthasar: boolean; casper: boolean }) => void` | Set MAGI voting state |

### Usage Example

```tsx
import { useNervStore } from '../store/useNervStore';

function MyComponent() {
  const emergencyLevel = useNervStore((state) => state.emergencyLevel);
  const setEmergencyLevel = useNervStore((state) => state.setEmergencyLevel);

  return (
    <button onClick={() => setEmergencyLevel('EMERGENCY')}>
      TRIGGER ALERT
    </button>
  );
}
```

### Selector Best Practices

Always use **selectors** to subscribe to specific slices of state. This prevents unnecessary re-renders:

```tsx
// Good — subscribes only to syncRatio
const syncRatio = useNervStore((state) => state.syncRatio);

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

NERV SYSTEM STATUS REPORT
==========================
Emergency Level: NORMAL
Sync Ratio:      75%
MAGI Consensus:
  MELCHIOR-1:    APPROVE
  BALTHASAR-2:   APPROVE
  CASPER-3:      DENY
Result:          PRIORITY: APPROVED
```

### `magi --vote`

Randomizes the MAGI voting state. Each of the three MAGI components receives a random boolean vote.

```
> magi --vote

MAGI VOTE RECALCULATED
==========================
MELCHIOR-1: DENY
BALTHASAR-2: APPROVE
CASPER-3: DENY
Result: PRIORITY: REJECTED
```

### `signal --emergency`

Sets the facility emergency level to `EMERGENCY`. All components will respond accordingly (pulsing red animations, orange hex grid, etc.).

```
> signal --emergency

!! ALERT !!
EMERGENCY SIGNAL ACTIVATED
ALL PERSONNEL TO BATTLE STATIONS
Emergency Level: EMERGENCY
```

### Unrecognized Commands

Any unrecognized input returns:

```
> hello

ERROR: UNKNOWN COMMAND "hello"
TYPE "system --status", "magi --vote", OR "signal --emergency"
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

### Mocking the Store

Tests mock `useNervStore` to isolate component behavior:

```typescript
import { useNervStore } from '../store/useNervStore';

jest.mock('../store/useNervStore');

const mockUseNervStore = useNervStore as jest.MockedFunction<typeof useNervStore>;

beforeEach(() => {
  mockUseNervStore.mockImplementation((selector) =>
    selector({
      emergencyLevel: 'NORMAL',
      syncRatio: 75,
      magiVotes: { melchior: true, balthasar: true, casper: false },
      setEmergencyLevel: jest.fn(),
      setSyncRatio: jest.fn(),
      setMagiVotes: jest.fn(),
    })
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

Arbitrary values like `text-[#39FF14]` require Tailwind JIT mode (enabled by default in Tailwind v3+).

### Tests failing with store mock errors

Ensure the mock implementation returns all state properties **and** all actions. Missing properties will cause selector functions to throw.

### Components not updating on state change

Verify you are using **selectors** rather than destructuring the entire store. Zustand only triggers re-renders when the selected slice changes.

---

```
=====================================================
  END OF DOCUMENT — NERV OPERATIONS MANUAL
  "GOD'S IN HIS HEAVEN, ALL'S RIGHT WITH THE WORLD."
=====================================================
```
