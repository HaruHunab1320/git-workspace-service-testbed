"""
constellations.py -- Seasonal constellation discovery system for Cozy Village.

Players gaze at the night sky to discover constellations that change with the
seasons. Each constellation has star positions, connecting lines, village lore,
and a discovery state.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Season(str, Enum):
    SPRING = "spring"
    SUMMER = "summer"
    AUTUMN = "autumn"
    WINTER = "winter"


@dataclass(frozen=True)
class Star:
    """A single star in the sky, with position as fraction of canvas (0-1)."""
    x: float
    y: float
    brightness: float = 1.0  # 0.0-1.0


@dataclass(frozen=True)
class ConstellationType:
    """A constellation template."""
    name: str
    stars: tuple[Star, ...]
    lines: tuple[tuple[int, int], ...]  # index pairs into stars
    seasons: tuple[Season, ...]
    lore: str
    difficulty: int = 1  # 1-3, how hard to discover


# -- Constellation catalog ---------------------------------------------------

CONSTELLATIONS: list[ConstellationType] = [
    # Spring constellations
    ConstellationType(
        name="The Seedling",
        stars=(
            Star(0.30, 0.20, 0.9),
            Star(0.32, 0.35, 1.0),
            Star(0.28, 0.50, 0.8),
            Star(0.22, 0.62, 0.7),
            Star(0.35, 0.62, 0.7),
            Star(0.28, 0.75, 0.6),
        ),
        lines=((0, 1), (1, 2), (2, 3), (2, 4), (2, 5)),
        seasons=(Season.SPRING,),
        lore="The first villagers of Willowbrook planted their gardens by the light of The Seedling. They say if you make a wish on its brightest star, your crops will never wilt.",
        difficulty=1,
    ),
    ConstellationType(
        name="The Robin",
        stars=(
            Star(0.60, 0.15, 1.0),
            Star(0.65, 0.22, 0.9),
            Star(0.70, 0.18, 0.8),
            Star(0.68, 0.28, 0.9),
            Star(0.62, 0.30, 0.7),
            Star(0.55, 0.25, 0.6),
            Star(0.75, 0.22, 0.5),
        ),
        lines=((0, 1), (1, 2), (1, 3), (3, 4), (4, 5), (2, 6)),
        seasons=(Season.SPRING,),
        lore="A robin once guided a lost child back to Willowbrook by flying from star to star. The village named this constellation in its honor.",
        difficulty=2,
    ),
    ConstellationType(
        name="The Blossom",
        stars=(
            Star(0.45, 0.40, 1.0),
            Star(0.40, 0.35, 0.8),
            Star(0.50, 0.35, 0.8),
            Star(0.38, 0.42, 0.7),
            Star(0.52, 0.42, 0.7),
            Star(0.42, 0.48, 0.6),
            Star(0.48, 0.48, 0.6),
        ),
        lines=((0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (0, 6)),
        seasons=(Season.SPRING, Season.SUMMER),
        lore="On the first warm night of spring, the Blossom constellation blooms above the village square. Tradition holds that couples who stargaze together under it will share a lasting bond.",
        difficulty=1,
    ),

    # Summer constellations
    ConstellationType(
        name="The Firefly Jar",
        stars=(
            Star(0.15, 0.10, 0.9),
            Star(0.20, 0.08, 0.8),
            Star(0.22, 0.15, 1.0),
            Star(0.18, 0.20, 0.9),
            Star(0.12, 0.18, 0.7),
            Star(0.14, 0.12, 0.8),
            Star(0.17, 0.14, 0.6),
        ),
        lines=((0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0)),
        seasons=(Season.SUMMER,),
        lore="On the longest night of summer, children in Willowbrook catch fireflies and compare them to this constellation. The one who finds the brightest firefly is crowned the Summer Lantern Bearer.",
        difficulty=1,
    ),
    ConstellationType(
        name="The Hammock",
        stars=(
            Star(0.55, 0.55, 0.8),
            Star(0.62, 0.60, 1.0),
            Star(0.70, 0.58, 0.9),
            Star(0.78, 0.55, 0.8),
            Star(0.52, 0.50, 0.6),
            Star(0.80, 0.50, 0.6),
        ),
        lines=((0, 1), (1, 2), (2, 3), (4, 0), (3, 5)),
        seasons=(Season.SUMMER,),
        lore="Old Bramble the hedgehog claims he naps best when The Hammock hangs directly overhead. The village baker always makes honey cakes on those nights.",
        difficulty=2,
    ),
    ConstellationType(
        name="The Sun Hat",
        stars=(
            Star(0.40, 0.70, 0.9),
            Star(0.35, 0.65, 0.7),
            Star(0.45, 0.65, 0.7),
            Star(0.30, 0.72, 0.8),
            Star(0.50, 0.72, 0.8),
            Star(0.38, 0.78, 1.0),
            Star(0.42, 0.78, 0.9),
        ),
        lines=((0, 1), (0, 2), (1, 3), (2, 4), (3, 5), (4, 6), (5, 6)),
        seasons=(Season.SUMMER, Season.SPRING),
        lore="The village milliner sews a new hat every year inspired by the arrangement of stars in The Sun Hat. No two hats have ever been the same.",
        difficulty=2,
    ),

    # Autumn constellations
    ConstellationType(
        name="The Acorn",
        stars=(
            Star(0.75, 0.30, 1.0),
            Star(0.72, 0.38, 0.9),
            Star(0.78, 0.38, 0.9),
            Star(0.70, 0.48, 0.7),
            Star(0.80, 0.48, 0.7),
            Star(0.75, 0.55, 0.8),
            Star(0.73, 0.25, 0.6),
            Star(0.77, 0.25, 0.6),
        ),
        lines=((0, 1), (0, 2), (1, 3), (2, 4), (3, 5), (4, 5), (0, 6), (0, 7)),
        seasons=(Season.AUTUMN,),
        lore="Squirrels in Willowbrook bury their acorns in patterns that mirror this constellation. The village librarian keeps a map of every cache ever found.",
        difficulty=1,
    ),
    ConstellationType(
        name="The Lantern",
        stars=(
            Star(0.20, 0.55, 0.8),
            Star(0.25, 0.55, 0.8),
            Star(0.25, 0.70, 0.9),
            Star(0.20, 0.70, 0.9),
            Star(0.22, 0.50, 0.7),
            Star(0.22, 0.75, 1.0),
        ),
        lines=((0, 1), (1, 2), (2, 3), (3, 0), (4, 0), (4, 1), (2, 5), (3, 5)),
        seasons=(Season.AUTUMN, Season.WINTER),
        lore="When autumn fog rolls in, the village lamplighter looks to The Lantern to guide his route. It is said the constellation grows brighter on the foggiest nights.",
        difficulty=2,
    ),
    ConstellationType(
        name="The Fox",
        stars=(
            Star(0.50, 0.15, 1.0),
            Star(0.55, 0.12, 0.8),
            Star(0.48, 0.10, 0.7),
            Star(0.53, 0.20, 0.9),
            Star(0.58, 0.25, 0.7),
            Star(0.63, 0.28, 0.6),
            Star(0.56, 0.30, 0.5),
        ),
        lines=((0, 1), (0, 2), (0, 3), (3, 4), (4, 5), (4, 6)),
        seasons=(Season.AUTUMN,),
        lore="A clever fox once outwitted the village baker by stealing pies under cover of the moonless sky. The constellation appeared the next night, as if winking.",
        difficulty=3,
    ),

    # Winter constellations
    ConstellationType(
        name="The Snowflake",
        stars=(
            Star(0.50, 0.45, 1.0),
            Star(0.50, 0.35, 0.8),
            Star(0.50, 0.55, 0.8),
            Star(0.42, 0.40, 0.7),
            Star(0.58, 0.50, 0.7),
            Star(0.42, 0.50, 0.7),
            Star(0.58, 0.40, 0.7),
        ),
        lines=((0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (0, 6)),
        seasons=(Season.WINTER,),
        lore="No two snowflakes are alike, yet this constellation remains unchanged each winter. The village philosopher considers this the deepest mystery in all of Willowbrook.",
        difficulty=1,
    ),
    ConstellationType(
        name="The Hearth",
        stars=(
            Star(0.30, 0.60, 0.9),
            Star(0.38, 0.58, 0.8),
            Star(0.35, 0.68, 1.0),
            Star(0.28, 0.68, 0.9),
            Star(0.25, 0.62, 0.7),
            Star(0.33, 0.55, 0.6),
        ),
        lines=((0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (0, 5), (1, 5)),
        seasons=(Season.WINTER,),
        lore="On the coldest night of winter, families gather by the fire and trace The Hearth in the sky through frosted windows. Hot cocoa tastes best under its glow.",
        difficulty=2,
    ),
    ConstellationType(
        name="The Aurora Crown",
        stars=(
            Star(0.65, 0.10, 0.9),
            Star(0.70, 0.08, 1.0),
            Star(0.75, 0.10, 0.9),
            Star(0.78, 0.15, 0.8),
            Star(0.62, 0.15, 0.8),
            Star(0.68, 0.05, 0.7),
            Star(0.72, 0.05, 0.7),
        ),
        lines=((0, 1), (1, 2), (2, 3), (4, 0), (0, 5), (1, 5), (1, 6), (2, 6)),
        seasons=(Season.WINTER, Season.AUTUMN),
        lore="The Aurora Crown only appears alongside the northern lights. Legend says the first mayor of Willowbrook was crowned beneath its shimmering arc.",
        difficulty=3,
    ),
]

CONSTELLATION_BY_NAME: dict[str, ConstellationType] = {c.name: c for c in CONSTELLATIONS}


# -- Tracker -----------------------------------------------------------------

@dataclass
class DiscoveredConstellation:
    """Record of a player's discovery."""
    name: str
    discovered_day: int
    discovered_season: str
    player_note: str = ""


