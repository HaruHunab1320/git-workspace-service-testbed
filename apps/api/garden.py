"""
garden.py — Cozy Village Simulator: Garden & Farming System

Plant seeds, tend crops through the seasons, and harvest the bounty.
Crops grow in real time, respond to weather, and can reach different
quality tiers depending on care.  Produce can be gifted to villagers,
sold at market, or used in recipes.
"""

from __future__ import annotations

import enum
import math
import random
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Season(enum.Enum):
    SPRING = "spring"
    SUMMER = "summer"
    AUTUMN = "autumn"
    WINTER = "winter"


class GrowthStage(enum.Enum):
    """Lifecycle of a planted crop."""
    SEED = "seed"
    SPROUT = "sprout"
    GROWING = "growing"
    FLOWERING = "flowering"
    HARVESTABLE = "harvestable"
    WITHERED = "withered"

    @property
    def is_alive(self) -> bool:
        return self is not GrowthStage.WITHERED


_STAGE_ORDER = [
    GrowthStage.SEED,
    GrowthStage.SPROUT,
    GrowthStage.GROWING,
    GrowthStage.FLOWERING,
    GrowthStage.HARVESTABLE,
]


class CropQuality(enum.Enum):
    """Quality tier of harvested produce — better care yields higher quality."""
    NORMAL = "Normal"
    SILVER = "Silver"
    GOLD = "Gold"
    IRIDESCENT = "Iridescent"

    @property
    def price_multiplier(self) -> float:
        return {
            "Normal": 1.0,
            "Silver": 1.5,
            "Gold": 2.2,
            "Iridescent": 3.5,
        }[self.value]

    @property
    def gift_bonus(self) -> int:
        """Extra friendship points when gifting produce of this quality."""
        return {"Normal": 0, "Silver": 2, "Gold": 5, "Iridescent": 10}[self.value]


class SoilType(enum.Enum):
    NORMAL = "normal"
    ENRICHED = "enriched"
    ENCHANTED = "enchanted"


# ---------------------------------------------------------------------------
# Crop catalogue
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class CropType:
    """Blueprint for a plantable crop."""
    name: str
    seasons: tuple[Season, ...]
    days_to_grow: int          # total days from seed to harvestable
    base_sell_price: float
    water_needs: int           # 0-3, how thirsty the crop is
    regrows: bool = False      # whether it produces multiple harvests
    regrow_days: int = 0       # days between re-harvests
    description: str = ""
    is_magical: bool = False

    def can_grow_in(self, season: Season) -> bool:
        return season in self.seasons


# -- Spring crops --

STRAWBERRY = CropType(
    "Strawberry", (Season.SPRING,), days_to_grow=8, base_sell_price=4.0,
    water_needs=2, regrows=True, regrow_days=3,
    description="Sweet red berries that love the spring rain.",
)
TULIP = CropType(
    "Tulip", (Season.SPRING,), days_to_grow=6, base_sell_price=3.0,
    water_needs=1,
    description="Bright petals that sway in the breeze.",
)
PEA = CropType(
    "Pea", (Season.SPRING,), days_to_grow=5, base_sell_price=2.5,
    water_needs=1, regrows=True, regrow_days=2,
    description="Tiny green pods perfect for spring soups.",
)
BASIL = CropType(
    "Basil", (Season.SPRING, Season.SUMMER), days_to_grow=4, base_sell_price=2.0,
    water_needs=2,
    description="Fragrant leaves for the kitchen windowsill.",
)
CHAMOMILE = CropType(
    "Chamomile", (Season.SPRING,), days_to_grow=7, base_sell_price=3.5,
    water_needs=1,
    description="Tiny daisy-like blooms for calming teas.",
)

# -- Summer crops --

