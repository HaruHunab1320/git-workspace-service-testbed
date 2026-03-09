"""
server.py — FastAPI REST server for the Cozy Village Simulator.

Wraps the CozyVillageGame class in REST endpoints so the React
frontend can query and mutate game state via JSON.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import Optional

from game import CozyVillageGame, DailyReport
from villagers import (
    Gift, GiftCategory, Season, Personality, Mood,
    FriendshipTier,
)
from garden import (
    ALL_CROPS, SEASONAL_CROPS, GrowthStage, CropQuality,
)
from zen_garden import (
    ZenGarden, ALL_SUCCULENTS, ALL_ROCKS, SucculentStage, RakePattern,
    TileKind,
)
from animals import (
    Species, PetPersonality, BondTier, PetMood, PetActivity,
    create_adoptable_pets,
)
from weather import MagicalEvent, eligible_festivals, compute_village_mood, detect_weather_streak
from errors import (
    CozyVillageError, ValidationError, InvalidEnumError, NotFoundError,
    InsufficientFundsError, InsufficientQuantityError, EmptyInputError,
    CraftingError,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Cozy Village Simulator")

import os as _os

_allowed_origins = _os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(CozyVillageError)
async def cozy_village_error_handler(request, exc: CozyVillageError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )

# Single in-memory game instance
game: CozyVillageGame = CozyVillageGame.create_default(seed=42)

# In-memory journal storage
_journal_entries: list[dict] = []
_journal_next_id: int = 1

# In-memory player inventory: item_key -> {quantity, age_days, purchased_day}
_player_inventory: dict[str, dict] = {}
_player_coins: float = 100.0

# Zen garden instance
_zen_garden: ZenGarden = ZenGarden(5, 7)


# ---------------------------------------------------------------------------
# Pydantic request bodies
# ---------------------------------------------------------------------------

# -- Input validation schemas for all public API request bodies ---------

_VALID_GIFT_CATEGORIES = ["flower", "food", "book", "tool", "gemstone", "handmade", "fish", "foraged"]
_VALID_SPECIES = ["cat", "dog", "rabbit", "owl", "fox", "hedgehog"]
_VALID_PET_PERSONALITIES = ["playful", "lazy", "curious", "loyal", "mischievous", "gentle"]
_VALID_RAKE_PATTERNS = ["circles", "waves", "lines", "spiral"]  # excludes "none"
_VALID_WORKSTATIONS = ["hand-crafted", "workbench", "forge", "loom", "kiln", "enchanting table"]
_VALID_MOODS = ["happy", "sad", "calm", "excited", "anxious", "grateful", "nostalgic", ""]


class PlantRequest(BaseModel):
    row: int = Field(..., ge=0, le=19, description="Garden row index")
    col: int = Field(..., ge=0, le=19, description="Garden column index")
    crop_name: str = Field(
        ..., min_length=1, max_length=50,
        description="Name of the crop to plant",
    )

    @field_validator("crop_name")
    @classmethod
    def strip_crop_name(cls, v: str) -> str:
        return v.strip()


class GiftRequest(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=100,
        description="Name of the gift item",
    )
    category: str = Field(
        ..., min_length=1, max_length=20,
        description=f"Gift category, one of: {_VALID_GIFT_CATEGORIES}",
    )
    quality: int = Field(default=1, ge=1, le=5, description="Gift quality (1-5)")

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in _VALID_GIFT_CATEGORIES:
            raise ValueError(f"Invalid category '{v}'. Must be one of: {_VALID_GIFT_CATEGORIES}")
        return v


class AdoptRequest(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=50,
        pattern=r"^[a-zA-Z][a-zA-Z0-9 _-]*$",
        description="Pet name (alphanumeric, starts with letter)",
    )
    species: str = Field(
        ..., min_length=1, max_length=20,
        description=f"Pet species, one of: {_VALID_SPECIES}",
    )
    personality: str = Field(
        ..., min_length=1, max_length=20,
        description=f"Pet personality, one of: {_VALID_PET_PERSONALITIES}",
    )

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("species")
    @classmethod
    def validate_species(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in _VALID_SPECIES:
            raise ValueError(f"Invalid species '{v}'. Must be one of: {_VALID_SPECIES}")
        return v

    @field_validator("personality")
    @classmethod
    def validate_personality(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in _VALID_PET_PERSONALITIES:
            raise ValueError(f"Invalid personality '{v}'. Must be one of: {_VALID_PET_PERSONALITIES}")
        return v


class JournalEntryRequest(BaseModel):
    text: str = Field(
        ..., min_length=1, max_length=2000,
        description="Journal entry text (1-2000 chars)",
    )
    mood: str = Field(
        default="", max_length=20,
        description="Optional mood tag for the entry",
    )

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Entry text cannot be empty or whitespace-only")
        return v


class BuyRequest(BaseModel):
    item_key: str = Field(
        ..., min_length=1, max_length=50,
        description="Economy item key to purchase",
    )
    quantity: int = Field(default=1, ge=1, le=999, description="Number of items to buy (1-999)")


class SellRequest(BaseModel):
    item_key: str = Field(
        ..., min_length=1, max_length=50,
        description="Economy item key to sell",
    )
    quantity: int = Field(default=1, ge=1, le=999, description="Number of items to sell (1-999)")


class ZenPlaceSucculentRequest(BaseModel):
    row: int = Field(..., ge=0, le=4, description="Zen garden row (0-4)")
    col: int = Field(..., ge=0, le=6, description="Zen garden column (0-6)")
    succulent_name: str = Field(
        ..., min_length=1, max_length=50,
        description="Name of the succulent type to place",
    )

    @field_validator("succulent_name")
    @classmethod
    def strip_succulent_name(cls, v: str) -> str:
        return v.strip()


class ZenPlaceRockRequest(BaseModel):
    row: int = Field(..., ge=0, le=4, description="Zen garden row (0-4)")
    col: int = Field(..., ge=0, le=6, description="Zen garden column (0-6)")
    rock_name: str = Field(
        ..., min_length=1, max_length=50,
        description="Name of the rock type to place",
    )

    @field_validator("rock_name")
    @classmethod
    def strip_rock_name(cls, v: str) -> str:
        return v.strip()


class ZenRakeRequest(BaseModel):
    row: int = Field(..., ge=0, le=4, description="Zen garden row (0-4)")
    col: int = Field(..., ge=0, le=6, description="Zen garden column (0-6)")
    pattern: str = Field(
        ..., min_length=1, max_length=20,
        description=f"Rake pattern, one of: {_VALID_RAKE_PATTERNS}",
    )

    @field_validator("pattern")
    @classmethod
    def validate_pattern(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in _VALID_RAKE_PATTERNS:
            raise ValueError(f"Invalid pattern '{v}'. Must be one of: {_VALID_RAKE_PATTERNS}")
        return v


class ZenRemoveRequest(BaseModel):
    row: int = Field(..., ge=0, le=4, description="Zen garden row (0-4)")
    col: int = Field(..., ge=0, le=6, description="Zen garden column (0-6)")


class GatherRequest(BaseModel):
    material_name: str = Field(
        ..., min_length=1, max_length=50,
        description="Name of the material to gather",
    )
    quantity: int = Field(default=1, ge=1, le=10, description="Amount to gather (1-10)")

    @field_validator("material_name")
    @classmethod
    def strip_material_name(cls, v: str) -> str:
        return v.strip()


class CraftRequest(BaseModel):
    recipe_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Name of the recipe to craft",
    )
    workstation: str = Field(
        default="hand-crafted", max_length=30,
        description=f"Workstation to use, one of: {_VALID_WORKSTATIONS}",
    )

    @field_validator("recipe_name")
    @classmethod
    def strip_recipe_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("workstation")
    @classmethod
    def validate_workstation(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in _VALID_WORKSTATIONS:
            raise ValueError(f"Invalid workstation '{v}'. Must be one of: {_VALID_WORKSTATIONS}")
        return v


class LearnRecipeRequest(BaseModel):
    recipe_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Name of the recipe to learn",
    )

    @field_validator("recipe_name")
    @classmethod
    def strip_recipe_name(cls, v: str) -> str:
        return v.strip()


_VALID_SCENTS = ["lavender", "vanilla", "pine", "cinnamon", "ocean breeze", "honey", "rose", "cedar"]


class CraftCandleRequest(BaseModel):
    scent: str = Field(
        ..., min_length=1, max_length=30,
        description=f"Candle scent, one of: {_VALID_SCENTS}",
    )

    @field_validator("scent")
    @classmethod
    def validate_scent(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in _VALID_SCENTS:
            raise ValueError(f"Invalid scent '{v}'. Must be one of: {_VALID_SCENTS}")
        return v


class CandleActionRequest(BaseModel):
    candle_id: int = Field(..., ge=1, description="ID of the candle")


class DiscoverConstellationRequest(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=100,
        description="Name of the constellation to discover",
    )
    note: str = Field(
        default="", max_length=500,
        description="Optional player note about the discovery",
    )

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class ConstellationNoteRequest(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=100,
        description="Name of the constellation",
    )
    note: str = Field(
        ..., min_length=1, max_length=500,
        description="Player note to save",
    )

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def _serialize_forecast(f, include_festivals=False):
    if f is None:
        return None
    data = {
        "day": f.day,
        "season": f.season.value,
        "sky": f.sky.value,
        "temperature_c": round(f.temperature_c, 1),
        "temperature_f": round(f.temperature_f, 1),
        "feels_like_c": round(f.feels_like_c, 1),
        "humidity": round(f.humidity, 2),
        "wind_speed_kph": round(f.wind_speed_kph, 1),
        "wind_direction": f.wind_direction.value,
        "magical_event": f.magical_event.value if f.magical_event.value != "none" else None,
        "is_magical": f.is_magical,
        "description": f.description,
        "summary": f.short_summary(),
        "severity": round(f.severity, 2),
    }
    if include_festivals:
        data["festivals"] = eligible_festivals(f)
    return data


def _serialize_villager(v):
    friendships = {}
    for tid, record in v.friendships.items():
        friendships[tid] = {
            "target_id": record.target_id,
            "points": record.points,
            "tier": record.tier.value,
            "days_known": record.days_known,
        }
    return {
        "id": v.villager_id,
        "name": v.name,
        "personality": v.personality.value,
        "mood": v.mood.value,
        "energy": v.energy,
        "location": str(v.current_location),
        "dialogue": v.get_dialogue(),
        "friendships": friendships,
        "birthday_season": v.birthday_season.value,
        "birthday_day": v.birthday_day,
    }


def _serialize_plot(p):
    return {
        "row": p.row,
        "col": p.col,
        "soil": p.soil.value,
        "crop": p.crop.name if p.crop else None,
        "crop_description": p.crop.description if p.crop else None,
        "stage": p.stage.value if p.crop else None,
        "growth_progress": round(p.growth_progress, 2) if p.crop else None,
        "days_planted": p.days_planted if p.crop else None,
        "days_to_grow": p.crop.days_to_grow if p.crop else None,
        "watered_today": p.watered_today,
        "is_harvestable": p.is_harvestable,
        "is_empty": p.is_empty,
        "quality_score": round(p.quality_score, 2) if p.crop else None,
    }


def _serialize_garden(g):
    return {
        "rows": g.rows,
        "cols": g.cols,
        "season": g.season.value,
        "day": g.day,
        "total_harvests": g.total_harvests,
        "plots": [[_serialize_plot(g.plots[r][c]) for c in range(g.cols)] for r in range(g.rows)],
    }


def _serialize_pet(p):
    return {
        "name": p.name,
        "species": p.species.value,
        "personality": p.personality.value,
        "mood": p.mood.value,
        "energy": p.energy,
        "bond_points": p.bond_points,
        "bond_tier": p.bond_tier.value,
        "activity": p.activity.value,
        "days_owned": p.days_owned,
        "found_items": [
            {
                "name": item.name,
                "category": item.category,
                "rarity": item.rarity,
                "description": item.description,
                "value": item.value,
            }
            for item in p.found_items
        ],
        "favourite_villager": p.favourite_villager,
    }


def _serialize_report(r: DailyReport):
    return {
        "day": r.day,
        "season": r.season,
        "weather_summary": r.weather_summary,
        "weather_description": r.weather_description,
        "is_magical": r.is_magical,
        "magical_event": r.magical_event,
        "festivals": r.festivals,
        "village_mood": r.village_mood,
        "villager_events": r.villager_events,
        "garden_events": r.garden_events,
        "pet_events": r.pet_events,
        "harvests": r.harvests,
        "found_items": r.found_items,
    }


def _serialize_crop(c):
    return {
        "name": c.name,
        "seasons": [s.value for s in c.seasons],
        "days_to_grow": c.days_to_grow,
        "base_sell_price": c.base_sell_price,
        "water_needs": c.water_needs,
        "regrows": c.regrows,
        "regrow_days": c.regrow_days,
        "description": c.description,
        "is_magical": c.is_magical,
    }


def _serialize_zen_tile(t):
    data = {
        "row": t.row,
        "col": t.col,
        "kind": t.kind.value,
        "rake_pattern": t.rake_pattern.value,
        "is_empty": t.is_empty,
    }
    if t.has_succulent:
        data["succulent"] = t.succulent.name
        data["succulent_emoji"] = t.succulent.emoji
        data["succulent_description"] = t.succulent.description
        data["succulent_stage"] = t.succulent_stage.value
        data["growth_progress"] = round(t.growth_progress, 2)
        data["days_planted"] = t.days_planted
        data["days_to_mature"] = t.succulent.days_to_mature
        data["bloom_color"] = t.succulent.bloom_color
        data["is_rare"] = t.succulent.is_rare
    else:
        data["succulent"] = None
        data["succulent_stage"] = None
        data["growth_progress"] = None
    if t.has_rock:
        data["rock"] = t.rock.name
        data["rock_emoji"] = t.rock.emoji
        data["rock_description"] = t.rock.description
        data["rock_size"] = t.rock.size.value
        data["is_special"] = t.rock.is_special
    else:
        data["rock"] = None
    return data


def _serialize_zen_garden(zg):
    return {
        "rows": zg.rows,
        "cols": zg.cols,
        "day": zg.day,
        "total_placements": zg.total_placements,
        "harmony_score": zg.harmony_score(),
        "harmony_description": zg.harmony_description(),
        "succulent_count": len(zg.succulent_tiles()),
        "rock_count": len(zg.rock_tiles()),
        "tiles": [
            [_serialize_zen_tile(zg.tiles[r][c]) for c in range(zg.cols)]
            for r in range(zg.rows)
        ],
    }


def _serialize_succulent_type(s):
    return {
        "name": s.name,
        "emoji": s.emoji,
        "days_to_mature": s.days_to_mature,
        "water_tolerance": s.water_tolerance,
        "description": s.description,
        "bloom_color": s.bloom_color,
        "is_rare": s.is_rare,
        "rarity_label": s.rarity_label,
    }


def _serialize_rock_type(r):
    return {
        "name": r.name,
        "emoji": r.emoji,
        "size": r.size.value,
        "description": r.description,
        "weight": r.weight,
        "is_special": r.is_special,
    }


def _full_status():
    weather = _serialize_forecast(game.current_weather)
    villagers = {
        vid: _serialize_villager(v)
        for vid, v in game.village.villagers.items()
    }
    garden_data = _serialize_garden(game.garden)
    pets = {
        name: _serialize_pet(p)
        for name, p in game.pets.pets.items()
    }
    reports = [_serialize_report(r) for r in game._daily_reports[-10:]]
    return {
        "day": game.day,
        "season": game.season.value,
        "weather": weather,
        "villagers": villagers,
        "garden": garden_data,
        "pets": pets,
        "economy": {
            "prices": game._economy_market().price_board() if hasattr(game, '_economy_market') else [],
            "summary": game._economy_market().trade_summary() if hasattr(game, '_economy_market') else {},
        },
        "recent_reports": reports,
    }


# ---------------------------------------------------------------------------
# Economy helper — game.py doesn't expose Market directly, so we create one
# that stays in sync with the game season.
# ---------------------------------------------------------------------------

from economy import Market as EconomyMarket, ITEMS as ECONOMY_ITEMS
from swarm import FireflySwarm
from constellations import (
    ConstellationTracker, CONSTELLATIONS, CONSTELLATION_BY_NAME,
    Season as ConstellationSeason, serialize_constellation,
)
from crafting import (
    Crafter, Inventory as CraftingInventory, craft as craft_item,
    ALL_RECIPES, ALL_MATERIALS, seasonal_materials,
    Workstation, Season as CraftSeason,
)
from candles import CandleWorkshop, ALL_SCENTS, SCENT_MAP

_market = EconomyMarket()
_firefly_swarm = FireflySwarm.spawn(count=20, seed=42)
_crafter = Crafter(name="Player")
# Teach default recipes
for _r in ALL_RECIPES:
    if _r.unlocked_by_default:
        _crafter.known_recipes.add(_r.name)

# Candle workshop instance
_candle_workshop = CandleWorkshop(seed=42)

_constellation_tracker = ConstellationTracker()


def _sync_market():
    """Keep the standalone market's season in sync with the game."""
    from economy import Season as ESeason
    season_map = {
        "spring": ESeason.SPRING,
        "summer": ESeason.SUMMER,
        "autumn": ESeason.AUTUMN,
        "winter": ESeason.WINTER,
    }
    _market.season = season_map.get(game.season.value, ESeason.SPRING)
    _market.day = game.day


