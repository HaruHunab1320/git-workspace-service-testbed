"""
zen_garden.py — Cozy Village Simulator: Zen Garden System

A tranquil sandbox for placing succulents and arranging decorative rocks.
Succulents grow slowly over time, and rocks can be raked into patterns.
The garden tracks a "harmony" score based on balance and arrangement.
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

class SucculentStage(enum.Enum):
    """Growth lifecycle of a planted succulent."""
    SPROUT = "sprout"
    YOUNG = "young"
    MATURE = "mature"
    BLOOMING = "blooming"

    @property
    def growth_order(self) -> int:
        return ["sprout", "young", "mature", "blooming"].index(self.value)


_SUCCULENT_STAGE_ORDER = [
    SucculentStage.SPROUT,
    SucculentStage.YOUNG,
    SucculentStage.MATURE,
    SucculentStage.BLOOMING,
]


class RockSize(enum.Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class TileKind(enum.Enum):
    """What occupies a zen garden tile."""
    EMPTY = "empty"
    SUCCULENT = "succulent"
    ROCK = "rock"
    SAND = "sand"  # raked sand pattern


class RakePattern(enum.Enum):
    """Patterns that can be raked into sand tiles."""
    NONE = "none"
    CIRCLES = "circles"
    WAVES = "waves"
    LINES = "lines"
    SPIRAL = "spiral"


# ---------------------------------------------------------------------------
# Succulent catalogue
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SucculentType:
    """Blueprint for a plantable succulent."""
    name: str
    emoji: str
    days_to_mature: int
    water_tolerance: int  # 0-3, how much water it can handle (succulents are low-water)
    description: str
    bloom_color: str = ""
    is_rare: bool = False

    @property
    def rarity_label(self) -> str:
        return "Rare" if self.is_rare else "Common"


# -- Common succulents --

ECHEVERIA = SucculentType(
    "Echeveria", "🌿", days_to_mature=10, water_tolerance=1,
    description="Rosette-shaped leaves in soft pastel greens.",
    bloom_color="pink",
)
JADE_PLANT = SucculentType(
    "Jade Plant", "🪴", days_to_mature=14, water_tolerance=1,
    description="Thick, glossy leaves said to bring good fortune.",
    bloom_color="white",
)
ALOE = SucculentType(
    "Aloe", "🌵", days_to_mature=12, water_tolerance=2,
    description="Spiky, soothing leaves with healing gel inside.",
    bloom_color="orange",
)
HENS_AND_CHICKS = SucculentType(
    "Hens and Chicks", "🌱", days_to_mature=8, water_tolerance=1,
    description="A mother rosette surrounded by tiny offspring.",
    bloom_color="red",
)
BURROS_TAIL = SucculentType(
    "Burro's Tail", "🍃", days_to_mature=16, water_tolerance=1,
    description="Cascading braids of plump, teardrop leaves.",
    bloom_color="pink",
)
ZEBRA_PLANT = SucculentType(
    "Zebra Plant", "🦓", days_to_mature=11, water_tolerance=1,
    description="Dark green with crisp white horizontal stripes.",
    bloom_color="yellow",
)
AGAVE = SucculentType(
    "Agave", "🌿", days_to_mature=18, water_tolerance=2,
    description="Bold, sculptural rosette with sharp-tipped leaves.",
    bloom_color="yellow",
)

# -- Rare succulents --

LITHOPS = SucculentType(
    "Lithops", "🪨", days_to_mature=20, water_tolerance=0,
    description="Living stones that disguise themselves among pebbles.",
    bloom_color="white", is_rare=True,
)
MOONSTONE = SucculentType(
    "Moonstone", "🔮", days_to_mature=15, water_tolerance=1,
    description="Egg-shaped leaves with an ethereal lavender glow.",
    bloom_color="purple", is_rare=True,
)
BLACK_PRINCE = SucculentType(
    "Black Prince", "🖤", days_to_mature=13, water_tolerance=1,
    description="Deep burgundy rosette, nearly black at the tips.",
    bloom_color="red", is_rare=True,
)

ALL_SUCCULENTS: tuple[SucculentType, ...] = (
    ECHEVERIA, JADE_PLANT, ALOE, HENS_AND_CHICKS, BURROS_TAIL,
    ZEBRA_PLANT, AGAVE, LITHOPS, MOONSTONE, BLACK_PRINCE,
)

COMMON_SUCCULENTS = [s for s in ALL_SUCCULENTS if not s.is_rare]
RARE_SUCCULENTS = [s for s in ALL_SUCCULENTS if s.is_rare]


# ---------------------------------------------------------------------------
# Rock catalogue
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RockType:
    """A decorative rock for the zen garden."""
    name: str
    emoji: str
    size: RockSize
    description: str
    weight: int  # affects harmony balance calculations
    is_special: bool = False


# -- Rocks --

RIVER_STONE = RockType(
    "River Stone", "🪨", RockSize.SMALL,
    "Smooth and rounded by years of flowing water.", weight=1,
)
PEBBLE = RockType(
    "Pebble", "⚪", RockSize.SMALL,
    "A tiny, perfectly round stone.", weight=1,
)
GRANITE_BOULDER = RockType(
    "Granite Boulder", "🪨", RockSize.LARGE,
    "A solid grey mass, grounding and immovable.", weight=5,
)
SLATE_SLAB = RockType(
    "Slate Slab", "⬛", RockSize.MEDIUM,
    "Flat and dark, like a miniature mountain ledge.", weight=3,
)
SANDSTONE = RockType(
    "Sandstone", "🟫", RockSize.MEDIUM,
    "Warm tones of amber and ochre, layered by time.", weight=2,
)
MOSS_ROCK = RockType(
    "Moss Rock", "🟩", RockSize.MEDIUM,
    "A stone half-covered in velvety green moss.", weight=2,
)
QUARTZ_CRYSTAL = RockType(
    "Quartz Crystal", "💎", RockSize.SMALL,
    "A translucent crystal that catches the light.", weight=1, is_special=True,
)
OBSIDIAN = RockType(
    "Obsidian", "🖤", RockSize.MEDIUM,
    "Volcanic glass, dark and mirror-smooth.", weight=3, is_special=True,
)

ALL_ROCKS: tuple[RockType, ...] = (
    RIVER_STONE, PEBBLE, GRANITE_BOULDER, SLATE_SLAB,
    SANDSTONE, MOSS_ROCK, QUARTZ_CRYSTAL, OBSIDIAN,
)


# ---------------------------------------------------------------------------
# Zen garden tile
# ---------------------------------------------------------------------------

@dataclass
class ZenTile:
    """A single tile in the zen garden grid."""

    row: int
    col: int
    kind: TileKind = TileKind.SAND
    rake_pattern: RakePattern = RakePattern.NONE

    # Succulent fields
    succulent: Optional[SucculentType] = None
    succulent_stage: SucculentStage = SucculentStage.SPROUT
    growth_progress: float = 0.0
    days_planted: int = 0
    times_watered: int = 0

    # Rock fields
    rock: Optional[RockType] = None

    @property
    def is_empty(self) -> bool:
        return self.kind in (TileKind.EMPTY, TileKind.SAND)

    @property
    def has_succulent(self) -> bool:
        return self.kind is TileKind.SUCCULENT and self.succulent is not None

    @property
    def has_rock(self) -> bool:
        return self.kind is TileKind.ROCK and self.rock is not None

    def place_succulent(self, succulent: SucculentType) -> str:
        """Plant a succulent on this tile."""
        if not self.is_empty:
            if self.has_succulent:
                return f"This tile already has {self.succulent.name} growing!"
            if self.has_rock:
                return f"There's a {self.rock.name} here. Remove it first."
            return "This tile is occupied."
        self.kind = TileKind.SUCCULENT
        self.succulent = succulent
        self.succulent_stage = SucculentStage.SPROUT
        self.growth_progress = 0.0
        self.days_planted = 0
        self.times_watered = 0
        self.rake_pattern = RakePattern.NONE
        return f"Planted {succulent.name}. {succulent.description}"

    def place_rock(self, rock: RockType) -> str:
        """Place a rock on this tile."""
        if not self.is_empty:
            if self.has_succulent:
                return f"There's a {self.succulent.name} here. Remove it first."
            if self.has_rock:
                return f"This tile already has a {self.rock.name}!"
            return "This tile is occupied."
        self.kind = TileKind.ROCK
        self.rock = rock
        self.rake_pattern = RakePattern.NONE
        return f"Placed {rock.name}. {rock.description}"

    def rake(self, pattern: RakePattern) -> str:
        """Rake a sand pattern into this tile."""
        if not self.is_empty:
            return "Can only rake empty sand tiles."
        self.kind = TileKind.SAND
        self.rake_pattern = pattern
        return f"Raked a {pattern.value} pattern into the sand."

    def remove(self) -> str:
        """Remove whatever is on this tile."""
        if self.has_succulent:
            name = self.succulent.name
            self._clear()
            return f"Removed {name} from the garden."
        if self.has_rock:
            name = self.rock.name
            self._clear()
            return f"Removed {name} from the garden."
        if self.rake_pattern is not RakePattern.NONE:
            self.rake_pattern = RakePattern.NONE
            return "Smoothed the sand back to flat."
        return "This tile is already empty."

    def _clear(self) -> None:
        """Reset tile to empty sand."""
        self.kind = TileKind.SAND
        self.succulent = None
        self.succulent_stage = SucculentStage.SPROUT
        self.growth_progress = 0.0
        self.days_planted = 0
        self.times_watered = 0
        self.rock = None
        self.rake_pattern = RakePattern.NONE


# ---------------------------------------------------------------------------
# Succulent growth descriptions
# ---------------------------------------------------------------------------

_GROWTH_DESCRIPTIONS: dict[SucculentStage, list[str]] = {
    SucculentStage.YOUNG: [
        "The {name} unfurls new leaves, settling into its spot.",
        "Tiny roots spread beneath the sand — the {name} is taking hold.",
        "The {name} grows a little taller, reaching for the light.",
    ],
    SucculentStage.MATURE: [
        "The {name} has filled out beautifully, plump and healthy.",
        "Sturdy and content, the {name} is fully established.",
        "The {name} looks perfectly at home in the zen garden.",
    ],
    SucculentStage.BLOOMING: [
        "A tiny {bloom} flower appears on the {name}!",
        "The {name} blooms with delicate {bloom} petals.",
        "A surprise bloom — the {name} rewards your patience.",
    ],
}


def _growth_description(succulent: SucculentType, stage: SucculentStage) -> str:
    templates = _GROWTH_DESCRIPTIONS.get(stage, [])
    if not templates:
        return f"The {succulent.name} has changed."
    text = random.choice(templates).format(
        name=succulent.name, bloom=succulent.bloom_color,
    )
    return text


# ---------------------------------------------------------------------------
# Zen Garden — manages the full grid
# ---------------------------------------------------------------------------

# Adjacency bonus pairs (succulents that look nice next to certain rocks)
HARMONY_PAIRS: set[frozenset[str]] = {
    frozenset({"Echeveria", "River Stone"}),
    frozenset({"Jade Plant", "Moss Rock"}),
    frozenset({"Aloe", "Sandstone"}),
    frozenset({"Lithops", "Pebble"}),
    frozenset({"Moonstone", "Quartz Crystal"}),
    frozenset({"Black Prince", "Obsidian"}),
    frozenset({"Zebra Plant", "Slate Slab"}),
    frozenset({"Hens and Chicks", "River Stone"}),
}

HARMONY_PAIR_BONUS = 5  # harmony points for each matched pair


class ZenGarden:
    """A zen garden grid for placing succulents and rocks."""

    def __init__(self, rows: int = 5, cols: int = 7) -> None:
        self.rows = rows
        self.cols = cols
        self.tiles: list[list[ZenTile]] = [
            [ZenTile(r, c) for c in range(cols)]
            for r in range(rows)
        ]
        self.day: int = 0
        self.event_log: list[str] = []
        self.total_placements: int = 0

    # -- Access helpers -------------------------------------------------------

    def get_tile(self, row: int, col: int) -> Optional[ZenTile]:
        if 0 <= row < self.rows and 0 <= col < self.cols:
            return self.tiles[row][col]
        return None

    def all_tiles(self) -> list[ZenTile]:
        return [t for row in self.tiles for t in row]

    def succulent_tiles(self) -> list[ZenTile]:
        return [t for t in self.all_tiles() if t.has_succulent]

    def rock_tiles(self) -> list[ZenTile]:
        return [t for t in self.all_tiles() if t.has_rock]

    def raked_tiles(self) -> list[ZenTile]:
        return [t for t in self.all_tiles() if t.rake_pattern is not RakePattern.NONE]

    # -- Placement -----------------------------------------------------------

    def place_succulent(self, row: int, col: int, succulent: SucculentType) -> str:
        tile = self.get_tile(row, col)
        if tile is None:
            return "That tile doesn't exist!"
        msg = tile.place_succulent(succulent)
        if "Planted" in msg:
            self.total_placements += 1
            self.event_log.append(f"Planted {succulent.name} at ({row},{col}).")
        return msg

    def place_rock(self, row: int, col: int, rock: RockType) -> str:
        tile = self.get_tile(row, col)
        if tile is None:
            return "That tile doesn't exist!"
        msg = tile.place_rock(rock)
        if "Placed" in msg:
            self.total_placements += 1
            self.event_log.append(f"Placed {rock.name} at ({row},{col}).")
        return msg

    def rake_tile(self, row: int, col: int, pattern: RakePattern) -> str:
        tile = self.get_tile(row, col)
        if tile is None:
            return "That tile doesn't exist!"
        return tile.rake(pattern)

    def remove_item(self, row: int, col: int) -> str:
        tile = self.get_tile(row, col)
        if tile is None:
            return "That tile doesn't exist!"
        return tile.remove()

    # -- Daily tick -----------------------------------------------------------

    def advance_day(self) -> list[str]:
        """Advance one day: grow succulents slowly."""
        self.day += 1
        events: list[str] = []

        for tile in self.succulent_tiles():
            succulent = tile.succulent
            tile.days_planted += 1

            if tile.succulent_stage is SucculentStage.BLOOMING:
                continue  # already fully grown

            # Succulents grow slowly — daily increment based on days_to_mature
            daily_growth = 1.0 / succulent.days_to_mature

            # Overwatering penalty for succulents (they prefer dry conditions)
            if tile.times_watered > succulent.water_tolerance * tile.days_planted:
                daily_growth *= 0.5
                events.append(
                    f"The {succulent.name} at ({tile.row},{tile.col}) "
                    f"seems overwatered..."
                )

            tile.growth_progress = min(1.0, tile.growth_progress + daily_growth)

            # Advance through growth stages
            thresholds = [0.0, 0.30, 0.65, 0.95]
            stage_idx = _SUCCULENT_STAGE_ORDER.index(tile.succulent_stage)
            for i in range(stage_idx + 1, len(thresholds)):
                if tile.growth_progress >= thresholds[i]:
                    old_stage = tile.succulent_stage
                    tile.succulent_stage = _SUCCULENT_STAGE_ORDER[i]
                    if tile.succulent_stage is not old_stage:
                        desc = _growth_description(succulent, tile.succulent_stage)
                        events.append(f"({tile.row},{tile.col}) {desc}")

        return events

    # -- Harmony scoring ------------------------------------------------------

    def harmony_score(self) -> int:
        """Calculate the garden's overall harmony (0-100)."""
        score = 0
        total_tiles = self.rows * self.cols
        succulents = self.succulent_tiles()
        rocks = self.rock_tiles()
        raked = self.raked_tiles()

        # 1. Balance: ideal ratio is ~30% succulents, ~20% rocks, ~50% sand/raked
        occupied = len(succulents) + len(rocks)
        if total_tiles > 0:
            fill_ratio = occupied / total_tiles
            # Best harmony at 30-50% fill
            if 0.2 <= fill_ratio <= 0.6:
                score += 20
            elif 0.1 <= fill_ratio <= 0.7:
                score += 10

        # 2. Variety: bonus for having both succulents and rocks
        if succulents and rocks:
            score += 15
        elif succulents or rocks:
            score += 5

        # 3. Raked sand patterns add to tranquility
        if raked:
            rake_ratio = len(raked) / max(total_tiles - occupied, 1)
            score += min(15, int(rake_ratio * 20))

        # 4. Mature/blooming succulents
        mature_count = sum(
            1 for t in succulents
            if t.succulent_stage in (SucculentStage.MATURE, SucculentStage.BLOOMING)
        )
        if succulents:
            maturity_ratio = mature_count / len(succulents)
            score += int(maturity_ratio * 15)

        # 5. Harmony pairs (adjacent succulent-rock combos)
        pair_bonus = 0
        for tile in succulents:
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                neighbor = self.get_tile(tile.row + dr, tile.col + dc)
                if neighbor and neighbor.has_rock:
                    pair = frozenset({tile.succulent.name, neighbor.rock.name})
                    if pair in HARMONY_PAIRS:
                        pair_bonus += HARMONY_PAIR_BONUS
        score += min(20, pair_bonus)

        # 6. Symmetry bonus: check left-right mirror (only if items placed)
        if occupied > 0:
            symmetry = self._check_symmetry()
            score += int(symmetry * 15)

        return min(100, score)

    def _check_symmetry(self) -> float:
        """Check how symmetrical the garden layout is (0.0-1.0)."""
        matches = 0
        total = 0
        for r in range(self.rows):
            for c in range(self.cols // 2):
                mirror_c = self.cols - 1 - c
                left = self.tiles[r][c]
                right = self.tiles[r][mirror_c]
                total += 1
                if left.kind == right.kind:
                    matches += 1
        return matches / max(total, 1)

    def harmony_description(self) -> str:
        """Return a text description of the current harmony level."""
        h = self.harmony_score()
        if h >= 90:
            return "Perfect tranquility. The garden radiates peace."
        if h >= 70:
            return "A deeply harmonious arrangement. Very serene."
        if h >= 50:
            return "A balanced garden with a pleasant energy."
        if h >= 30:
            return "The garden is taking shape, but could use more balance."
        if h >= 10:
            return "A few elements placed — the journey has begun."
        return "An empty canvas of sand, full of potential."

    # -- Display --------------------------------------------------------------

    def status(self) -> str:
        """Return a text overview of the zen garden."""
        lines = [
            f"=== Zen Garden (Day {self.day}) ===",
            f"    Tiles: {self.rows}x{self.cols}  |  "
            f"Succulents: {len(self.succulent_tiles())}  |  "
            f"Rocks: {len(self.rock_tiles())}  |  "
            f"Harmony: {self.harmony_score()}/100",
            "",
        ]
        for r in range(self.rows):
            row_parts = []
            for c in range(self.cols):
                tile = self.tiles[r][c]
                if tile.has_succulent:
                    row_parts.append(f"[{tile.succulent.emoji}]")
                elif tile.has_rock:
                    row_parts.append(f"[{tile.rock.emoji}]")
                elif tile.rake_pattern is not RakePattern.NONE:
                    row_parts.append("[~~]")
                else:
                    row_parts.append("[  ]")
            lines.append("  ".join(row_parts))
        lines.append("")
        lines.append(f"  {self.harmony_description()}")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Convenience: demo when run as a script
# ---------------------------------------------------------------------------

def _demo() -> None:
    garden = ZenGarden(5, 7)
    print(garden.status())
    print()

    garden.place_succulent(1, 1, ECHEVERIA)
    garden.place_succulent(1, 5, JADE_PLANT)
    garden.place_rock(0, 3, GRANITE_BOULDER)
    garden.place_rock(2, 2, RIVER_STONE)
    garden.place_rock(2, 4, MOSS_ROCK)
    garden.rake_tile(3, 1, RakePattern.WAVES)
    garden.rake_tile(3, 2, RakePattern.WAVES)
    garden.rake_tile(3, 3, RakePattern.WAVES)
    garden.rake_tile(3, 4, RakePattern.WAVES)
    garden.rake_tile(3, 5, RakePattern.WAVES)

    # Grow for a while
    for _ in range(15):
        events = garden.advance_day()
        for e in events:
            print(f"  {e}")

    print()
    print(garden.status())


if __name__ == "__main__":
    _demo()
