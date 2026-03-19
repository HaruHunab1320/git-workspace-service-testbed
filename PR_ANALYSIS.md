# Open Pull Request Conflict Analysis

**Date:** 2026-03-19
**Repository:** HaruHunab1320/git-workspace-service-testbed
**Base branch:** main (b393c2e)

---

## Summary

There are **6 open PRs**, and **all 6 have merge conflicts** with `main`. The root cause is that all branches were created with unrelated histories (likely initialized independently from a shared template rather than branched from `main`), and they all modify the same core files — particularly the Zustand store and type definitions. Every PR also conflicts with every other PR.

| PR | Title | Conflicting Files | Severity |
|----|-------|-------------------|----------|
| #309 | feat: MAGI supercomputer dashboard (unit-01) | 6 files | High |
| #310 | feat: initialize base React infrastructure with NERV aesthetic | 12 files | Critical |
| #311 | feat(unit-02): Evangelion sync-ratio monitoring widget | 6 files | High |
| #312 | feat(unit-03): update GeoFront hexagonal map for shared context | 5 files | High |
| #313 | feat: update NERV command terminal with shared design system alignment | 5 files | High |
| #315 | feat(tests): update Jest tests for shared context + Pattern Blue suite | 12 files | Critical |

---

## Conflict Details by PR

### PR #309 — MAGI Supercomputer Dashboard (unit-01)

**Conflicting files:** `.gitignore`, `NERV_MANUAL.md`, `src/__tests__/MagiDashboard.test.tsx`, `src/components/MagiDashboard.tsx`, `src/store/useNervStore.ts`, `src/types/nerv.d.ts`

**Key divergences from main:**
- Removes `evaPositions` and related methods from the store
- Removes `triggerAngelDetected`, `resetEmergency`, `updatePilotSyncRatio` actions
- Changes `setMagiVotes` to accept full `MagiVotes` (not `Partial<MagiVotes>`)
- Uses `deriveMagiStatus()` instead of `computeMagiStatus()`
- Refactors `MagiDashboard` component with interactive vote card toggling

---

### PR #310 — Base React Infrastructure

