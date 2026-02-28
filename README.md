# Cozy Village Simulator

A multi-agent village simulation demo featuring autonomous NPCs, dynamic weather, gardening, pet companions, an economy system, and crafting — all wired together into a living, breathing village called **Willowbrook**.

## Features

### Villager NPCs (`villagers.py`)
- 6 unique villagers with distinct personalities (cheerful, grumpy, shy, adventurous, scholarly, nurturing)
- Daily schedules that vary by season and time of day (dawn through night)
- Dynamic mood system (joyful, content, neutral, lonely, upset)
- Emergent social interactions — villagers who share a location may spontaneously interact
- Bidirectional friendship network with 5 tiers (stranger through best friend)
- Gift preferences that affect friendship progression
- Birthday events with spontaneous gift exchanges among friends

### Weather Engine (`weather.py`)
- Seasonal temperature model with smooth sinusoidal curves
- 10 sky conditions from clear to blizzard
- Rare magical events: aurora showers, petal blizzards, moonbow nights
- Festival eligibility tied to weather conditions
- Village mood tracking based on weather history and streaks

### Garden & Farming (`garden.py`)
- Grid-based garden with plantable plots and soil types
- Crops progress through growth stages: seed, sprout, growing, flowering, harvestable
- Weather directly affects crop growth (sunny, rainy, stormy, frost, magical)
- Quality tiers: normal, silver, gold, iridescent
- Seasonal crop availability and companion planting bonuses
- Harvested produce can be gifted to villagers or sold at market

### Pet Companions (`animals.py`)
- 6 species: cat, dog, rabbit, owl, fox, hedgehog
- Pet personalities: playful, lazy, curious, loyal, mischievous, gentle
- Bond progression from stranger to soulmate
- Daily foraging that discovers items at various rarities
- Pets react to seasons and weather, and interact with villagers

### Economy (`economy.py`)
- Village market with seasonal price fluctuations and supply/demand
- Player wallet (100 starting coins) with buy/sell transactions
- 80% sell-back spread on market items
- Item spoilage based on shelf life

### Crafting (`crafting.py`)
- Tiered material system: common, uncommon, rare, legendary
- Recipe discovery through crafting experience
- Quality influenced by crafter skill and tool bonuses
- Workstation requirements (workbench, forge, loom, kiln)
- Seasonal material availability

### Unified Game Engine (`game.py`)
- Orchestrates all subsystems into a single day-advance loop
- Each day: weather advances, villagers follow schedules, garden grows, pets explore, market updates
- `DailyReport` aggregates events across all systems
- Pet-villager bond effects (pets greeting villagers boost mood)

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ (for the frontend)

### Run the CLI demo
```bash
python game.py
```
This creates a default village, adopts 3 pets, plants a spring garden, and simulates 28 days.

Individual subsystem demos:
```bash
python weather.py    # Year-long weather simulation
python garden.py     # 8-day garden lifecycle
python animals.py    # 7-day pet manager demo
```

### Run the Web UI

Start the FastAPI server:
```bash
pip install fastapi uvicorn
python -m uvicorn server:app --reload
```

Start the React frontend:
```bash
cd frontend
npm install
npm run dev
```

The frontend connects to the API at `http://localhost:8000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Full game state snapshot |
| POST | `/api/advance-day` | Advance the simulation by one day |
| POST | `/api/new-game` | Reset to a fresh game |
| GET | `/api/weather` | Current weather forecast |
| GET | `/api/weather/forecast` | Multi-day forecast |
| GET | `/api/villagers` | List all villagers |
| GET | `/api/villagers/{villager_id}` | Single villager details |
| POST | `/api/villagers/{villager_id}/gift` | Give a gift to a villager |
| GET | `/api/garden` | Garden grid state |
| GET | `/api/garden/crops` | Available crops for planting |
| POST | `/api/garden/plant` | Plant a crop |
| GET | `/api/pets` | List adopted pets |
| GET | `/api/pets/adoptable` | Available pets for adoption |
| POST | `/api/pets/adopt` | Adopt a pet |
| POST | `/api/pets/{name}/pet` | Pet an animal |
| POST | `/api/pets/{name}/feed` | Feed a pet |
| POST | `/api/pets/{name}/play` | Play with a pet |
| GET | `/api/economy/prices` | Current market prices |
| GET | `/api/economy/summary` | Economy overview |
| GET | `/api/economy/wallet` | Player balance and inventory value |
| POST | `/api/economy/buy` | Buy an item |
| POST | `/api/economy/sell` | Sell an item |
| GET | `/api/inventory` | Player inventory |
| GET | `/api/journal` | Read journal entries |
| POST | `/api/journal` | Add a journal entry |
| DELETE | `/api/journal/{entry_id}` | Delete a journal entry |

## Frontend Components

The React UI includes panels for each subsystem:

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

## Testing

```bash
python -m pytest test_weather.py test_villagers.py test_garden.py test_animals.py test_economy.py test_game.py
```

## Project Structure

```
.
├── game.py              # Unified game engine
├── villagers.py         # NPC system with schedules & friendships
├── weather.py           # Seasonal weather with magical events
├── garden.py            # Farming and crop growth
├── animals.py           # Pet companion system
├── economy.py           # Market and trading
├── crafting.py          # Recipe and crafting system
├── server.py            # FastAPI REST server
├── test_*.py            # Test suites for each module
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx      # Main application shell
        ├── api.js       # API client wrapper
        └── components/  # React UI components
```