TOMATO = CropType(
    "Tomato", (Season.SUMMER,), days_to_grow=9, base_sell_price=4.5,
    water_needs=3, regrows=True, regrow_days=3,
    description="Plump red fruits warmed by the summer sun.",
)
SUNFLOWER = CropType(
    "Sunflower", (Season.SUMMER,), days_to_grow=10, base_sell_price=5.0,
    water_needs=2,
    description="Towers above the garden, face always turned to the light.",
)
BLUEBERRY = CropType(
    "Blueberry", (Season.SUMMER,), days_to_grow=8, base_sell_price=5.5,
    water_needs=2, regrows=True, regrow_days=3,
    description="Dusky blue orbs bursting with juice.",
)
LAVENDER_CROP = CropType(
    "Lavender", (Season.SUMMER,), days_to_grow=7, base_sell_price=4.0,
    water_needs=1,
    description="Purple spires that fill the air with calm.",
)
WATERMELON = CropType(
    "Watermelon", (Season.SUMMER,), days_to_grow=12, base_sell_price=8.0,
    water_needs=3,
    description="A single enormous fruit, cool and refreshing.",
)

# -- Autumn crops --

PUMPKIN = CropType(
    "Pumpkin", (Season.AUTUMN,), days_to_grow=10, base_sell_price=6.0,
    water_needs=2,
    description="Round and orange, the heart of the harvest festival.",
)
APPLE = CropType(
    "Apple", (Season.AUTUMN,), days_to_grow=11, base_sell_price=5.0,
    water_needs=1, regrows=True, regrow_days=4,
    description="Crisp and rosy, straight from the orchard.",
)
MUSHROOM = CropType(
    "Mushroom", (Season.AUTUMN, Season.SPRING), days_to_grow=5, base_sell_price=3.0,
    water_needs=1,
    description="Earthy caps that sprout in the damp shade.",
)
SAGE_HERB = CropType(
    "Sage", (Season.AUTUMN,), days_to_grow=6, base_sell_price=3.5,
    water_needs=1,
    description="Silver-green leaves with a warm, woody aroma.",
)
CRANBERRY = CropType(
    "Cranberry", (Season.AUTUMN,), days_to_grow=9, base_sell_price=5.5,
    water_needs=3,
    description="Tart ruby berries that thrive in boggy soil.",
)

# -- Winter crops --

WINTER_ROSE = CropType(
    "Winter Rose", (Season.WINTER,), days_to_grow=12, base_sell_price=7.0,
    water_needs=1,
    description="A frost-kissed bloom of pale blue petals.",
)
FROST_MINT = CropType(
    "Frost Mint", (Season.WINTER,), days_to_grow=6, base_sell_price=4.0,
    water_needs=1,
    description="Icy-fresh leaves that tingle on the tongue.",
)
HOLLY_BERRY = CropType(
    "Holly Berry", (Season.WINTER,), days_to_grow=8, base_sell_price=4.5,
    water_needs=1,
    description="Bright red berries nestled among glossy green leaves.",
)
SNOW_PEA = CropType(
    "Snow Pea", (Season.WINTER, Season.SPRING), days_to_grow=5, base_sell_price=3.0,
    water_needs=1,
    description="Crisp, flat pods that don't mind a chill.",
)

# -- Magical crops --

MOONBLOOM = CropType(
    "Moonbloom", (Season.WINTER,), days_to_grow=14, base_sell_price=15.0,
    water_needs=2, is_magical=True,
    description="Glows softly under moonlight; petals shimmer like opals.",
)
STARFRUIT = CropType(
    "Starfruit", (Season.SUMMER,), days_to_grow=14, base_sell_price=15.0,
    water_needs=3, is_magical=True,
    description="Star-shaped fruit that tastes of honey and stardust.",
)
CRYSTAL_BERRY = CropType(
    "Crystal Berry", (Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER),
    days_to_grow=16, base_sell_price=20.0,
    water_needs=2, is_magical=True,
    description="Translucent berries that chime like tiny bells when ripe.",
)

ALL_CROPS: tuple[CropType, ...] = (
    STRAWBERRY, TULIP, PEA, BASIL, CHAMOMILE,
    TOMATO, SUNFLOWER, BLUEBERRY, LAVENDER_CROP, WATERMELON,
    PUMPKIN, APPLE, MUSHROOM, SAGE_HERB, CRANBERRY,
    WINTER_ROSE, FROST_MINT, HOLLY_BERRY, SNOW_PEA,
    MOONBLOOM, STARFRUIT, CRYSTAL_BERRY,
)