@dataclass
class ConstellationTracker:
    """Tracks which constellations a player has discovered."""
    discoveries: dict[str, DiscoveredConstellation] = field(default_factory=dict)

    def visible_constellations(self, season: Season) -> list[ConstellationType]:
        return [c for c in CONSTELLATIONS if season in c.seasons]

    def discover(self, name: str, day: int, season: Season, note: str = "") -> str:
        if name not in CONSTELLATION_BY_NAME:
            return f"Unknown constellation: {name}"
        constellation = CONSTELLATION_BY_NAME[name]
        if season not in constellation.seasons:
            return f"{name} is not visible in {season.value}. Try looking in {' or '.join(s.value for s in constellation.seasons)}."
        if name in self.discoveries:
            return f"You have already discovered {name}!"
        self.discoveries[name] = DiscoveredConstellation(
            name=name,
            discovered_day=day,
            discovered_season=season.value,
            player_note=note,
        )
        return f"You discovered {name}! {constellation.lore}"

    def add_note(self, name: str, note: str) -> str:
        if name not in self.discoveries:
            return f"You haven't discovered {name} yet."
        self.discoveries[name].player_note = note
        return f"Note saved for {name}."

    def is_discovered(self, name: str) -> bool:
        return name in self.discoveries

    @property
    def total_discovered(self) -> int:
        return len(self.discoveries)

    @property
    def total_constellations(self) -> int:
        return len(CONSTELLATIONS)

    @property
    def completion_fraction(self) -> float:
        if not CONSTELLATIONS:
            return 0.0
        return self.total_discovered / self.total_constellations

    def catalog_summary(self) -> dict:
        return {
            "discovered": self.total_discovered,
            "total": self.total_constellations,
            "completion": round(self.completion_fraction * 100, 1),
        }


def serialize_constellation(c: ConstellationType, discovered: bool, discovery: Optional[DiscoveredConstellation] = None) -> dict:
    data = {
        "name": c.name,
        "seasons": [s.value for s in c.seasons],
        "difficulty": c.difficulty,
        "star_count": len(c.stars),
        "discovered": discovered,
    }
    if discovered:
        data["stars"] = [{"x": s.x, "y": s.y, "brightness": s.brightness} for s in c.stars]
        data["lines"] = [list(pair) for pair in c.lines]
        data["lore"] = c.lore
        if discovery:
            data["discovered_day"] = discovery.discovered_day
            data["discovered_season"] = discovery.discovered_season
            data["player_note"] = discovery.player_note
    else:
        # Show hint stars (first 2 only) so players can locate it
        data["hint_stars"] = [{"x": s.x, "y": s.y, "brightness": s.brightness} for s in c.stars[:2]]
        data["lore"] = None
    return data
