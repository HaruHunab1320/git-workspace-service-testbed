"""
game.py — Cozy Village Simulator: Unified Game Engine

Ties together villagers, weather, economy, crafting, gardening, and pets
into a single living, breathing village simulation.  Each day, weather
affects the garden, villagers follow their schedules, pets explore and
forage, and the market hums with trade.

Usage::

    game = CozyVillageGame.create_default()
    for _ in range(28):
        report = game.advance_day()
        print(report)
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Optional

# Import the village systems — each has its own Season enum, so we
# canonicalise on the villagers module's version for the game layer.
from villagers import (
    Season, TimeOfDay, Village, Villager, Mood, Gift, GiftCategory,
    create_sample_village,
)
from weather import (
    WeatherEngine, Forecast, Sky, MagicalEvent,
    eligible_festivals, compute_village_mood, VillageMood,
)
from garden import (
    Garden, WeatherEffect, CropType, Harvest, CropQuality,
    SEASONAL_CROPS, ALL_CROPS,
)
from animals import (
    PetManager, Pet, Species, PetPersonality, FoundItem,
    create_adoptable_pets,
)


# ---------------------------------------------------------------------------
# Sky → simplified weather mapping (for garden & pets)
# ---------------------------------------------------------------------------

_SKY_TO_WEATHER_EFFECT: dict[Sky, WeatherEffect] = {
    Sky.CLEAR: WeatherEffect.SUNNY,
    Sky.PARTLY_CLOUDY: WeatherEffect.SUNNY,
    Sky.OVERCAST: WeatherEffect.RAINY,
    Sky.DRIZZLE: WeatherEffect.RAINY,
    Sky.RAIN: WeatherEffect.RAINY,
    Sky.THUNDERSTORM: WeatherEffect.STORMY,
    Sky.SNOW: WeatherEffect.FROST,
    Sky.BLIZZARD: WeatherEffect.STORMY,
    Sky.FOG: WeatherEffect.RAINY,
    Sky.HAIL: WeatherEffect.STORMY,
}

_SKY_TO_PET_WEATHER: dict[Sky, str] = {
    Sky.CLEAR: "sunny",
    Sky.PARTLY_CLOUDY: "sunny",
    Sky.OVERCAST: "cloudy",
    Sky.DRIZZLE: "rainy",
    Sky.RAIN: "rainy",
    Sky.THUNDERSTORM: "stormy",
    Sky.SNOW: "frost",
    Sky.BLIZZARD: "stormy",
    Sky.FOG: "foggy",
    Sky.HAIL: "stormy",
}

# Weather module uses its own Season enum, so we need a mapping.
_SEASON_MAP = {
    Season.SPRING: "spring",
    Season.SUMMER: "summer",
    Season.AUTUMN: "autumn",
    Season.WINTER: "winter",
}


def _to_weather_season(s: Season):
    """Convert villagers.Season to weather.Season."""
    from weather import Season as WSeason
    return WSeason(s.value)


def _to_garden_season(s: Season):
    """Convert villagers.Season to garden.Season."""
    from garden import Season as GSeason
    return GSeason(s.value)


def _to_animal_season(s: Season):
    """Convert villagers.Season to animals.Season."""
    from animals import Season as ASeason
    return ASeason(s.value)


# ---------------------------------------------------------------------------
# Daily report
# ---------------------------------------------------------------------------

@dataclass
class DailyReport:
    """Summary of everything that happened in one day."""
    day: int
    season: str
    weather_summary: str
    weather_description: str
    is_magical: bool
    magical_event: str
    festivals: list[str]
    village_mood: str
    villager_events: list[str]
    garden_events: list[str]
    pet_events: list[str]
    harvests: list[str]
    found_items: list[str]

    def render(self) -> str:
        """Return a pretty-printed daily report."""
        sep = "-" * 60
        lines = [
            sep,
            f"  Day {self.day} of {self.season}",
            f"  Weather: {self.weather_summary}",
            f"  {self.weather_description}",
        ]
        if self.is_magical:
            lines.append(f"  Magical event: {self.magical_event}!")
        if self.festivals:
            lines.append(f"  Festivals today: {', '.join(self.festivals)}")
        lines.append(f"  Village mood: {self.village_mood}")
        lines.append(sep)

        if self.villager_events:
            lines.append("  Villagers:")
            for e in self.villager_events[:8]:  # cap for readability
                lines.append(f"    {e}")
        if self.garden_events:
            lines.append("  Garden:")
            for e in self.garden_events[:6]:
                lines.append(f"    {e}")
        if self.harvests:
            lines.append("  Harvests:")
            for h in self.harvests:
                lines.append(f"    {h}")
        if self.pet_events:
            lines.append("  Pets:")
            for e in self.pet_events[:6]:
                lines.append(f"    {e}")
        if self.found_items:
            lines.append("  Found items:")
            for i in self.found_items:
                lines.append(f"    {i}")

        lines.append(sep)
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# The main game engine
# ---------------------------------------------------------------------------

class CozyVillageGame:
    """Orchestrates a full cozy village simulation across all subsystems."""

    def __init__(
        self,
        village: Village,
        weather_engine: WeatherEngine,
        garden: Garden,
        pet_manager: PetManager,
        *,
        seed: int | None = None,
    ) -> None:
        self.village = village
        self.weather = weather_engine
        self.garden = garden
        self.pets = pet_manager
        self._rng = random.Random(seed)
        self._weather_history: list[Forecast] = []
        self._daily_reports: list[DailyReport] = []
        self._day: int = 0

    # -- Factory --------------------------------------------------------------

    @classmethod
    def create_default(cls, seed: int = 42) -> CozyVillageGame:
        """Create a ready-to-play game with all default content."""
        village = create_sample_village()
        weather_engine = WeatherEngine(seed=seed)
        garden = Garden(4, 6, owner="Player")
        pet_manager = PetManager()
        return cls(village, weather_engine, garden, pet_manager, seed=seed)

    # -- Main game loop -------------------------------------------------------

    def advance_day(self) -> DailyReport:
        """Simulate one full day across all systems and return a report."""
        self._day += 1

        # 1. Advance weather
        forecast = self.weather.advance()
        self._weather_history.append(forecast)
        weather_effect = _SKY_TO_WEATHER_EFFECT.get(forecast.sky, WeatherEffect.SUNNY)
        pet_weather = _SKY_TO_PET_WEATHER.get(forecast.sky, "sunny")

        # Magical weather → special garden bonus
        if forecast.is_magical:
            weather_effect = WeatherEffect.MAGICAL

        # 2. Determine season + tell the village
        season = self.village.season
        garden_season = _to_garden_season(season)
        animal_season = _to_animal_season(season)

        is_bad = forecast.sky in {
            Sky.THUNDERSTORM, Sky.BLIZZARD, Sky.HAIL,
        }
        self.village.set_weather(is_bad)

        # 3. Advance villagers through all time slots
        villager_events: list[str] = []
        for _ in range(5):  # dawn → night
            summary = self.village.advance_time()
        # Grab the last few event log entries for the report
        villager_events = self.village.event_log[-10:]

        # 4. Garden: water + grow + harvest
        self.garden.season = garden_season
        self.garden.water_all()  # auto-tend
        garden_events = self.garden.advance_day(weather_effect, garden_season)

        # Auto-harvest ripe crops
        harvests = self.garden.harvest_all()
        harvest_strs = [h.display for h in harvests]

        # Villagers comment on the garden if there are crops
        if harvests and self._rng.random() < 0.4:
            commenter = self._rng.choice(list(self.village.villagers.values()))
            crop_name = harvests[0].crop.name
            garden_events.append(
                f'{commenter.name}: "Your {crop_name} looks wonderful!"'
            )

        # 5. Pets: daily activities
        villager_names = [v.name for v in self.village.villagers.values()]
        pet_events = self.pets.advance_day(
            animal_season, pet_weather, villager_names,
        )

        # Collect newly found items
        found_today: list[str] = []
        for pet in self.pets.pets.values():
            for item in pet.found_items[-1:]:  # last item if any
                if self._day == self.pets.day:
                    found_today.append(f"{pet.name} found: {item.name}")

        # 6. Pet-villager bond effects
        # If a pet greeted a villager, boost that villager's friendship with owner
        for pet in self.pets.pets.values():
            if pet.activity.value == "greeting a villager" and pet.favourite_villager:
                villager = self.village.get_villager(pet.favourite_villager)
                if villager:
                    villager.adjust_mood(1)

        # 7. Festivals check
        festivals = eligible_festivals(forecast)

        # 8. Village mood from weather
        v_mood = compute_village_mood(self._weather_history)

        report = DailyReport(
            day=self._day,
            season=season.value.title(),
            weather_summary=forecast.short_summary(),
            weather_description=forecast.description,
            is_magical=forecast.is_magical,
            magical_event=forecast.magical_event.value if forecast.is_magical else "",
            festivals=festivals,
            village_mood=v_mood.value,
            villager_events=villager_events,
            garden_events=garden_events,
            pet_events=pet_events,
            harvests=harvest_strs,
            found_items=found_today,
        )
        self._daily_reports.append(report)
        return report

    def simulate_days(self, n: int) -> list[DailyReport]:
        """Run multiple days and return all reports."""
        return [self.advance_day() for _ in range(n)]

    # -- Player actions -------------------------------------------------------

    def plant_crop(self, row: int, col: int, crop: CropType) -> str:
        """Plant a crop in the garden."""
        return self.garden.plant(row, col, crop)

    def adopt_pet(
        self, name: str, species: Species, personality: PetPersonality,
    ) -> Pet:
        """Adopt a new pet companion."""
        return self.pets.adopt(name, species, personality)

    def give_gift_to_villager(
        self, villager_id: str, gift: Gift,
    ) -> Optional[str]:
        """Give a gift to a villager from the player."""
        return self.village.give_gift_to("player", villager_id, gift)

    def give_harvest_to_villager(
        self, villager_id: str, harvest: Harvest,
    ) -> Optional[str]:
        """Gift harvested produce to a villager — quality affects friendship."""
        # Convert harvest to a Gift
        category = GiftCategory.FOOD
        if harvest.crop.name in ("Tulip", "Sunflower", "Lavender", "Winter Rose",
                                  "Moonbloom", "Chamomile"):
            category = GiftCategory.FLOWER
        elif harvest.crop.name in ("Sage", "Basil", "Frost Mint"):
            category = GiftCategory.FORAGED
        quality = {
            CropQuality.NORMAL: 1,
            CropQuality.SILVER: 2,
            CropQuality.GOLD: 3,
            CropQuality.IRIDESCENT: 5,
        }.get(harvest.quality, 1)
        gift = Gift(
            f"Fresh {harvest.crop.name}", category, quality=quality,
        )
        return self.village.give_gift_to("player", villager_id, gift)

    # -- Queries --------------------------------------------------------------

    @property
    def day(self) -> int:
        return self._day

    @property
    def season(self) -> Season:
        return self.village.season

    @property
    def current_weather(self) -> Optional[Forecast]:
        return self._weather_history[-1] if self._weather_history else None

    def friendship_report(self) -> list[str]:
        return self.village.friendship_report()

    def garden_status(self) -> str:
        return self.garden.status()

    def pet_status(self) -> str:
        return self.pets.status_report()

    def full_status(self) -> str:
        """A comprehensive snapshot of the entire village."""
        lines = [
            "=" * 60,
            f"  WILLOWBROOK — Day {self._day}, {self.village.season.value.title()}",
            "=" * 60,
        ]
        if self.current_weather:
            lines.append(f"\n  Weather: {self.current_weather.short_summary()}")
            lines.append(f"  {self.current_weather.description}")

        lines.append(f"\n  Villagers: {len(self.village.villagers)}")
        for v in self.village.villagers.values():
            lines.append(
                f"    {v.name} ({v.personality.value}) — "
                f"{v.mood.value}, at {v.current_location}"
            )

        lines.append(f"\n{self.garden.status()}")
        lines.append(f"\n{self.pets.status_report()}")

        friendships = self.village.friendship_report()
        if friendships:
            lines.append("\n  Friendships:")
            for f in friendships[:10]:
                lines.append(f"    {f}")

        lines.append("=" * 60)
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Demo — one full season
# ---------------------------------------------------------------------------

def _demo() -> None:
    game = CozyVillageGame.create_default(seed=7)

    # Adopt some pets
    game.adopt_pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
    game.adopt_pet("Whiskers", Species.CAT, PetPersonality.LAZY)
    game.adopt_pet("Bramble", Species.HEDGEHOG, PetPersonality.GENTLE)

    # Plant a spring garden
    from garden import STRAWBERRY, BASIL, PEA, CHAMOMILE, TULIP, MUSHROOM
    game.plant_crop(0, 0, STRAWBERRY)
    game.plant_crop(0, 1, BASIL)      # companion bonus!
    game.plant_crop(0, 2, TULIP)
    game.plant_crop(1, 0, PEA)
    game.plant_crop(1, 1, CHAMOMILE)
    game.plant_crop(1, 2, MUSHROOM)

    print("Welcome to Willowbrook!\n")

    # Simulate a full spring season (28 days)
    for _ in range(28):
        report = game.advance_day()
        # Only print days with interesting events
        if (report.garden_events or report.pet_events or
                report.harvests or report.is_magical or report.festivals):
            print(report.render())

    print("\n" + game.full_status())


if __name__ == "__main__":
    _demo()