SEASONAL_CROPS: dict[Season, list[CropType]] = {
    s: [c for c in ALL_CROPS if c.can_grow_in(s)]
    for s in Season
}


# ---------------------------------------------------------------------------
# Companion planting bonuses
# ---------------------------------------------------------------------------

# Pairs of crop names that boost each other when planted in adjacent plots.
COMPANION_PAIRS: set[frozenset[str]] = {
    frozenset({"Strawberry", "Basil"}),
    frozenset({"Tomato", "Basil"}),
    frozenset({"Pea", "Chamomile"}),
    frozenset({"Pumpkin", "Sunflower"}),
    frozenset({"Blueberry", "Lavender"}),
    frozenset({"Mushroom", "Sage"}),
    frozenset({"Winter Rose", "Frost Mint"}),
    frozenset({"Moonbloom", "Crystal Berry"}),
}

COMPANION_GROWTH_BONUS = 0.15  # 15 % faster growth


# ---------------------------------------------------------------------------
# Garden plot
# ---------------------------------------------------------------------------

@dataclass
class GardenPlot:
    """A single tile in the garden that can hold one crop."""

    row: int
    col: int
    soil: SoilType = SoilType.NORMAL
    crop: Optional[CropType] = None
    stage: GrowthStage = GrowthStage.SEED
    growth_progress: float = 0.0   # 0.0 → 1.0 across current stage
    days_planted: int = 0
    watered_today: bool = False
    times_watered: int = 0
    quality_score: float = 0.0     # accumulated care quality
    harvests_taken: int = 0
    _withered: bool = False

    @property
    def is_empty(self) -> bool:
        return self.crop is None

    @property
    def is_harvestable(self) -> bool:
        return self.stage is GrowthStage.HARVESTABLE

    def plant(self, crop: CropType, season: Season) -> str:
        """Plant a seed in this plot. Returns a narrative string."""
        if not self.is_empty:
            return f"This plot already has {self.crop.name} growing!"
        if not crop.can_grow_in(season):
            return f"{crop.name} can't be planted in {season.value}."
        self.crop = crop
        self.stage = GrowthStage.SEED
        self.growth_progress = 0.0
        self.days_planted = 0
        self.watered_today = False
        self.times_watered = 0
        self.quality_score = 0.0
        self.harvests_taken = 0
        self._withered = False
        return f"Planted {crop.name} seeds. {crop.description}"

    def water(self) -> str:
        if self.is_empty:
            return "Nothing to water here."
        if self._withered:
            return f"The {self.crop.name} has withered..."
        if self.watered_today:
            return f"The {self.crop.name} has already been watered today."
        self.watered_today = True
        self.times_watered += 1
        self.quality_score += 1.0
        return f"Watered the {self.crop.name}. The soil drinks it up gratefully."

    def clear(self) -> str:
        """Remove whatever is planted, clearing the plot."""
        if self.is_empty:
            return "The plot is already empty."
        name = self.crop.name
        self.crop = None
        self.stage = GrowthStage.SEED
        self.growth_progress = 0.0
        self.days_planted = 0
        self.quality_score = 0.0
        self.harvests_taken = 0
        self._withered = False
        return f"Cleared the {name} from this plot."

    def harvest(self) -> Optional[Harvest]:
        """Harvest the crop if it's ready. Returns Harvest or None."""
        if self.is_empty or self.stage is not GrowthStage.HARVESTABLE:
            return None
        quality = _determine_quality(self.quality_score, self.soil, self.crop)
        h = Harvest(
            crop=self.crop,
            quality=quality,
            quantity=_harvest_yield(quality),
        )
        self.harvests_taken += 1
        if self.crop.regrows and self.harvests_taken < 4:
            # Reset to growing stage for regrowth
            self.stage = GrowthStage.GROWING
            self.growth_progress = 0.0
        else:
            self.clear()
        return h


