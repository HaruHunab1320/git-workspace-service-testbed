# NERV Command Center UI — Application Summary

## What It Does

The NERV Command Center is a React/TypeScript dashboard application themed after the MAGI supercomputer system from Neon Genesis Evangelion. It provides a retro-terminal aesthetic command center with four main UI components, all sharing state through a Zustand store (`useNervStore`).

### Core Components

1. **MAGI Dashboard** (`MagiDashboard.tsx`) — An interactive voting panel for the three MAGI supercomputer subsystems (MELCHIOR-1, BALTHASAR-2, CASPER-3). Each subsystem can vote APPROVE or REJECT, and a 2/3 majority consensus is computed in real-time.

2. **Sync Monitor** (`SyncMonitor.tsx`) — Displays per-pilot Evangelion synchronization ratios (0–100%) as animated vertical progress bars. Bars pulse red during EMERGENCY states and show an overlay when system alerts are active.

3. **GeoFront Map** (`GeoFrontMap.tsx`) — An SVG hexagonal grid (9x7) visualizing the underground GeoFront facility. An elliptical dome mask highlights interior sectors, colors shift based on emergency level, and EVA unit positions are rendered as map markers.

4. **NERV Terminal** (`NervTerminal.tsx`) — A command-line interface supporting commands like `system --status`, `magi --vote`, `signal --emergency/--alert/--normal`, `help`, and `clear`. Includes boot sequence animation and command history navigation.

### State Management

A single Zustand store manages all shared state: emergency level (NORMAL/ALERT/EMERGENCY), per-pilot sync ratios, MAGI votes and consensus status, system alerts, EVA positions on the hex grid, and angel detection flags. All components subscribe reactively via selectors.

### Tech Stack

- React 19 + TypeScript
- Zustand for state management
- Tailwind CSS for styling (NERV Red `#FF3300`, Warning Orange `#FF9900`, Deep Black `#050505`)
- Jest + React Testing Library for tests

---

## Proposed Features & Improvements

### 1. Angel Attack Simulation Mode

Add a `SimulationController` component that runs scripted or randomized angel attack scenarios. This would automatically trigger sequences of state changes over time — angel detection, escalating emergency levels, sync ratio fluctuations, EVA deployments on the GeoFront map, and MAGI voting cycles. It would give the dashboard a dynamic, "living" feel without manual terminal commands.

### 2. Pilot Management Panel

Currently the three pilots (Shinji, Asuka, Rei) are hardcoded in `SyncMonitor`. A dedicated `PilotPanel` component would allow adding/removing pilots, toggling their status (ACTIVE/INACTIVE/BERSERK), adjusting sync ratios via sliders, and assigning them to EVA units. This would make the pilot data dynamic and flow through the store properly, also enabling the terminal to support commands like `pilot --list` and `pilot --assign`.

### 3. Alert Log with Timestamps & Filtering

The current `systemAlerts` array is append-only with no UI for reviewing past alerts. Adding an `AlertLog` component would display alerts in a scrollable, timestamped feed with severity-based color coding (INFO/WARNING/CRITICAL/EMERGENCY) and filtering by level. Alerts could also support acknowledgment/dismissal by operators, and the terminal could gain an `alerts --history` command.

### 4. WebSocket-Driven Real-Time Data Feed

Replace the current static/manual state updates with a WebSocket connection (or simulated data stream) that pushes live telemetry — fluctuating sync ratios, EVA position updates, and periodic MAGI re-votes. This would transform the dashboard from a static demo into a real-time monitoring tool and demonstrate a more production-like architecture with reconnection handling and data buffering.
