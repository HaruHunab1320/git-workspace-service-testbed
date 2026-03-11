"""
candles.py — Candle Workshop for the Cozy Village Simulator.

Players can craft scented candles from wax and fragrance ingredients.
Lit candles slowly burn down over game days and boost village mood
while they last. Each scent has a unique color, burn duration, and
mood effect.

Usage::

    workshop = CandleWorkshop()
    candle = workshop.craft("lavender")
    workshop.light(candle.id)
    workshop.advance_day()  # candles burn down
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Scent definitions
# ---------------------------------------------------------------------------

class Scent(Enum):
    LAVENDER = "lavender"
    VANILLA = "vanilla"
    PINE = "pine"
    CINNAMON = "cinnamon"
    OCEAN_BREEZE = "ocean breeze"
    HONEY = "honey"
    ROSE = "rose"
    CEDAR = "cedar"


@dataclass(frozen=True)
class ScentProfile:
    """Defines a candle scent with its properties."""
    scent: Scent
    name: str
    emoji: str
    color: str
    dark_color: str
    burn_days: int
    mood_boost: str
    description: str
    season_bonus: str  # season where this scent gives extra mood boost


ALL_SCENTS: list[ScentProfile] = [
    ScentProfile(
        scent=Scent.LAVENDER,
        name="Lavender Dream",
        emoji="💜",
        color="#b8a9e8",
        dark_color="#8a7bb5",
        burn_days=5,
        mood_boost="calm",
        description="Soothing floral notes that ease the mind into tranquility",
        season_bonus="spring",
    ),
    ScentProfile(
        scent=Scent.VANILLA,
        name="Warm Vanilla",
        emoji="🤎",
        color="#f5e6c8",
        dark_color="#d4b896",
        burn_days=6,
        mood_boost="happy",
        description="Rich, sweet warmth like a freshly baked treat",
        season_bonus="winter",
    ),
    ScentProfile(
        scent=Scent.PINE,
        name="Forest Pine",
        emoji="🌲",
        color="#7ab77a",
        dark_color="#4a8a4a",
        burn_days=4,
        mood_boost="excited",
        description="Crisp evergreen that brings the forest indoors",
        season_bonus="winter",
    ),
    ScentProfile(
        scent=Scent.CINNAMON,
        name="Cinnamon Spice",
        emoji="🍂",
        color="#c47a3a",
        dark_color="#8a5225",
        burn_days=4,
        mood_boost="grateful",
        description="Warm spice that fills the home with autumn comfort",
        season_bonus="autumn",
    ),
    ScentProfile(
        scent=Scent.OCEAN_BREEZE,
        name="Ocean Breeze",
        emoji="🌊",
        color="#7ab8d4",
        dark_color="#4a8aaa",
        burn_days=5,
        mood_boost="calm",
        description="Fresh sea air and salt spray on a gentle tide",
        season_bonus="summer",
    ),
    ScentProfile(
        scent=Scent.HONEY,
        name="Golden Honey",
        emoji="🍯",
        color="#e8c44a",
        dark_color="#c4a030",
        burn_days=7,
        mood_boost="happy",
        description="Sweet golden warmth from the village apiary",
        season_bonus="summer",
    ),
    ScentProfile(
        scent=Scent.ROSE,
        name="Wild Rose",
        emoji="🌹",
        color="#e89ab4",
        dark_color="#c47090",
        burn_days=3,
        mood_boost="grateful",
        description="Delicate petals gathered from the meadow at dawn",
        season_bonus="spring",
    ),
    ScentProfile(
        scent=Scent.CEDAR,
        name="Cedarwood",
        emoji="🪵",
        color="#a0785a",
        dark_color="#785a3a",
        burn_days=8,
        mood_boost="calm",
        description="Deep, grounding woodiness from ancient trees",
        season_bonus="autumn",
    ),
]

SCENT_MAP: dict[str, ScentProfile] = {s.scent.value: s for s in ALL_SCENTS}


# ---------------------------------------------------------------------------
# Candle model
# ---------------------------------------------------------------------------

@dataclass
class Candle:
    """A single crafted candle."""
    id: int
    scent: ScentProfile
    lit: bool = False
    burn_remaining: int = 0
    crafted_day: int = 0

    def __post_init__(self):
        if self.burn_remaining == 0:
            self.burn_remaining = self.scent.burn_days

    @property
    def burn_fraction(self) -> float:
        """How much of the candle remains (1.0 = full, 0.0 = spent)."""
        if self.scent.burn_days == 0:
            return 0.0
        return self.burn_remaining / self.scent.burn_days

    @property
    def is_spent(self) -> bool:
        return self.burn_remaining <= 0

    @property
    def status(self) -> str:
        if self.is_spent:
            return "spent"
        if self.lit:
            return "lit"
        return "unlit"


# ---------------------------------------------------------------------------
# Workshop
# ---------------------------------------------------------------------------

COZY_CRAFT_MESSAGES = [
    "You carefully melt the wax and pour it into a mold...",
    "The fragrance fills the workshop as you stir in the scent...",
    "You set the wick in place with steady hands...",
    "A beautiful candle takes shape under your care...",
    "The workshop smells wonderful as the candle cools...",
]


class CandleWorkshop:
    """Manages the player's candle collection and crafting."""

    def __init__(self, seed: int = 42) -> None:
        self._rng = random.Random(seed)
        self._next_id = 1
        self.candles: list[Candle] = []
        self.total_crafted: int = 0
        self.total_burned: int = 0  # fully burned candles

    def craft(self, scent_key: str, day: int = 0) -> tuple[Candle, str]:
        """Craft a new candle of the given scent. Returns (candle, message)."""
        profile = SCENT_MAP.get(scent_key.lower())
        if profile is None:
            raise ValueError(f"Unknown scent: {scent_key}")

        candle = Candle(
            id=self._next_id,
            scent=profile,
            crafted_day=day,
        )
        self._next_id += 1
        self.candles.append(candle)
        self.total_crafted += 1

        msg = self._rng.choice(COZY_CRAFT_MESSAGES)
        return candle, f"{profile.emoji} {msg} You crafted a {profile.name} candle!"

    def light(self, candle_id: int) -> str:
        """Light an unlit candle."""
        candle = self._find(candle_id)
        if candle is None:
            raise ValueError(f"Candle {candle_id} not found")
        if candle.is_spent:
            return f"This {candle.scent.name} candle has burned away completely."
        if candle.lit:
            return f"The {candle.scent.name} candle is already glowing softly."
        candle.lit = True
        return (
            f"{candle.scent.emoji} You light the {candle.scent.name} candle. "
            f"A warm glow and gentle fragrance fill the room."
        )

    def extinguish(self, candle_id: int) -> str:
        """Extinguish a lit candle to preserve it."""
        candle = self._find(candle_id)
        if candle is None:
            raise ValueError(f"Candle {candle_id} not found")
        if not candle.lit:
            return f"The {candle.scent.name} candle is not lit."
        candle.lit = False
        return (
            f"You gently blow out the {candle.scent.name} candle. "
            f"A wisp of smoke curls upward. ({candle.burn_remaining} days remaining)"
        )

    def remove(self, candle_id: int) -> str:
        """Remove a spent candle from the collection."""
        candle = self._find(candle_id)
        if candle is None:
            raise ValueError(f"Candle {candle_id} not found")
        self.candles = [c for c in self.candles if c.id != candle_id]
        return f"You clear away the {candle.scent.name} candle."

    def advance_day(self) -> list[str]:
        """Burn lit candles down by one day. Returns event messages."""
        events: list[str] = []
        for candle in self.candles:
            if candle.lit and not candle.is_spent:
                candle.burn_remaining -= 1
                if candle.is_spent:
                    candle.lit = False
                    self.total_burned += 1
                    events.append(
                        f"{candle.scent.emoji} Your {candle.scent.name} candle "
                        f"has burned down to nothing. Its warmth lingers..."
                    )
                else:
                    pct = round(candle.burn_fraction * 100)
                    events.append(
                        f"{candle.scent.emoji} {candle.scent.name} candle "
                        f"glows softly ({pct}% remaining)"
                    )
        return events

    def mood_effects(self, season: str = "") -> list[str]:
        """Return the mood effects of all currently lit candles."""
        effects = []
        for candle in self.candles:
            if candle.lit and not candle.is_spent:
                bonus = " (season bonus!)" if candle.scent.season_bonus == season else ""
                effects.append(f"{candle.scent.mood_boost}{bonus}")
        return effects

    def lit_count(self) -> int:
        return sum(1 for c in self.candles if c.lit and not c.is_spent)

    def summary(self) -> dict:
        """Return a summary of the workshop state."""
        return {
            "total_candles": len(self.candles),
            "lit_candles": self.lit_count(),
            "total_crafted": self.total_crafted,
            "total_burned": self.total_burned,
        }

    def _find(self, candle_id: int) -> Optional[Candle]:
        for c in self.candles:
            if c.id == candle_id:
                return c
        return None
