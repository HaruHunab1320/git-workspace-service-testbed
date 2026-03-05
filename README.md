# Cozy Village

A cozy village life simulator set in **Willowbrook** — a living world with autonomous villagers, dynamic weather, farming, pets, crafting, and a meditative zen garden.

## Monorepo Structure

```
cozy-village/
├── apps/
│   ├── api/          # FastAPI backend — simulation engine & REST API
│   └── web/          # React + Vite frontend — interactive village UI
├── packages/
│   ├── zen-garden/   # Reusable canvas-based zen garden component
│   └── utils/        # Shared utility functions
├── turbo.json        # Turborepo pipeline config
└── package.json      # npm workspaces root
```

### Apps

| App | Package | Description |
|-----|---------|-------------|
| **API** | `@cozy-village/api` | Python/FastAPI backend powering the simulation. Handles villager AI, weather, farming, pets, economy, crafting, and zen garden logic. Exposes 40+ REST endpoints. |
| **Web** | `@cozy-village/web` | React 18 frontend with 30+ components. Includes ambient features like a lo-fi mixer, fireplace, wind chimes, and starry night sky. |

### Packages

| Package | Name | Description |
|---------|------|-------------|
| **zen-garden** | `@cozy-village/zen-garden` | Interactive canvas drawing component with rake patterns, succulent/rock placement, and a tool palette. |
| **utils** | `@cozy-village/utils` | Shared helpers — Fisher-Yates shuffle, greeting generator, and console utilities. |

## Getting Started

**Prerequisites:** Node.js 20+ and Python 3.10+

```bash
# Install JavaScript dependencies
npm install

# Install Python dependencies
pip install -r apps/api/requirements.txt

# Start all dev servers (API + Web)
npx turbo dev
```

The web app runs at `http://localhost:5173` and proxies `/api` requests to the backend.

## Scripts

```bash
npx turbo dev        # Start all dev servers
npx turbo build      # Build all packages
npx turbo test       # Run all tests
npx turbo lint       # Lint all packages
```

Filter to a specific package:

```bash
npx turbo dev --filter=@cozy-village/web
npx turbo test --filter=@cozy-village/api
```

## Game Systems

- **Villagers** — 6 NPCs with personalities, daily schedules, moods, and a 5-tier friendship system
- **Weather** — Seasonal temperature cycles with rain, snow, fog, and magical events like aurora borealis
- **Garden** — Grid-based farming with crop growth stages and seasonal planting
- **Pets** — 6 adoptable species with bonding progression and unique personalities
- **Economy** — Market with supply/demand pricing and seasonal fluctuations
- **Crafting** — Tiered recipe discovery using gathered materials
- **Zen Garden** — Interactive sand raking, succulent, and rock placement
- **Journal** — Personal entry system tied to in-game days

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, CSS |
| Backend | Python, FastAPI, Uvicorn |
| Monorepo | Turborepo 2, npm workspaces |
| Testing | Pytest (API), Vitest-compatible (Web) |
| Formatting | Prettier |

## Screen Breaks & Stretching

Cozy Village is meant to be relaxing, but don't forget to take care of yourself too! We recommend stepping away from the screen every 30-60 minutes to stretch and rest your eyes. Try rolling your shoulders, stretching your wrists, and looking at something in the distance for 20 seconds. Your village will be waiting when you get back.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, code style guidelines, and the pull request process.