**Conflicting files:** `.gitignore`, `NERV_MANUAL.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `src/__tests__/MagiDashboard.test.tsx`, `src/__tests__/SyncMonitor.test.tsx`, `src/components/GeoFrontMap.tsx`, `src/components/MagiDashboard.tsx`, `src/components/NervTerminal.tsx`, `src/components/SyncMonitor.tsx`, `src/store/useNervStore.ts`, `src/types/nerv.d.ts`

**Key divergences from main:**
- Changes `SystemAlert.level` (EmergencyLevel) to `SystemAlert.severity` ('INFO' | 'WARNING' | 'CRITICAL')
- Removes `evaPositions`, `angelDetected`, and related methods
- Adds `setMagiStatus` action (not in main)
- Removes `setSyncRatio` (single value)
- Initial `magiStatus` set to 'AGREE' (main has 'DISAGREE')
- All 4 component files have different implementations
- This is the broadest PR — touches infrastructure, config, and all components

---

### PR #311 — Evangelion Sync-Ratio Monitor (unit-02)

**Conflicting files:** `.gitignore`, `NERV_MANUAL.md`, `src/__tests__/SyncMonitor.test.tsx`, `src/components/SyncMonitor.tsx`, `src/store/useNervStore.ts`, `src/types/nerv.d.ts`

**Key divergences from main:**
- **Converts `systemAlerts` from `SystemAlert[]` (objects) to `string[]`** — the most structurally incompatible change
- `addSystemAlert` auto-prepends `[SYSTEM_REPORT]` prefix to strings
- `triggerAngelDetected` has a different signature: accepts `designation: string`
- `SyncMonitor` uses inline pixel-based styles instead of Tailwind classes

---

### PR #312 — GeoFront Hexagonal Map (unit-03)

**Conflicting files:** `.gitignore`, `NERV_MANUAL.md`, `src/components/GeoFrontMap.tsx`, `src/store/useNervStore.ts`, `src/types/nerv.d.ts`

**Key divergences from main:**
- **Redefines `HexCoordinate` from `string` to `{ row: number, col: number }`** — breaks all existing hex coordinate consumers
- Redefines `EvaPosition` to use `hex: HexCoordinate` and `label: string` (main uses `hexCoordinate: string`)
- Adds `setEvaPositions` and `setMagiStatus` actions
- Removes `updatePilotSyncRatio`, `randomizeMagiVotes`, `triggerAngelDetected`, `resetEmergency`
- `GeoFrontMap` is a full SVG hexagon grid implementation

---

### PR #313 — NERV Command Terminal

**Conflicting files:** `.gitignore`, `NERV_MANUAL.md`, `src/components/NervTerminal.tsx`, `src/store/useNervStore.ts`, `src/types/nerv.d.ts`

**Key divergences from main:**
- Removes `evaPositions` from the store
- Inconsistent `SystemAlert` typing (interface defined but implementation doesn't match)
- Removes most store methods
- `NervTerminal` implements full command parsing: `system --status`, `magi --vote`, `signal --*`, `help`, `clear`
- Uses imperative `useNervStore.getState()` for reads in command callbacks

---

### PR #315 — Jest Tests Update + Pattern Blue Suite

**Conflicting files:** `.gitignore`, `NERV_MANUAL.md`, `package.json`, `src/__tests__/GeoFrontMap.test.tsx`, `src/__tests__/MagiDashboard.test.tsx`, `src/__tests__/NervTerminal.test.tsx`, `src/__tests__/SyncMonitor.test.tsx`, `src/components/GeoFrontMap.tsx`, `src/components/MagiDashboard.tsx`, `src/components/NervTerminal.tsx`, `src/components/SyncMonitor.tsx`, `src/store/useNervStore.ts`, `src/types/nerv.d.ts`

**Key divergences from main:**
- **Moves `MagiStatus`, `SystemAlert`, `SyncRatios` type exports to `nerv.d.ts`** — changes the import structure
- `SystemAlert.level` uses `'INFO' | 'WARNING' | 'EMERGENCY'` (not EmergencyLevel enum)
- Dramatically simplified store: removes `emergencyLevel`, `syncRatio` (single), `evaPositions`
- Touches all 4 component files and all test files

---

## Core Conflict Themes

### 1. SystemAlert Structure (every PR disagrees)

| Source | Structure |
|--------|-----------|
| **main** | `{ id: string, message: string, level: EmergencyLevel, timestamp: number }` |
| **PR #309** | Removed entirely |
| **PR #310** | `{ id, message, severity: 'INFO'\|'WARNING'\|'CRITICAL', timestamp }` |
| **PR #311** | `string[]` (plain strings, no objects) |
| **PR #312** | `string[]` |
| **PR #313** | Inconsistently typed |
| **PR #315** | `{ id, level: 'INFO'\|'WARNING'\|'EMERGENCY', message, timestamp }` |

### 2. HexCoordinate / EvaPosition Structure

| Source | HexCoordinate | EvaPosition |
|--------|---------------|-------------|
| **main** | `string` (e.g., '3-4') | `{ pilotId, hexCoordinate: string }` |
| **PR #312** | `{ row: number, col: number }` | `{ hex: HexCoordinate, label: string }` |
| **Others** | Remove or ignore | Remove or ignore |

### 3. Store Method Deletions

Every PR removes different subsets of store methods. No PR preserves all methods from main:

| Method | Main | #309 | #310 | #311 | #312 | #313 | #315 |
|--------|------|------|------|------|------|------|------|
| `setSyncRatio` | Y | Y | N | Y | Y | Y | N |
| `updatePilotSyncRatio` | Y | N | N | Y | N | N | N |
| `randomizeMagiVotes` | Y | N | N | Y | N | N | N |
| `triggerAngelDetected` | Y | N | N | Y* | N | N | N |
| `resetEmergency` | Y | N | N | Y | N | N | N |
| `setMagiStatus` | N | N | Y | N | Y | N | N |
| `setEvaPositions` | N | N | N | N | Y | N | N |

*PR #311 has a different signature

### 4. Type Definition Location

- **main:** Types defined inline in `useNervStore.ts`
- **PR #315:** Types exported from `src/types/nerv.d.ts`, imported by store
- **Others:** Mix of inline definitions

---

## Cross-PR Conflict Matrix

Every PR conflicts with every other PR on at least `useNervStore.ts` and `nerv.d.ts`. Additional overlaps:

| | #309 | #310 | #311 | #312 | #313 | #315 |
|------|------|------|------|------|------|------|
| **#309** | — | Components, store | Store, alerts | Store, types | Store, types | All shared files |
| **#310** | | — | Components, store | Components, store | Components, store | All shared files |
| **#311** | | | — | Store, types | Store, types | Components, tests |
| **#312** | | | | — | Store, types | Components, tests |
| **#313** | | | | | — | Components, tests |
| **#315** | | | | | | — |

---

## Resolution Plan

### Phase 1: Establish a Canonical Store Contract

Before merging any PR, define the unified store interface that satisfies all component requirements:

1. **Unify `SystemAlert`** — Use main's object structure with a string union for levels:
   ```typescript
   interface SystemAlert {
     id: string;
     message: string;
     level: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
     timestamp: number;
   }
   ```

2. **Unify `HexCoordinate`** — Adopt PR #312's numeric struct (more type-safe for the SVG hex grid):
   ```typescript
   interface HexCoordinate { row: number; col: number; }
   ```

3. **Consolidate type definitions** — Follow PR #315's approach: export shared types from `src/types/nerv.d.ts`, import them in the store. This is cleaner for tests and component imports.

4. **Preserve all store methods** — The merged store must include every action any component needs. No deletions from main; add new actions from PRs (`setMagiStatus`, `setEvaPositions`).

### Phase 2: Merge Order

Merge PRs in dependency order, resolving conflicts at each step:

1. **PR #310 first** (base infrastructure) — It establishes the React scaffold, config files, and all component stubs. Rebase onto main, resolving add/add conflicts by taking PR #310's versions for new files and main's versions for existing shared state.

2. **PR #315 second** (tests + type exports) — After #310, rebase #315 to move type definitions to `nerv.d.ts` and update tests. Resolve conflicts against the now-merged #310 by adopting the canonical type definitions.

3. **PR #309 third** (MAGI dashboard) — Rebase onto main (now with #310 + #315). Take PR #309's `MagiDashboard` component but adapt it to use the canonical store interface. Re-add any methods #309 deleted.

4. **PR #311 fourth** (sync monitor) — Rebase and adapt `SyncMonitor` to use `SystemAlert` objects instead of plain strings. Keep the component's styling approach.

5. **PR #312 fifth** (GeoFront map) — Rebase and integrate the hex grid SVG implementation. Align `EvaPosition` and `HexCoordinate` types with the canonical definitions.

6. **PR #313 last** (NERV terminal) — Rebase the terminal component. Its command parsing should work with the finalized store shape. Fix any `getState()` calls to use the canonical types.

### Phase 3: At Each Merge Step

For each PR rebase/merge:

1. **Rebase the branch onto current `main`** (`git rebase main` or interactive)
2. **Resolve `useNervStore.ts` conflicts** by keeping main's complete method set and adding only the PR's new methods/state
3. **Resolve `nerv.d.ts` conflicts** by using the canonical type definitions
4. **Resolve `.gitignore` and `NERV_MANUAL.md`** by merging content from both sides (these are additive)
5. **Run tests** to verify component compatibility with the store
6. **Merge to main** before proceeding to the next PR

### Alternative: Single Integration Branch

Given the severity and breadth of conflicts, a more efficient approach may be:

1. Create an `integration` branch from `main`
2. Cherry-pick the **non-conflicting unique files** from each PR (e.g., component files that only one PR touches)
3. Manually write the unified `useNervStore.ts`, `nerv.d.ts`, and test files that incorporate all PRs' requirements
4. Open a single consolidated PR that replaces all 6
5. Close the individual PRs with a reference to the integration PR

This avoids 6 sequential rebase-and-resolve cycles and produces a cleaner, consistent result.