@dataclass(frozen=True)
class Harvest:
    """The result of picking a ripe crop."""
    crop: CropType
    quality: CropQuality
    quantity: int

    @property
    def sell_value(self) -> float:
        return round(
            self.crop.base_sell_price * self.quality.price_multiplier * self.quantity,
            2,
        )

    @property
    def display(self) -> str:
        return (
            f"{self.quantity}x {self.quality.value} {self.crop.name} "
            f"(worth {self.sell_value} coins)"
        )


def _determine_quality(
    quality_score: float, soil: SoilType, crop: CropType,
) -> CropQuality:
    """Map accumulated care score to a quality tier."""
    base = quality_score / max(crop.days_to_grow, 1)
    if soil is SoilType.ENRICHED:
        base += 0.3
    elif soil is SoilType.ENCHANTED:
        base += 0.7
    if crop.is_magical:
        base *= 0.8  # magical crops are harder to perfect
    roll = random.random() * 0.3
    final = base + roll
    if final >= 2.0:
        return CropQuality.IRIDESCENT
    if final >= 1.4:
        return CropQuality.GOLD
    if final >= 0.8:
        return CropQuality.SILVER
    return CropQuality.NORMAL


def _harvest_yield(quality: CropQuality) -> int:
    """Higher quality sometimes yields more produce."""
    base = 1
    if quality in (CropQuality.GOLD, CropQuality.IRIDESCENT):
        base += random.randint(0, 1)
    return base


# ---------------------------------------------------------------------------
# Weather effects on growth
# ---------------------------------------------------------------------------

class WeatherEffect(enum.Enum):
    """Simplified weather categories for garden impact."""
    SUNNY = "sunny"
    RAINY = "rainy"
    STORMY = "stormy"
    FROST = "frost"
    MAGICAL = "magical"


_WEATHER_GROWTH: dict[WeatherEffect, float] = {
    WeatherEffect.SUNNY: 1.0,
    WeatherEffect.RAINY: 1.3,
    WeatherEffect.STORMY: 0.7,
    WeatherEffect.FROST: 0.3,
    WeatherEffect.MAGICAL: 1.5,
}

_WEATHER_QUALITY: dict[WeatherEffect, float] = {
    WeatherEffect.SUNNY: 0.5,
    WeatherEffect.RAINY: 0.8,
    WeatherEffect.STORMY: -0.5,
    WeatherEffect.FROST: -1.0,
    WeatherEffect.MAGICAL: 2.0,
}


# ---------------------------------------------------------------------------
# Garden — manages a grid of plots
# ---------------------------------------------------------------------------

