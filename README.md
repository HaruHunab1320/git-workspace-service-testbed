# Cozy Village

A cozy village life simulator set in **Willowbrook** -- a living world with autonomous villagers, dynamic weather, farming, pets, crafting, and a meditative zen garden.

## Monorepo Structure

```
cozy-village/
├── apps/
│   ├── api/               # FastAPI backend -- simulation engine & REST API
│   ├── web/               # React + Vite frontend -- interactive village UI
│   ├── beta/              # React + Vite -- new app scaffolded by agent beta (port 5175)
│   ├── cozy-companion/    # React + Vite -- wellness & focus companion app
│   └── mood-journal/      # React + Vite -- standalone mood tracking app
├── packages/
│   ├── ui/            # Shared pastel-themed React component library
│   ├── zen-garden/    # Reusable canvas-based zen garden component
│   └── utils/         # Shared utility functions
├── turbo.json         # Turborepo pipeline config
└── package.json       # npm workspaces root
```

### Apps

| App                | Package                        | Description                                                                                                                                                           |
| ------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API**            | `@cozy-village/api`            | Python/FastAPI backend powering the simulation. Handles villager AI, weather, farming, pets, economy, crafting, candle workshop, and zen garden logic. Exposes 40+ REST endpoints. |
| **Web**            | `@cozy-village/web`            | React 18 frontend with 30+ components. Includes ambient features like a lo-fi mixer, fireplace, wind chimes, and starry night sky.                                    |
| **Beta**           | `@cozy-village/beta`           | A new React + Vite application scaffolded by agent beta, running on port 5175.                                                                                        |
| **Cozy Companion** | `@cozy-village/cozy-companion` | A wellness and focus companion app with mood tracking, a focus timer, gentle reminders, and a personal journal. Uses the shared `@cozy-village/ui` component library. |
| **Mood Journal**   | `@cozy-village/mood-journal`   | A minimal standalone mood tracking app with a 6-mood picker. Part of the Cozy Village universe.                                                                       |

### Packages

| Package        | Name                       | Description                                                                                                                                                       |
| -------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ui**         | `@cozy-village/ui`         | Shared pastel-themed React component library. Includes PastelButton, PastelCard, PastelTabs, PastelModal, PastelToast, PastelInput, PastelAvatar, and more.       |
| **zen-garden** | `@cozy-village/zen-garden` | Interactive canvas drawing component with rake patterns, succulent/rock placement, and a tool palette.                                                            |
| **utils**      | `@cozy-village/utils`      | Shared helpers -- Fisher-Yates shuffle, greeting generator, console utilities, and a deterministic weather forecast generator (`weather.js`) using a seeded PRNG. |

## Getting Started

**Prerequisites:** Node.js 20+ and Python 3.10+

```bash
# Install JavaScript dependencies
npm install

# Install Python dependencies
pip install -r apps/api/requirements.txt

# Start all dev servers (API + Web + Companion + Mood Journal)
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
npx turbo dev --filter=@cozy-village/cozy-companion
```

## Game Systems

- **Villagers** -- 6 NPCs with personalities, daily schedules, moods, and a 5-tier friendship system
- **Weather** -- Seasonal temperature cycles with rain, snow, fog, and magical events like aurora borealis
- **Garden** -- Grid-based farming with crop growth stages and seasonal planting
- **Pets** -- 6 adoptable species with bonding progression and unique personalities
- **Economy** -- Market with supply/demand pricing and seasonal fluctuations
- **Crafting** -- Tiered recipe discovery using gathered materials
- **Zen Garden** -- Interactive sand raking, succulent, and rock placement
- **Candle Workshop** -- Craft scented candles (8 scents) that burn down over game days and boost village mood
- **Journal** -- Personal entry system tied to in-game days

## Logger

A standardized logging utility is available at `src/logger.ts`. It provides configurable log levels (DEBUG, INFO, WARN, ERROR, SILENT), pluggable transports, and hierarchical child loggers with context chaining.

```ts
import { createLogger, LogLevel } from './src/logger';

const logger = createLogger({ context: 'MyModule', level: LogLevel.DEBUG });
logger.info('Hello from Willowbrook');
```

See [docs/logging.md](./docs/logging.md) for full API documentation.

## Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | React 18, Vite 5, CSS                         |
| Backend    | Python, FastAPI, Uvicorn                      |
| Monorepo   | Turborepo 2, npm workspaces                   |
| UI Library | `@cozy-village/ui` (pastel-themed components) |
| Testing    | Pytest (API), Vitest-compatible (Web)         |
| Formatting | Prettier                                      |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, code style guidelines, and the pull request process.