def _craft_season() -> CraftSeason:
    """Get the current crafting season enum."""
    craft_season_map = {
        "spring": CraftSeason.SPRING,
        "summer": CraftSeason.SUMMER,
        "autumn": CraftSeason.AUTUMN,
        "winter": CraftSeason.WINTER,
    }
    return craft_season_map.get(game.season.value, CraftSeason.SPRING)


def _serialize_crafter(c: Crafter):
    return {
        "name": c.name,
        "skill_level": c.skill_level,
        "experience": c.experience,
        "xp_for_next_level": c._xp_for_next_level,
        "materials": c.inventory.material_summary,
        "crafted_items": [
            {
                "name": item.display_name,
                "recipe": item.recipe.name,
                "quality": item.quality.value,
                "comfort": round(item.comfort, 1),
                "category": item.recipe.category.name.lower(),
                "tool_speed_bonus": round(item.tool_speed_bonus, 2),
            }
            for item in c.inventory.items
        ],
        "known_recipes": sorted(c.known_recipes),
        "equipped_tool": c.equipped_tool.display_name if c.equipped_tool else None,
        "total_comfort": round(c.inventory.total_comfort, 1),
    }


def _serialize_recipe(r):
    return {
        "name": r.name,
        "category": r.category.name.lower(),
        "ingredients": [
            {"material": ing.material.name, "quantity": ing.quantity}
            for ing in r.ingredients
        ],
        "workstation": r.workstation.value,
        "base_craft_time": r.base_craft_time,
        "skill_requirement": r.skill_requirement,
        "comfort_score": r.comfort_score,
        "description": r.description,
        "unlocked_by_default": r.unlocked_by_default,
    }


