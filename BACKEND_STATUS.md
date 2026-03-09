# Backend Status Report

**Project:** Cozy Village Simulator
**Analyzer:** backend-analyzer
**Date:** 2026-03-01
**Branch:** `milady/exec-1772416093159/coding-agent`

---

## Overview

The backend is a **Python FastAPI application** (`apps/api/`) serving a single-player cozy village simulation game. It exposes a REST API consumed by a React/Vite frontend via a dev proxy. All game state is held in-memory with no persistence layer.

## Technology Stack

| Component   | Technology                                              |
| ----------- | ------------------------------------------------------- |
| Framework   | FastAPI                                                 |
| Server      | Uvicorn                                                 |
| Language    | Python (Node 20 via `.nvmrc` for monorepo tooling only) |
| Data Models | Python dataclasses + Pydantic request models            |
| Database    | None (in-memory globals)                                |
| Auth        | None                                                    |
| Testing     | pytest                                                  |
| Monorepo    | Turborepo + npm workspaces                              |

**Dependencies** (`requirements.txt`): `fastapi`, `uvicorn[standard]` — intentionally minimal.

## Architecture

### State Management

All state lives in module-level globals in `server.py`:

- `game: CozyVillageGame` — single game instance (seed=42)
- `_journal_entries: list[dict]` — player journal
- `_player_inventory: dict` — item inventory with age tracking
- `_player_coins: float` — wallet (starts at 100.0)
- `_zen_garden: ZenGarden` — 5x7 zen garden grid
- `_market: EconomyMarket` — market prices synced to game season
- `_firefly_swarm: FireflySwarm` — particle simulation (20 fireflies)
- `_candle_workshop: CandleWorkshop` — candle crafting and burn tracking
- `_constellation_tracker: ConstellationTracker` — player's constellation discovery progress

State resets on process restart. The `/api/new-game` endpoint resets all globals in-place.

### Domain Modules

The backend is split into eight well-separated simulation subsystems:

| Module          | Purpose                                                                      | Lines  |
| --------------- | ---------------------------------------------------------------------------- | ------ |
| `game.py`       | Orchestrator — composes subsystems into `advance_day()` loop                 | ~427   |
| `villagers.py`  | NPC personalities, schedules, friendships, gifts, moods                      | Large  |
| `weather.py`    | Seasonal weather engine, magical events, village mood                        | Large  |
| `garden.py`     | Farming: crop types, growth stages, watering, harvesting, companion planting | Large  |
| `animals.py`    | Pet companions: adoption, bonding, foraging, species profiles                | Large  |
| `economy.py`    | Market trading: items, seasonal pricing, spoilage, recipes                   | Large  |
| `crafting.py`   | Recipe and material crafting system                                          | Medium |
| `zen_garden.py`     | Zen garden: succulents, rocks, raking patterns, harmony scoring              | Medium |
| `constellations.py` | Seasonal constellation discovery with lore, star maps, and player tracking   | Medium |
| `swarm.py`          | Firefly particle physics simulation                                          | Small  |
| `candles.py`        | Candle workshop: scented candle crafting, burn mechanics, mood effects        | Medium |
| `math_utils.py` | Single `clamp()` utility                                                     | Tiny   |

### Game Loop

`CozyVillageGame.advance_day()` runs a deterministic day simulation:

1. Advance weather engine → produce `Forecast`
2. Map sky conditions to garden `WeatherEffect` and pet weather strings
3. Advance villagers through 5 time slots (dawn → night)
4. Water garden, grow crops, auto-harvest ripe plots
5. Advance pets — daily activities, foraging, villager greetings
6. Apply pet-villager bond effects
7. Check festival eligibility
8. Compute village mood from weather history
9. Return `DailyReport` aggregate

## API Surface

**45 endpoints** across 11 domains, all under `/api/`:

### Game Management (3)

- `GET /api/status` — full state snapshot
- `POST /api/advance-day` — simulate one day
- `POST /api/new-game?seed=42` — reset game

### Weather (2)

- `GET /api/weather` — current conditions + mood + streak
- `GET /api/weather/forecast?days=5` — multi-day forecast (1–14)

### Villagers (3)

- `GET /api/villagers` — all villager states
- `GET /api/villagers/{villager_id}` — single villager
- `POST /api/villagers/{villager_id}/gift` — give gift

### Garden (3)

- `GET /api/garden` — grid state
- `GET /api/garden/crops` — seasonal crop list
- `POST /api/garden/plant` — plant a crop

### Pets (6)

- `GET /api/pets` — adopted pets
- `GET /api/pets/adoptable` — available for adoption
- `POST /api/pets/adopt` — adopt a pet
- `POST /api/pets/{name}/pet` — pet interaction
- `POST /api/pets/{name}/feed` — feed
- `POST /api/pets/{name}/play` — play

### Economy (5)

- `GET /api/economy/prices` — market price board
- `GET /api/economy/summary` — trade summary
- `GET /api/economy/wallet` — coins + inventory
- `POST /api/economy/buy` — buy item
- `POST /api/economy/sell` — sell item (70% of market price, spoiled = 0)

### Journal (3)

- `GET /api/journal` — all entries
- `POST /api/journal` — add entry
- `DELETE /api/journal/{entry_id}` — delete entry

### Zen Garden (5)

