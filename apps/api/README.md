# Cozy Village Simulator

A multi-agent village simulation demo featuring autonomous NPCs, dynamic weather, gardening, pet companions, an economy system, and crafting — all wired together into a living, breathing village called **Willowbrook**.

Built as a **Turborepo monorepo** with npm workspaces.

## Monorepo Structure

```
cozy-village/
├── turbo.json                 # Turbo task pipeline configuration
├── package.json               # Root workspace definition (npm workspaces)
├── .nvmrc                     # Node.js version (v20)
│
├── apps/
│   ├── api/                   # @cozy-village/api — FastAPI backend
│   │   ├── game.py            #   Unified game engine
│   │   ├── villagers.py       #   NPC system with schedules & friendships
│   │   ├── weather.py         #   Seasonal weather with magical events
│   │   ├── garden.py          #   Farming and crop growth
│   │   ├── animals.py         #   Pet companion system
│   │   ├── economy.py         #   Market and trading
│   │   ├── crafting.py        #   Recipe and crafting system
│   │   ├── zen_garden.py      #   Zen garden gameplay system
│   │   ├── server.py          #   FastAPI REST server
│   │   ├── swarm.py           #   Fireflies swarm simulation
│   │   └── test_*.py          #   Test suites for each module
│   │
│   └── web/                   # @cozy-village/web — React/Vite frontend
│       ├── index.html
│       ├── vite.config.js
│       └── src/
│           ├── App.jsx        #   Main application shell
│           ├── api.js         #   API client wrapper
│           ├── components/    #   React UI components
│           └── hooks/         #   Custom React hooks
│
└── packages/
    ├── zen-garden/            # @cozy-village/zen-garden — Reusable zen garden component library
    │   └── src/
    │       ├── ZenGarden.jsx  #   Interactive canvas drawing tool
    │       ├── components/    #   ToolPalette, etc.
    │       └── hooks/         #   Canvas hooks
    │
    └── utils/                 # @cozy-village/utils — Shared utility functions
        ├── greet.js
        └── shuffle.js
```

### Apps

| Package             | Path       | Description                                             |
| ------------------- | ---------- | ------------------------------------------------------- |
| `@cozy-village/api` | `apps/api` | FastAPI backend powering the village simulation engine  |
| `@cozy-village/web` | `apps/web` | React/Vite frontend UI for interacting with the village |

### Packages

| Package                    | Path                  | Description                                                           |
| -------------------------- | --------------------- | --------------------------------------------------------------------- |
| `@cozy-village/zen-garden` | `packages/zen-garden` | Reusable React component library for an interactive zen garden canvas |
| `@cozy-village/utils`      | `packages/utils`      | Shared utility functions                                              |

### Turbo Pipeline

Defined in `turbo.json`:

| Task    | Depends On                    | Outputs   | Cache                 |
| ------- | ----------------------------- | --------- | --------------------- |
| `build` | `^build` (dependencies first) | `dist/**` | Yes                   |
| `dev`   | —                             | —         | Disabled (persistent) |
| `test`  | `^build` (dependencies first) | —         | Yes                   |
| `lint`  | —                             | —         | Yes                   |

## Features

### Villager NPCs (`apps/api/villagers.py`)

- 6 unique villagers with distinct personalities (cheerful, grumpy, shy, adventurous, scholarly, nurturing)
- Daily schedules that vary by season and time of day (dawn through night)
- Dynamic mood system (joyful, content, neutral, lonely, upset)
- Emergent social interactions — villagers who share a location may spontaneously interact
- Bidirectional friendship network with 5 tiers (stranger through best friend)
- Gift preferences that affect friendship progression
- Birthday events with spontaneous gift exchanges among friends

### Weather Engine (`apps/api/weather.py`)

- Seasonal temperature model with smooth sinusoidal curves
- 10 sky conditions from clear to blizzard
- Rare magical events: aurora showers, petal blizzards, moonbow nights
- Festival eligibility tied to weather conditions
- Village mood tracking based on weather history and streaks

### Garden & Farming (`apps/api/garden.py`)

- Grid-based garden with plantable plots and soil types
- Crops progress through growth stages: seed, sprout, growing, flowering, harvestable
- Weather directly affects crop growth (sunny, rainy, stormy, frost, magical)
- Quality tiers: normal, silver, gold, iridescent
- Seasonal crop availability and companion planting bonuses
- Harvested produce can be gifted to villagers or sold at market

### Pet Companions (`apps/api/animals.py`)

- 6 species: cat, dog, rabbit, owl, fox, hedgehog
- Pet personalities: playful, lazy, curious, loyal, mischievous, gentle
- Bond progression from stranger to soulmate
- Daily foraging that discovers items at various rarities
- Pets react to seasons and weather, and interact with villagers

### Economy (`apps/api/economy.py`)

- Village market with seasonal price fluctuations and supply/demand
- Player wallet (100 starting coins) with buy/sell transactions
- 80% sell-back spread on market items
- Item spoilage based on shelf life

### Crafting (`apps/api/crafting.py`)

