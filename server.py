"""
server.py — FastAPI REST server for the Cozy Village Simulator.

Wraps the CozyVillageGame class in REST endpoints so the React
frontend can query and mutate game state via JSON.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from game import CozyVillageGame, DailyReport
from villagers import (
    Gift, GiftCategory, Season, Personality, Mood,
    FriendshipTier,
)
from garden import (
    ALL_CROPS, SEASONAL_CROPS, GrowthStage, CropQuality,
)
from animals import (
    Species, PetPersonality, BondTier, PetMood, PetActivity,
    create_adoptable_pets,
)
from weather import MagicalEvent

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Cozy Village Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single in-memory game instance
game: CozyVillageGame = CozyVillageGame.create_default(seed=42)

# In-memory journal storage
_journal_entries: list[dict] = []
_journal_next_id: int = 1


# ---------------------------------------------------------------------------
# Pydantic request bodies
# ---------------------------------------------------------------------------

class PlantRequest(BaseModel):
    row: int
    col: int
    crop_name: str


class GiftRequest(BaseModel):
    name: str
    category: str
    quality: int = 1


class AdoptRequest(BaseModel):
    name: str
    species: str
    personality: str


class JournalEntryRequest(BaseModel):
    text: str


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def _serialize_forecast(f):
    if f is None:
        return None
    return {
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

from economy import Market as EconomyMarket

_market = EconomyMarket()


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


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/status")
def get_status():
    _sync_market()
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
        },
        "recent_reports": reports,
    }


@app.post("/api/advance-day")
def advance_day():
    report = game.advance_day()
    _sync_market()
    return {
        "report": _serialize_report(report),
        "status": get_status(),
    }


@app.post("/api/new-game")
def new_game(seed: int = Query(default=42)):
    global game, _market, _journal_entries, _journal_next_id
    game = CozyVillageGame.create_default(seed=seed)
    _market = EconomyMarket()
    _journal_entries = []
    _journal_next_id = 1
    _sync_market()
    return get_status()


# -- Weather ----------------------------------------------------------------

@app.get("/api/weather")
def get_weather():
    return _serialize_forecast(game.current_weather)


@app.get("/api/weather/forecast")
def get_forecast(days: int = Query(default=5, ge=1, le=14)):
    forecasts = game.weather.forecast_ahead(days)
    return [_serialize_forecast(f) for f in forecasts]


# -- Villagers --------------------------------------------------------------

@app.get("/api/villagers")
def get_villagers():
    return {
        vid: _serialize_villager(v)
        for vid, v in game.village.villagers.items()
    }


@app.get("/api/villagers/{villager_id}")
def get_villager(villager_id: str):
    v = game.village.get_villager(villager_id)
    if not v:
        raise HTTPException(status_code=404, detail="Villager not found")
    return _serialize_villager(v)


@app.post("/api/villagers/{villager_id}/gift")
def give_gift(villager_id: str, req: GiftRequest):
    try:
        category = GiftCategory(req.category)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Valid: {[c.value for c in GiftCategory]}",
        )
    gift = Gift(req.name, category, quality=max(1, min(5, req.quality)))
    reaction = game.give_gift_to_villager(villager_id, gift)
    if reaction is None:
        raise HTTPException(status_code=404, detail="Villager not found")
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
        raise HTTPException(status_code=400, detail=f"Unknown crop: {req.crop_name}")
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
        raise HTTPException(
            status_code=400,
            detail=f"Invalid species. Valid: {[s.value for s in Species]}",
        )
    try:
        personality = PetPersonality(req.personality)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid personality. Valid: {[p.value for p in PetPersonality]}",
        )
    try:
        pet = game.adopt_pet(req.name, species, personality)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _serialize_pet(pet)


@app.post("/api/pets/{name}/pet")
def pet_interaction(name: str):
    pet = game.pets.get_pet(name)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return {"message": pet.pet()}


@app.post("/api/pets/{name}/feed")
def feed_pet(name: str):
    pet = game.pets.get_pet(name)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return {"message": pet.feed()}


@app.post("/api/pets/{name}/play")
def play_with_pet(name: str):
    pet = game.pets.get_pet(name)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
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


# -- Journal ----------------------------------------------------------------

@app.get("/api/journal")
def get_journal():
    return _journal_entries


@app.post("/api/journal")
def add_journal_entry(req: JournalEntryRequest):
    global _journal_next_id
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Entry text cannot be empty")
    entry = {
        "id": _journal_next_id,
        "day": game.day,
        "season": game.season.value,
        "text": text,
    }
    _journal_next_id += 1
    _journal_entries.append(entry)
    return entry


@app.delete("/api/journal/{entry_id}")
def delete_journal_entry(entry_id: int):
    global _journal_entries
    for i, entry in enumerate(_journal_entries):
        if entry["id"] == entry_id:
            _journal_entries.pop(i)
            return {"deleted": entry_id}
    raise HTTPException(status_code=404, detail="Journal entry not found")