def _serialize_material(m):
    return {
        "name": m.name,
        "rarity": m.rarity.name.lower(),
        "seasons": [s.name.lower() for s in m.seasons],
        "description": m.description,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/status")
def get_status():
    _sync_market()
    weather = _serialize_forecast(game.current_weather, include_festivals=True)
    if weather is not None:
        mood = compute_village_mood(game._weather_history)
        weather["village_mood"] = mood.value
        sky, streak = detect_weather_streak(game._weather_history)
        weather["weather_streak"] = {"sky": sky.value, "days": streak}
    villagers = {
        vid: _serialize_villager(v)
        for vid, v in game.village.villagers.items()
    }
    garden_data = _serialize_garden(game.garden)
    pets = {
        name: _serialize_pet(p)
        for name, p in game.pets.pets.items()
    }
    reports = [_serialize_report(r) for r in game._daily_reports[-20:]]
    return {
        "day": game.day,
        "season": game.season.value,
        "weather": weather,
        "villagers": villagers,
        "garden": garden_data,
        "pets": pets,
        "economy": {
            "prices": _market.price_board(),
            "summary": _market.trade_summary(),
            "player_coins": round(_player_coins, 2),
        },
        "recent_reports": reports,
        "zen_garden": _serialize_zen_garden(_zen_garden),
    }


@app.post("/api/advance-day")
def advance_day():
    report = game.advance_day()
    _sync_market()
    _zen_garden.advance_day()
    _candle_workshop.advance_day()
    # Age player inventory items and remove spoiled ones
    spoiled_keys = []
    for key, slot in _player_inventory.items():
        slot["age_days"] += 1
        item = ECONOMY_ITEMS.get(key)
        if item and item.shelf_life > 0 and slot["age_days"] >= item.shelf_life:
            spoiled_keys.append(key)
    for key in spoiled_keys:
        del _player_inventory[key]
    return {
        "report": _serialize_report(report),
        "status": get_status(),
    }


@app.post("/api/new-game")
def new_game(seed: int = Query(default=42, ge=0, le=2**31 - 1, description="Random seed for world generation")):
    global game, _market, _journal_entries, _journal_next_id, _player_coins, _player_inventory, _zen_garden, _crafter, _candle_workshop, _constellation_tracker
    game = CozyVillageGame.create_default(seed=seed)
    _market = EconomyMarket()
    _journal_entries = []
    _journal_next_id = 1
    _player_coins = 100.0
    _player_inventory = {}
    _zen_garden = ZenGarden(5, 7)
    _crafter = Crafter(name="Player")
    for _r in ALL_RECIPES:
        if _r.unlocked_by_default:
            _crafter.known_recipes.add(_r.name)
    _candle_workshop = CandleWorkshop(seed=seed)
    _constellation_tracker = ConstellationTracker()
    _sync_market()
    return get_status()


# -- Weather ----------------------------------------------------------------

@app.get("/api/weather")
def get_weather():
    forecast = _serialize_forecast(game.current_weather, include_festivals=True)
    if forecast is not None:
        mood = compute_village_mood(game._weather_history)
        forecast["village_mood"] = mood.value
        sky, streak = detect_weather_streak(game._weather_history)
        forecast["weather_streak"] = {"sky": sky.value, "days": streak}
    return forecast


@app.get("/api/weather/forecast")
def get_forecast(days: int = Query(default=5, ge=1, le=14, description="Number of forecast days (1-14)")):
    forecasts = game.weather.forecast_ahead(days)
    return [_serialize_forecast(f, include_festivals=True) for f in forecasts]


# -- Villagers --------------------------------------------------------------

@app.get("/api/villagers")
def get_villagers():
    return {
        vid: _serialize_villager(v)
        for vid, v in game.village.villagers.items()
    }


@app.get("/api/villagers/{villager_id}")
def get_villager(villager_id: str = Path(..., min_length=1, max_length=50, description="Villager identifier")):
    v = game.village.get_villager(villager_id)
    if not v:
        raise NotFoundError("Villager", villager_id)
    return _serialize_villager(v)


@app.post("/api/villagers/{villager_id}/gift")
def give_gift(req: GiftRequest, villager_id: str = Path(..., min_length=1, max_length=50, description="Villager identifier")):
    try:
        category = GiftCategory(req.category)
    except ValueError:
        raise InvalidEnumError("category", req.category, [c.value for c in GiftCategory])
    gift = Gift(req.name, category, quality=max(1, min(5, req.quality)))
    reaction = game.give_gift_to_villager(villager_id, gift)
    if reaction is None:
        raise NotFoundError("Villager", villager_id)
    return {"reaction": reaction, "gift": str(gift)}


# -- Garden -----------------------------------------------------------------

@app.get("/api/garden")
def get_garden():
    return _serialize_garden(game.garden)


@app.get("/api/garden/crops")
def get_available_crops():
    from garden import Season as GSeason
    season_map = {
        "spring": GSeason.SPRING,
        "summer": GSeason.SUMMER,
        "autumn": GSeason.AUTUMN,
        "winter": GSeason.WINTER,
    }
    gs = season_map.get(game.season.value, GSeason.SPRING)
    crops = SEASONAL_CROPS.get(gs, [])
    return [_serialize_crop(c) for c in crops]


@app.post("/api/garden/plant")
def plant_crop(req: PlantRequest):
    # Find the crop by name
    crop = None
    for c in ALL_CROPS:
        if c.name.lower() == req.crop_name.lower():
            crop = c
            break
    if crop is None:
        raise NotFoundError("Crop", req.crop_name)
    result = game.plant_crop(req.row, req.col, crop)
    return {"message": result}


# -- Pets -------------------------------------------------------------------

@app.get("/api/pets")
def get_pets():
    return {
        name: _serialize_pet(p)
        for name, p in game.pets.pets.items()
    }


@app.get("/api/pets/adoptable")
def get_adoptable():
    adopted_names = set(game.pets.pets.keys())
    available = create_adoptable_pets()
    return [
        {
            "name": p["name"],
            "species": p["species"].value,
            "personality": p["personality"].value,
            "bio": p["bio"],
        }
        for p in available
        if p["name"] not in adopted_names
    ]


@app.post("/api/pets/adopt")
def adopt_pet(req: AdoptRequest):
    try:
        species = Species(req.species)
    except ValueError:
        raise InvalidEnumError("species", req.species, [s.value for s in Species])
    try:
        personality = PetPersonality(req.personality)
    except ValueError:
        raise InvalidEnumError("personality", req.personality, [p.value for p in PetPersonality])
    pet = game.adopt_pet(req.name, species, personality)
    return _serialize_pet(pet)


@app.post("/api/pets/{name}/pet")
def pet_interaction(name: str = Path(..., min_length=1, max_length=50, description="Pet name")):
    pet = game.pets.get_pet(name)
    if not pet:
        raise NotFoundError("Pet", name)
    return {"message": pet.pet()}


@app.post("/api/pets/{name}/feed")
def feed_pet(name: str = Path(..., min_length=1, max_length=50, description="Pet name")):
    pet = game.pets.get_pet(name)
    if not pet:
        raise NotFoundError("Pet", name)
    return {"message": pet.feed()}


@app.post("/api/pets/{name}/play")
def play_with_pet(name: str = Path(..., min_length=1, max_length=50, description="Pet name")):
    pet = game.pets.get_pet(name)
    if not pet:
        raise NotFoundError("Pet", name)
    return {"message": pet.play()}


# -- Economy ----------------------------------------------------------------

@app.get("/api/economy/prices")
def get_prices():
    _sync_market()
    return _market.price_board()


@app.get("/api/economy/summary")
def get_economy_summary():
    _sync_market()
    return _market.trade_summary()


@app.get("/api/economy/wallet")
def get_wallet():
    _sync_market()
    return {
        "coins": round(_player_coins, 2),
        "inventory": _serialize_inventory(),
    }


@app.post("/api/economy/buy")
def economy_buy_item(req: BuyRequest):
    """Quick-buy from the economy panel — also adds items to player inventory."""
    global _player_coins
    _sync_market()
    if req.item_key not in ECONOMY_ITEMS:
        raise NotFoundError("Item", req.item_key)
    if req.quantity < 1:
        raise ValidationError("Quantity must be at least 1")
    item = ECONOMY_ITEMS[req.item_key]
    unit_price = _market.current_price(req.item_key)
    total = round(unit_price * req.quantity, 2)
    if _player_coins < total:
        raise InsufficientFundsError(total, round(_player_coins, 2))
    _player_coins = round(_player_coins - total, 2)
    if req.item_key in _player_inventory:
        _player_inventory[req.item_key]["quantity"] += req.quantity
    else:
        _player_inventory[req.item_key] = {
            "quantity": req.quantity,
            "age_days": 0,
            "purchased_day": game.day,
        }
    return {
        "message": f"Bought {req.quantity} {item.name} for {total:.2f} coins",
        "item_name": item.name,
        "quantity": req.quantity,
        "unit_price": unit_price,
        "total": total,
        "coins": round(_player_coins, 2),
        "remaining_coins": round(_player_coins, 2),
        "inventory": _serialize_inventory(),
    }


@app.post("/api/economy/sell")
def economy_sell_item(req: SellRequest):
    """Sell items from the economy panel."""
    global _player_coins
    _sync_market()
    if req.quantity < 1:
        raise ValidationError("Quantity must be at least 1")
    item = ECONOMY_ITEMS.get(req.item_key)
    if item is None:
        raise NotFoundError("Item", req.item_key)
    slot = _player_inventory.get(req.item_key)
    if slot is None or slot["quantity"] < req.quantity:
        available = slot["quantity"] if slot else 0
        raise InsufficientQuantityError(item.name, req.quantity, available)
    unit_price = _market.current_price(req.item_key)
    sell_total = round(unit_price * 0.70 * req.quantity, 2)
    # Spoiled items sell for nothing
    if item.shelf_life > 0 and slot["age_days"] >= item.shelf_life:
        sell_total = 0
    _player_coins = round(_player_coins + sell_total, 2)
    slot["quantity"] -= req.quantity
    if slot["quantity"] <= 0:
        del _player_inventory[req.item_key]
    return {
        "message": f"Sold {req.quantity} {item.name} for {sell_total:.2f} coins",
        "coins": round(_player_coins, 2),
        "remaining_coins": round(_player_coins, 2),
        "inventory": _serialize_inventory(),
    }


# -- Journal ----------------------------------------------------------------

@app.get("/api/journal")
def get_journal():
    return _journal_entries


@app.post("/api/journal")
def add_journal_entry(req: JournalEntryRequest):
    global _journal_next_id
    text = req.text.strip()
    if not text:
        raise EmptyInputError("Entry text")
    entry = {
        "id": _journal_next_id,
        "day": game.day,
        "season": game.season.value,
        "text": text,
        "mood": req.mood,
    }
    _journal_next_id += 1
    _journal_entries.append(entry)
    return entry


@app.delete("/api/journal/{entry_id}")
def delete_journal_entry(entry_id: int = Path(..., ge=1, description="Journal entry ID")):
    global _journal_entries
    for i, entry in enumerate(_journal_entries):
        if entry["id"] == entry_id:
            _journal_entries.pop(i)
            return {"deleted": entry_id}
    raise NotFoundError("Journal entry", entry_id)


# -- Player Inventory (Cozy Shelf) -----------------------------------------

def _serialize_inventory():
    """Return the player inventory in a frontend-friendly format."""
    items = []
    for key, slot in _player_inventory.items():
        item = ECONOMY_ITEMS.get(key)
        if item is None:
            continue
        shelf_life = item.shelf_life
        is_spoiled = shelf_life > 0 and slot["age_days"] >= shelf_life
        freshness = 1.0
        if shelf_life > 0:
            freshness = max(0.0, 1.0 - slot["age_days"] / shelf_life)
        items.append({
            "key": key,
            "name": item.name,
            "category": item.category.value,
            "quantity": slot["quantity"],
            "age_days": slot["age_days"],
            "shelf_life": shelf_life or "infinite",
            "freshness": round(freshness, 2),
            "is_spoiled": is_spoiled,
            "purchased_day": slot["purchased_day"],
        })
    return items


@app.get("/api/inventory")
def get_inventory():
    _sync_market()
    return {
        "coins": round(_player_coins, 2),
        "items": _serialize_inventory(),
    }


# -- Zen Garden -------------------------------------------------------------

@app.get("/api/zen-garden")
def get_zen_garden():
    return _serialize_zen_garden(_zen_garden)


@app.get("/api/zen-garden/succulents")
def get_available_succulents():
    return [_serialize_succulent_type(s) for s in ALL_SUCCULENTS]


@app.get("/api/zen-garden/rocks")
def get_available_rocks():
    return [_serialize_rock_type(r) for r in ALL_ROCKS]


@app.post("/api/zen-garden/place-succulent")
def zen_place_succulent(req: ZenPlaceSucculentRequest):
    succulent = None
    for s in ALL_SUCCULENTS:
        if s.name.lower() == req.succulent_name.lower():
            succulent = s
            break
    if succulent is None:
        raise NotFoundError("Succulent", req.succulent_name)
    result = _zen_garden.place_succulent(req.row, req.col, succulent)
    return {"message": result, "zen_garden": _serialize_zen_garden(_zen_garden)}


@app.post("/api/zen-garden/place-rock")
def zen_place_rock(req: ZenPlaceRockRequest):
    rock = None
    for r in ALL_ROCKS:
        if r.name.lower() == req.rock_name.lower():
            rock = r
            break
    if rock is None:
        raise NotFoundError("Rock", req.rock_name)
    result = _zen_garden.place_rock(req.row, req.col, rock)
    return {"message": result, "zen_garden": _serialize_zen_garden(_zen_garden)}


@app.post("/api/zen-garden/rake")
def zen_rake(req: ZenRakeRequest):
    try:
        pattern = RakePattern(req.pattern)
    except ValueError:
        raise InvalidEnumError("pattern", req.pattern, [p.value for p in RakePattern if p != RakePattern.NONE])
    result = _zen_garden.rake_tile(req.row, req.col, pattern)
    return {"message": result, "zen_garden": _serialize_zen_garden(_zen_garden)}


@app.post("/api/zen-garden/remove")
def zen_remove(req: ZenRemoveRequest):
    result = _zen_garden.remove_item(req.row, req.col)
    return {"message": result, "zen_garden": _serialize_zen_garden(_zen_garden)}


# -- Crafting ---------------------------------------------------------------

@app.get("/api/crafting")
def get_crafting():
    """Return current crafter state."""
    season = _craft_season()
    available = seasonal_materials(season)
    return {
        "crafter": _serialize_crafter(_crafter),
        "season": season.name.lower(),
        "available_materials": [_serialize_material(m) for m in available],
    }


@app.get("/api/crafting/recipes")
def get_recipes():
    """Return all recipes with whether the player knows them."""
    recipes = []
    for r in ALL_RECIPES:
        data = _serialize_recipe(r)
        data["known"] = _crafter.knows_recipe(r)
        data["can_craft"] = (
            _crafter.knows_recipe(r)
            and _crafter.skill_level >= r.skill_requirement
            and _crafter.inventory.has_materials_for(r)
        )
        # Show how many of each ingredient the player has
        data["ingredient_status"] = [
            {
                "material": ing.material.name,
                "needed": ing.quantity,
                "have": _crafter.inventory.material_count(ing.material),
            }
            for ing in r.ingredients
        ]
        recipes.append(data)
    return recipes


@app.get("/api/crafting/materials")
def get_materials():
    """Return all materials with seasonal availability."""
    season = _craft_season()
    return [
        {
            **_serialize_material(m),
            "available_now": m.available_in(season),
            "in_inventory": _crafter.inventory.material_count(m),
        }
        for m in ALL_MATERIALS
    ]


@app.post("/api/crafting/gather")
def gather_material(req: GatherRequest):
    """Gather a material (if available this season)."""
    season = _craft_season()
    material = None
    for m in ALL_MATERIALS:
        if m.name.lower() == req.material_name.lower():
            material = m
            break
    if material is None:
        raise NotFoundError("Material", req.material_name)
    msg = _crafter.gather(material, season, quantity=max(1, min(10, req.quantity)))
    return {
        "message": msg,
        "crafter": _serialize_crafter(_crafter),
    }


@app.post("/api/crafting/craft")
def do_craft(req: CraftRequest):
    """Craft an item from a known recipe."""
    recipe = None
    for r in ALL_RECIPES:
        if r.name.lower() == req.recipe_name.lower():
            recipe = r
            break
    if recipe is None:
        raise NotFoundError("Recipe", req.recipe_name)
    try:
        workstation = Workstation(req.workstation)
    except ValueError:
        raise InvalidEnumError("workstation", req.workstation, [w.value for w in Workstation])
    season = _craft_season()
    result = craft_item(_crafter, recipe, available_workstation=workstation, season=season)
    if not result.success:
        raise CraftingError("; ".join(result.errors))
    return {
        "message": result.summary,
        "item": {
            "name": result.item.display_name,
            "quality": result.item.quality.value,
            "comfort": round(result.item.comfort, 1),
            "category": result.item.recipe.category.name.lower(),
        },
        "xp_gained": result.xp_gained,
        "craft_time": result.craft_time,
        "level_up_messages": list(result.level_up_messages),
        "crafter": _serialize_crafter(_crafter),
    }


@app.post("/api/crafting/learn")
def learn_recipe(req: LearnRecipeRequest):
    """Learn a locked recipe."""
    recipe = None
    for r in ALL_RECIPES:
        if r.name.lower() == req.recipe_name.lower():
            recipe = r
            break
    if recipe is None:
        raise NotFoundError("Recipe", req.recipe_name)
    msg = _crafter.learn_recipe(recipe)
    return {"message": msg, "crafter": _serialize_crafter(_crafter)}


@app.post("/api/crafting/equip")
def equip_tool(tool_index: int = Query(default=0, ge=0, le=99, description="Index of crafted tool to equip")):
    """Equip a crafted tool by index in the crafted items list."""
    tools = [item for item in _crafter.inventory.items if item.recipe.category.name == "TOOL"]
    if not tools:
        raise ValidationError("No tools crafted yet.")
    if tool_index >= len(tools):
        raise ValidationError(f"Tool index out of range (have {len(tools)} tools).")
    msg = _crafter.equip_tool(tools[tool_index])
    return {"message": msg, "crafter": _serialize_crafter(_crafter)}


# -- Firefly Swarm ----------------------------------------------------------

@app.get("/api/swarm")
def get_swarm():
    """Return the current firefly swarm state."""
    return {
        "count": _firefly_swarm.count,
        "average_glow": _firefly_swarm.average_glow,
        "brightest": _firefly_swarm.brightest(),
        "fireflies": _firefly_swarm.snapshot(),
    }


@app.post("/api/swarm/tick")
def swarm_tick(steps: int = Query(default=1, ge=1, le=50, description="Number of simulation ticks (1-50)")):
    """Advance the firefly swarm by one or more ticks."""
    for _ in range(steps):
        _firefly_swarm.tick()
    return {
        "steps": steps,
        "count": _firefly_swarm.count,
        "average_glow": _firefly_swarm.average_glow,
        "brightest": _firefly_swarm.brightest(),
        "fireflies": _firefly_swarm.snapshot(),
    }


# -- Candle Workshop -------------------------------------------------------

def _serialize_candle(c):
    return {
        "id": c.id,
        "name": c.scent.name,
        "emoji": c.scent.emoji,
        "scent": c.scent.scent.value,
        "color": c.scent.color,
        "dark_color": c.scent.dark_color,
        "status": c.status,
        "burn_remaining": c.burn_remaining,
        "burn_days": c.scent.burn_days,
        "burn_fraction": round(c.burn_fraction, 2),
        "mood_boost": c.scent.mood_boost,
        "crafted_day": c.crafted_day,
    }


def _serialize_scent(s):
    return {
        "scent": s.scent.value,
        "name": s.name,
        "emoji": s.emoji,
        "color": s.color,
        "dark_color": s.dark_color,
        "burn_days": s.burn_days,
        "mood_boost": s.mood_boost,
        "description": s.description,
        "season_bonus": s.season_bonus,
    }


@app.get("/api/candles")
def get_candle_workshop():
    """Return candle workshop state."""
    season = game.season.value if game.season else ""
    return {
        "candles": [_serialize_candle(c) for c in _candle_workshop.candles],
        "summary": _candle_workshop.summary(),
        "mood_effects": _candle_workshop.mood_effects(season),
    }


@app.get("/api/candles/scents")
def get_candle_scents():
    """Return all available candle scents."""
    return [_serialize_scent(s) for s in ALL_SCENTS]


@app.post("/api/candles/craft")
def craft_candle(req: CraftCandleRequest):
    """Craft a new scented candle."""
    try:
        candle, message = _candle_workshop.craft(req.scent, day=game.day)
    except ValueError as e:
        raise NotFoundError("Scent", req.scent)
    return {
        "message": message,
        "candle": _serialize_candle(candle),
    }


@app.post("/api/candles/light")
def light_candle(req: CandleActionRequest):
    """Light an unlit candle."""
    try:
        message = _candle_workshop.light(req.candle_id)
    except ValueError:
        raise NotFoundError("Candle", req.candle_id)
    return {"message": message}


@app.post("/api/candles/extinguish")
def extinguish_candle(req: CandleActionRequest):
    """Extinguish a lit candle."""
    try:
        message = _candle_workshop.extinguish(req.candle_id)
    except ValueError:
        raise NotFoundError("Candle", req.candle_id)
    return {"message": message}


@app.post("/api/candles/remove")
def remove_candle(req: CandleActionRequest):
    """Remove a spent candle."""
    try:
        message = _candle_workshop.remove(req.candle_id)
    except ValueError:
        raise NotFoundError("Candle", req.candle_id)
    return {"message": message}


# -- Constellations ---------------------------------------------------------

def _constellation_season() -> ConstellationSeason:
    season_map = {
        "spring": ConstellationSeason.SPRING,
        "summer": ConstellationSeason.SUMMER,
        "autumn": ConstellationSeason.AUTUMN,
        "winter": ConstellationSeason.WINTER,
    }
    return season_map.get(game.season.value, ConstellationSeason.SPRING)


@app.get("/api/constellations")
def get_constellations():
    """Return constellations visible this season with discovery status."""
    season = _constellation_season()
    visible = _constellation_tracker.visible_constellations(season)
    return {
        "season": season.value,
        "catalog": _constellation_tracker.catalog_summary(),
        "constellations": [
            serialize_constellation(
                c,
                discovered=_constellation_tracker.is_discovered(c.name),
                discovery=_constellation_tracker.discoveries.get(c.name),
            )
            for c in visible
        ],
    }


@app.get("/api/constellations/all")
def get_all_constellations():
    """Return all constellations across all seasons."""
    return {
        "catalog": _constellation_tracker.catalog_summary(),
        "constellations": [
            serialize_constellation(
                c,
                discovered=_constellation_tracker.is_discovered(c.name),
                discovery=_constellation_tracker.discoveries.get(c.name),
            )
            for c in CONSTELLATIONS
        ],
    }


@app.post("/api/constellations/discover")
def discover_constellation(req: DiscoverConstellationRequest):
    """Discover a constellation by name."""
    if req.name not in CONSTELLATION_BY_NAME:
        raise NotFoundError("Constellation", req.name)
    season = _constellation_season()
    message = _constellation_tracker.discover(req.name, game.day, season, note=req.note)
    constellation = CONSTELLATION_BY_NAME[req.name]
    return {
        "message": message,
        "constellation": serialize_constellation(
            constellation,
            discovered=_constellation_tracker.is_discovered(req.name),
            discovery=_constellation_tracker.discoveries.get(req.name),
        ),
        "catalog": _constellation_tracker.catalog_summary(),
    }


@app.post("/api/constellations/note")
def constellation_note(req: ConstellationNoteRequest):
    """Add a personal note to a discovered constellation."""
    if req.name not in CONSTELLATION_BY_NAME:
        raise NotFoundError("Constellation", req.name)
    message = _constellation_tracker.add_note(req.name, req.note)
    return {"message": message}