- Tiered material system: common, uncommon, rare, legendary
- Recipe discovery through crafting experience
- Quality influenced by crafter skill and tool bonuses
- Workstation requirements (workbench, forge, loom, kiln)
- Seasonal material availability

### Unified Game Engine (`apps/api/game.py`)

- Orchestrates all subsystems into a single day-advance loop
- Each day: weather advances, villagers follow schedules, garden grows, pets explore, market updates
- `DailyReport` aggregates events across all systems
- Pet-villager bond effects (pets greeting villagers boost mood)

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20+ (see `.nvmrc`)
- npm 10+

### Install Dependencies

From the repository root:

```bash
# Install Node dependencies (all workspaces)
npm install

# Install Python dependencies
pip install fastapi uvicorn
```

### Development

Run all apps in parallel with Turbo:

```bash
npx turbo dev
```

This starts:

- **API server** at `http://localhost:8000` (FastAPI with hot reload)
- **Web frontend** at `http://localhost:5173` (Vite dev server)

The frontend proxies `/api` requests to the backend automatically.

Or run individual apps:

```bash
# API only
npx turbo dev --filter=@cozy-village/api

# Web only
npx turbo dev --filter=@cozy-village/web
```

### Build

```bash
npx turbo build
```

### CLI Demo

Run the simulation directly from the API app:

```bash
cd apps/api
python game.py
```

This creates a default village, adopts 3 pets, plants a spring garden, and simulates 28 days.

Individual subsystem demos:

```bash
cd apps/api
python weather.py    # Year-long weather simulation
python garden.py     # 8-day garden lifecycle
python animals.py    # 7-day pet manager demo
```

## API Endpoints

| Method | Endpoint                            | Description                        |
| ------ | ----------------------------------- | ---------------------------------- |
| GET    | `/api/health`                       | App health, version, uptime, DB   |
| GET    | `/api/status`                       | Full game state snapshot           |
| POST   | `/api/advance-day`                  | Advance the simulation by one day  |
| POST   | `/api/new-game`                     | Reset to a fresh game              |
| GET    | `/api/weather`                      | Current weather forecast           |
| GET    | `/api/weather/forecast`             | Multi-day forecast                 |
| GET    | `/api/villagers`                    | List all villagers                 |
| GET    | `/api/villagers/{villager_id}`      | Single villager details            |
| POST   | `/api/villagers/{villager_id}/gift` | Give a gift to a villager          |
| GET    | `/api/garden`                       | Garden grid state                  |
| GET    | `/api/garden/crops`                 | Available crops for planting       |
| POST   | `/api/garden/plant`                 | Plant a crop                       |
| GET    | `/api/pets`                         | List adopted pets                  |
| GET    | `/api/pets/adoptable`               | Available pets for adoption        |
| POST   | `/api/pets/adopt`                   | Adopt a pet                        |
| POST   | `/api/pets/{name}/pet`              | Pet an animal                      |
| POST   | `/api/pets/{name}/feed`             | Feed a pet                         |
| POST   | `/api/pets/{name}/play`             | Play with a pet                    |
| GET    | `/api/economy/prices`               | Current market prices              |
| GET    | `/api/economy/summary`              | Economy overview                   |
| GET    | `/api/economy/wallet`               | Player balance and inventory value |
| POST   | `/api/economy/buy`                  | Buy an item                        |
| POST   | `/api/economy/sell`                 | Sell an item                       |
| GET    | `/api/inventory`                    | Player inventory                   |
| GET    | `/api/journal`                      | Read journal entries               |
| POST   | `/api/journal`                      | Add a journal entry                |
| DELETE | `/api/journal/{entry_id}`           | Delete a journal entry             |

## Frontend Components

The React UI (`apps/web`) includes panels for each subsystem:

- **Header** — top-level app header with day/season display
- **ActionBar** — primary action buttons (advance day, etc.)
- **WeatherPanel** — current conditions and forecast
- **VillagersPanel / VillagerCard** — NPC status, mood, friendships, and gifting
- **GiftModal** — gift selection dialog for villagers
- **GardenPanel / GardenPlot** — visual garden grid with planting controls
- **PlantModal** — crop selection dialog for planting
- **PetsPanel / PetCard** — pet management (adopt, feed, play, pet)
- **AdoptModal** — pet adoption dialog
- **EconomyPanel** — market prices and buy/sell interface
- **InventoryShelf** — player inventory display
- **EventLog** — real-time stream of simulation events
- **JournalPanel** — personal journal
- **FocusTimer** — productivity timer
- **TeaBrewingStation** — ambient tea brewing mini-feature
- **AmbientSounds / AmbientLofiMixer / LofiPlayer** — background audio
- **StarryNight** — animated night sky background

The `@cozy-village/zen-garden` package provides a reusable interactive canvas component consumed by the web app.

## Testing

Run all tests across the monorepo:

```bash
npx turbo test
```

Run API tests only:

```bash
npx turbo test --filter=@cozy-village/api
```

Or directly with pytest:

```bash
cd apps/api
python -m pytest
```