- `GET /api/zen-garden` — full state + harmony score
- `GET /api/zen-garden/succulents` — available types
- `GET /api/zen-garden/rocks` — available types
- `POST /api/zen-garden/place-succulent` — place succulent
- `POST /api/zen-garden/place-rock` — place rock
- `POST /api/zen-garden/rake` — rake pattern
- `POST /api/zen-garden/remove` — remove tile item

### Constellations (4)

- `GET /api/constellations` — visible constellations for the current season with discovery state and catalog progress
- `GET /api/constellations/all` — all 12 constellations across all seasons
- `POST /api/constellations/discover` — discover a constellation (must be visible in the current season)
- `POST /api/constellations/note` — save a personal note on a discovered constellation

### Firefly Swarm (2)

- `GET /api/swarm` — current state
- `POST /api/swarm/tick?steps=1` — advance 1–50 ticks

### Candle Workshop (6)

- `GET /api/candles` — workshop state (candles, summary, mood effects)
- `GET /api/candles/scents` — available scent profiles (8 scents)
- `POST /api/candles/craft` — craft a new scented candle
- `POST /api/candles/light` — light an unlit candle
- `POST /api/candles/extinguish` — extinguish a lit candle
- `POST /api/candles/remove` — remove a spent candle

### Inventory (1)

- `GET /api/inventory` — player coins + items with freshness

## Test Coverage

Seven test files cover all simulation domains:

| Test File            | Module     | Focus Areas                                                          |
| -------------------- | ---------- | -------------------------------------------------------------------- |
| `test_animals.py`    | animals    | Bond tiers, species profiles, mood, foraging                         |
| `test_economy.py`    | economy    | Seasonal pricing, ingredient costs, spoilage                         |
| `test_game.py`       | game       | Creation, weather mapping, day advance, player actions               |
| `test_garden.py`     | garden     | Seasonal crops, growth, watering, harvesting, companion planting     |
| `test_villagers.py`  | villagers  | Schedules (full year), weather integration, birthday gifts           |
| `test_weather.py`    | weather    | Calendar, temperature, sky, magical events, festivals, mood, streaks |
| `test_zen_garden.py`     | zen_garden     | Succulents, rocks, tiles, raking, harmony                            |
| `test_constellations.py` | constellations | Data integrity, discovery logic, season gating, serialization        |
| `test_candles.py`        | candles        | Crafting, lighting, burn-down, mood effects, workshop state          |

**Not tested:** `server.py` endpoints (no integration/API tests), `crafting.py`, `swarm.py`, `math_utils.py`.

Run: `cd apps/api && python -m pytest`

## CORS Configuration

Wide open — appropriate for single-player local dev:

```python
allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
```

## Known Limitations and Observations

1. **No persistence** — all state is lost on restart. No database, no file-based save, no serialization.
2. **No authentication** — fully open API with wildcard CORS.
3. **No environment variables** — all config is hard-coded (seed, ports, grid sizes, starting coins).
4. **Not thread-safe** — single game instance with mutable globals. Concurrent POST requests could produce race conditions.
5. **No API tests** — unit tests cover domain logic but no integration tests exercise the FastAPI endpoints.
6. **Dual Season enums** — each module defines its own `Season` enum, requiring mapping functions in `game.py` (`_to_weather_season`, `_to_garden_season`, `_to_animal_season`).
7. **Economy market sync** — `_market` in `server.py` is a separate instance from the game, manually synced via `_sync_market()` before economy endpoints.
8. **Crafting and candle workshop** — both `crafting.py` and `candles.py` now have full API route coverage in `server.py`.
9. **No deployment config** — no Dockerfile, CI/CD, or cloud configuration.
10. **Zen garden not connected to game loop** — `_zen_garden.advance_day()` is called in the `advance_day` endpoint but the zen garden is a separate instance from the game engine, not integrated into `CozyVillageGame`.

## File Inventory

```
apps/api/
├── server.py           # FastAPI app, all routes, serialization helpers
├── game.py             # Game engine orchestrator
├── villagers.py        # NPC system
├── weather.py          # Weather engine
├── garden.py           # Farming system
├── animals.py          # Pet companion system
├── economy.py          # Market and trading
├── crafting.py         # Recipe crafting (no API routes)
├── constellations.py   # Seasonal constellation discovery system
├── zen_garden.py       # Zen garden gameplay
├── swarm.py            # Firefly particle simulation
├── math_utils.py       # clamp() utility
├── requirements.txt    # fastapi, uvicorn[standard]
├── package.json        # npm script stubs (dev, test)
├── README.md           # Project documentation
├── test_animals.py     # Animal tests
├── test_economy.py     # Economy tests
├── test_game.py        # Game engine tests
├── test_garden.py      # Garden tests
├── test_villagers.py   # Villager tests
├── test_weather.py          # Weather tests
├── test_zen_garden.py       # Zen garden tests
├── test_constellations.py   # Constellation discovery tests
├── candles.py               # Candle workshop system
└── test_candles.py          # Candle workshop tests
```

## Summary

The backend is a well-structured, modular simulation engine with clean separation of concerns across eight gameplay domains. The codebase is functional and well-tested at the unit level. Primary gaps are the lack of persistence, API-level testing, and deployment infrastructure — all consistent with a local development prototype.