class Garden:
    """A garden containing a grid of plantable plots."""

    def __init__(
        self, rows: int = 4, cols: int = 6, *, owner: str = "Player",
    ) -> None:
        self.owner = owner
        self.rows = rows
        self.cols = cols
        self.plots: list[list[GardenPlot]] = [
            [GardenPlot(r, c) for c in range(cols)]
            for r in range(rows)
        ]
        self.day: int = 0
        self.season: Season = Season.SPRING
        self.event_log: list[str] = []
        self.total_harvests: int = 0

    # -- Access helpers -------------------------------------------------------

    def get_plot(self, row: int, col: int) -> Optional[GardenPlot]:
        if 0 <= row < self.rows and 0 <= col < self.cols:
            return self.plots[row][col]
        return None

    def all_plots(self) -> list[GardenPlot]:
        return [p for row in self.plots for p in row]

    def planted_plots(self) -> list[GardenPlot]:
        return [p for p in self.all_plots() if not p.is_empty]

    def harvestable_plots(self) -> list[GardenPlot]:
        return [p for p in self.all_plots() if p.is_harvestable]

    # -- Planting & watering --------------------------------------------------

    def plant(self, row: int, col: int, crop: CropType) -> str:
        plot = self.get_plot(row, col)
        if plot is None:
            return "That plot doesn't exist!"
        return plot.plant(crop, self.season)

    def water_all(self) -> list[str]:
        """Water every plot that has something growing."""
        messages = []
        for plot in self.planted_plots():
            if not plot.watered_today and plot.stage.is_alive:
                messages.append(plot.water())
        if not messages:
            messages.append("Nothing to water today.")
        return messages

    def harvest_all(self) -> list[Harvest]:
        """Harvest every ready crop."""
        harvests: list[Harvest] = []
        for plot in self.harvestable_plots():
            h = plot.harvest()
            if h:
                harvests.append(h)
                self.total_harvests += 1
                self.event_log.append(f"Harvested {h.display}.")
        return harvests

    # -- Daily tick -----------------------------------------------------------

    def advance_day(
        self,
        weather: WeatherEffect = WeatherEffect.SUNNY,
        season: Optional[Season] = None,
    ) -> list[str]:
        """Advance one day: grow crops, apply weather, check for wilting."""
        self.day += 1
        if season is not None:
            self.season = season
        events: list[str] = []

        growth_mult = _WEATHER_GROWTH.get(weather, 1.0)
        quality_mod = _WEATHER_QUALITY.get(weather, 0.0)

        # Rain auto-waters
        if weather in (WeatherEffect.RAINY, WeatherEffect.STORMY):
            for plot in self.planted_plots():
                if not plot.watered_today and plot.stage.is_alive:
                    plot.watered_today = True
                    plot.times_watered += 1
            events.append("The rain waters the garden for you.")

        for plot in self.planted_plots():
            if plot._withered or plot.stage is GrowthStage.WITHERED:
                continue
            crop = plot.crop
            plot.days_planted += 1

            # Season mismatch: crops wither outside their season
            if not crop.can_grow_in(self.season):
                plot._withered = True
                plot.stage = GrowthStage.WITHERED
                events.append(
                    f"The {crop.name} at ({plot.row},{plot.col}) withered "
                    f"in the {self.season.value} chill."
                )
                continue

            # Frost damages non-winter crops
            if weather is WeatherEffect.FROST and Season.WINTER not in crop.seasons:
                plot.quality_score -= 2.0
                events.append(
                    f"Frost nipped the {crop.name} at ({plot.row},{plot.col})!"
                )
                if plot.quality_score < -5:
                    plot._withered = True
                    plot.stage = GrowthStage.WITHERED
                    events.append(f"The {crop.name} couldn't survive the frost.")
                    continue

            # Growth calculation
            if plot.stage is not GrowthStage.HARVESTABLE:
                watered_bonus = 1.3 if plot.watered_today else 0.7
                companion_bonus = (
                    1.0 + COMPANION_GROWTH_BONUS
                    if self._has_companion(plot) else 1.0
                )
                daily_growth = (1.0 / crop.days_to_grow) * growth_mult * watered_bonus * companion_bonus

                plot.growth_progress += daily_growth
                plot.quality_score += quality_mod * (0.5 if not plot.watered_today else 1.0)

                # Advance through growth stages
                stage_idx = _STAGE_ORDER.index(plot.stage)
                # Each stage covers ~25% of total growth except harvestable (the rest)
                thresholds = [0.0, 0.15, 0.40, 0.70, 1.0]
                for i in range(stage_idx + 1, len(thresholds)):
                    if plot.growth_progress >= thresholds[i]:
                        old_stage = plot.stage
                        plot.stage = _STAGE_ORDER[i]
                        if plot.stage is not old_stage:
                            events.append(
                                _growth_description(crop, plot.stage, plot.row, plot.col)
                            )

            # Reset daily watering
            plot.watered_today = False

        return events

    def _has_companion(self, plot: GardenPlot) -> bool:
        """Check if any adjacent plot has a companion-planting partner."""
        if plot.crop is None:
            return False
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            neighbor = self.get_plot(plot.row + dr, plot.col + dc)
            if neighbor and neighbor.crop:
                pair = frozenset({plot.crop.name, neighbor.crop.name})
                if pair in COMPANION_PAIRS:
                    return True
        return False

    # -- Display --------------------------------------------------------------

    def status(self) -> str:
        """Return a text overview of the garden."""
        lines = [
            f"=== {self.owner}'s Garden (Day {self.day}, {self.season.value}) ===",
            f"    Plots: {self.rows}x{self.cols}  |  "
            f"Planted: {len(self.planted_plots())}  |  "
            f"Harvestable: {len(self.harvestable_plots())}",
            "",
        ]
        for r in range(self.rows):
            row_parts = []
            for c in range(self.cols):
                plot = self.plots[r][c]
                if plot.is_empty:
                    row_parts.append("[      ]")
                else:
                    icon = _STAGE_ICONS.get(plot.stage, "?")
                    name = plot.crop.name[:5]
                    row_parts.append(f"[{icon}{name:>5}]")
            lines.append("  ".join(row_parts))
        return "\n".join(lines)

    def seasonal_planting_guide(self) -> str:
        """Show what can be planted this season."""
        crops = SEASONAL_CROPS.get(self.season, [])
        if not crops:
            return f"Nothing can be planted in {self.season.value}."
        lines = [f"Available crops for {self.season.value}:"]
        for c in crops:
            magical = " [magical]" if c.is_magical else ""
            regrow = " (regrows)" if c.regrows else ""
            lines.append(
                f"  {c.name}{magical}{regrow} — {c.days_to_grow} days, "
                f"{c.base_sell_price} coins  |  {c.description}"
            )
        return "\n".join(lines)


_STAGE_ICONS: dict[GrowthStage, str] = {
    GrowthStage.SEED: ".",
    GrowthStage.SPROUT: ",",
    GrowthStage.GROWING: ";",
    GrowthStage.FLOWERING: "*",
    GrowthStage.HARVESTABLE: "@",
    GrowthStage.WITHERED: "~",
}


# ---------------------------------------------------------------------------
# Cozy growth descriptions
# ---------------------------------------------------------------------------

_GROWTH_DESCRIPTIONS: dict[GrowthStage, list[str]] = {
    GrowthStage.SPROUT: [
        "A tiny green shoot pushes through the earth!",
        "The first brave sprout peeks out at the world.",
        "Something stirs beneath the soil... a sprout emerges!",
    ],
    GrowthStage.GROWING: [
        "The {crop} is growing strong, leaves unfurling in the light.",
        "Roots reaching deep, the {crop} settles in nicely.",
        "The {crop} stretches taller day by day.",
    ],
    GrowthStage.FLOWERING: [
        "Tiny blossoms appear on the {crop} — how lovely!",
        "The {crop} bursts into delicate bloom.",
        "Bees visit the {crop}'s cheerful flowers.",
    ],
    GrowthStage.HARVESTABLE: [
        "The {crop} is ripe and ready to harvest!",
        "Golden and plump — the {crop} is perfect for picking.",
        "The {crop} practically glows with ripeness.",
    ],
}


def _growth_description(crop: CropType, stage: GrowthStage, row: int, col: int) -> str:
    templates = _GROWTH_DESCRIPTIONS.get(stage, [])
    if not templates:
        return f"The {crop.name} at ({row},{col}) has changed."
    text = random.choice(templates).format(crop=crop.name)
    return f"({row},{col}) {text}"


# ---------------------------------------------------------------------------
# Convenience: demo when run as a script
# ---------------------------------------------------------------------------

def _demo() -> None:
    garden = Garden(3, 4, owner="Hazel")
    print(garden.seasonal_planting_guide())
    print()

    garden.plant(0, 0, STRAWBERRY)
    garden.plant(0, 1, BASIL)  # companion pair!
    garden.plant(1, 0, CHAMOMILE)
    garden.plant(1, 1, PEA)

    weathers = [
        WeatherEffect.SUNNY, WeatherEffect.RAINY, WeatherEffect.SUNNY,
        WeatherEffect.RAINY, WeatherEffect.SUNNY, WeatherEffect.RAINY,
        WeatherEffect.SUNNY, WeatherEffect.MAGICAL,
    ]

    for day_weather in weathers:
        garden.water_all()
        events = garden.advance_day(day_weather)
        for e in events:
            print(f"  {e}")

    print()
    print(garden.status())

    harvests = garden.harvest_all()
    for h in harvests:
        print(f"  Harvested: {h.display}")


if __name__ == "__main__":
    _demo()
