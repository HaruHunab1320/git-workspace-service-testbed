"""
weather.py — Magical Weather System for a Cozy Village Simulator

Generates whimsical, seasonal weather events for a small enchanted village.
Each tick of the simulation advances the sky, and rare magical phenomena
(aurora showers, petal blizzards, moonbow nights) can appear alongside
the everyday drizzle and sunshine.
"""

from __future__ import annotations

import enum
import math
import random
from dataclasses import dataclass, field
from typing import Callable


# ---------------------------------------------------------------------------
# Calendar helpers
# ---------------------------------------------------------------------------

class Season(enum.Enum):
    SPRING = "spring"
    SUMMER = "summer"
    AUTUMN = "autumn"
    WINTER = "winter"


SEASON_ORDER = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]

DAYS_PER_SEASON = 28  # four neat weeks per season
DAYS_PER_YEAR = DAYS_PER_SEASON * len(SEASON_ORDER)


def day_to_season(day: int) -> Season:
    """Return the season for a given absolute day number (0-indexed)."""
    index = (day % DAYS_PER_YEAR) // DAYS_PER_SEASON
    return SEASON_ORDER[index]


def day_within_season(day: int) -> int:
    """Return how far into the current season we are (0 … DAYS_PER_SEASON-1)."""
    return (day % DAYS_PER_YEAR) % DAYS_PER_SEASON


# ---------------------------------------------------------------------------
# Temperature model — smooth sinusoidal curve across the year
# ---------------------------------------------------------------------------

# Baseline temperatures (°C) at the midpoint of each season.
_SEASON_TEMP: dict[Season, float] = {
    Season.SPRING: 14.0,
    Season.SUMMER: 26.0,
    Season.AUTUMN: 12.0,
    Season.WINTER: -2.0,
}


def base_temperature(day: int) -> float:
    """Produce a smooth temperature curve using a cosine interpolation."""
    phase = (day % DAYS_PER_YEAR) / DAYS_PER_YEAR  # 0 → 1 over one year
    # Peak warmth at midsummer (phase ≈ 0.375), coldest midwinter (≈ 0.875)
    return 12.0 + 14.0 * math.cos(2 * math.pi * (phase - 0.375))


# ---------------------------------------------------------------------------
# Weather conditions
# ---------------------------------------------------------------------------

class Sky(enum.Enum):
    """Observable sky state shown to the player."""
    CLEAR = "clear"
    PARTLY_CLOUDY = "partly cloudy"
    OVERCAST = "overcast"
    DRIZZLE = "drizzle"
    RAIN = "rain"
    THUNDERSTORM = "thunderstorm"
    SNOW = "snow"
    BLIZZARD = "blizzard"
    FOG = "fog"
    HAIL = "hail"


class MagicalEvent(enum.Enum):
    """Rare magical weather phenomena that enchant the village."""
    NONE = "none"
    AURORA_SHOWER = "aurora shower"
    PETAL_BLIZZARD = "petal blizzard"
    MOONBOW_NIGHT = "moonbow night"
    GOLDEN_HOUR_ETERNAL = "eternal golden hour"
    STARFALL = "starfall"
    WHISPERING_MIST = "whispering mist"
    FIREFLY_STORM = "firefly storm"
    CRYSTAL_FROST = "crystal frost"
    RAINBOW_RAIN = "rainbow rain"
    SUNDOG_HALO = "sundog halo"


class WindDirection(enum.Enum):
    """Compass direction the wind blows from."""
    NORTH = "north"
    NORTHEAST = "northeast"
    EAST = "east"
    SOUTHEAST = "southeast"
    SOUTH = "south"
    SOUTHWEST = "southwest"
    WEST = "west"
    NORTHWEST = "northwest"


_WIND_DIRECTIONS = list(WindDirection)

# Seasonal prevailing-wind weights — index matches _WIND_DIRECTIONS order.
# Higher weight = more likely the wind blows from that direction.
_SEASONAL_WIND_BIAS: dict[Season, list[float]] = {
    Season.SPRING: [1, 1, 2, 3, 3, 2, 1, 1],  # prevailing southerlies
    Season.SUMMER: [1, 1, 1, 2, 3, 3, 2, 1],  # south-southwest
    Season.AUTUMN: [2, 2, 1, 1, 1, 1, 2, 3],  # northwest / north
    Season.WINTER: [3, 3, 2, 1, 1, 1, 2, 2],  # prevailing northerlies
}


# Which magical events are most likely in which seasons.
_SEASONAL_MAGIC: dict[Season, list[tuple[MagicalEvent, float]]] = {
    Season.SPRING: [
        (MagicalEvent.PETAL_BLIZZARD, 0.35),
        (MagicalEvent.RAINBOW_RAIN, 0.30),
        (MagicalEvent.WHISPERING_MIST, 0.20),
        (MagicalEvent.SUNDOG_HALO, 0.15),
    ],
    Season.SUMMER: [
        (MagicalEvent.GOLDEN_HOUR_ETERNAL, 0.30),
        (MagicalEvent.FIREFLY_STORM, 0.35),
        (MagicalEvent.SUNDOG_HALO, 0.20),
        (MagicalEvent.STARFALL, 0.15),
    ],
    Season.AUTUMN: [
        (MagicalEvent.WHISPERING_MIST, 0.30),
        (MagicalEvent.MOONBOW_NIGHT, 0.25),
        (MagicalEvent.AURORA_SHOWER, 0.25),
        (MagicalEvent.CRYSTAL_FROST, 0.20),
    ],
    Season.WINTER: [
        (MagicalEvent.AURORA_SHOWER, 0.30),
        (MagicalEvent.CRYSTAL_FROST, 0.30),
        (MagicalEvent.STARFALL, 0.25),
        (MagicalEvent.MOONBOW_NIGHT, 0.15),
    ],
}


# ---------------------------------------------------------------------------
# Forecast snapshot — one moment in the village sky
# ---------------------------------------------------------------------------

_SKY_SEVERITY: dict[Sky, float] = {
    Sky.CLEAR: 0.0, Sky.PARTLY_CLOUDY: 0.05, Sky.OVERCAST: 0.1,
    Sky.DRIZZLE: 0.15, Sky.FOG: 0.2, Sky.RAIN: 0.35,
    Sky.SNOW: 0.3, Sky.HAIL: 0.6, Sky.THUNDERSTORM: 0.7,
    Sky.BLIZZARD: 0.9,
}


@dataclass(frozen=True)
class Forecast:
    """An immutable snapshot of the village weather at a single point in time."""
    day: int
    season: Season
    sky: Sky
    temperature_c: float
    humidity: float          # 0.0 – 1.0
    wind_speed_kph: float
    wind_direction: WindDirection
    magical_event: MagicalEvent
    description: str

    @property
    def temperature_f(self) -> float:
        return self.temperature_c * 9.0 / 5.0 + 32.0

    @property
    def feels_like_c(self) -> float:
        """Perceived temperature accounting for wind chill and humidity."""
        t = self.temperature_c
        v = self.wind_speed_kph
        h = self.humidity
        # Wind chill (Environment Canada formula)
        if t <= 10.0 and v > 4.8:
            return round(
                13.12 + 0.6215 * t - 11.37 * v**0.16 + 0.3965 * t * v**0.16,
                1,
            )
        # Humidity heat bump
        if t >= 27.0 and h >= 0.40:
            return round(t + 5.0 * (h - 0.40), 1)
        return self.temperature_c

    @property
    def severity(self) -> float:
        """Weather severity from 0.0 (calm) to 1.0 (extreme)."""
        base = _SKY_SEVERITY.get(self.sky, 0.2)
        wind_factor = min(0.2, self.wind_speed_kph / 250.0)
        return min(1.0, round(base + wind_factor, 2))

    @property
    def is_magical(self) -> bool:
        return self.magical_event is not MagicalEvent.NONE

    def short_summary(self) -> str:
        """One-line summary suitable for a HUD overlay."""
        magic = f" ✦ {self.magical_event.value}!" if self.is_magical else ""
        return (
            f"Day {self.day} | {self.season.value.capitalize()} | "
            f"{self.sky.value} | {self.temperature_c:+.1f}°C "
            f"(feels {self.feels_like_c:+.1f}°C) | "
            f"wind {self.wind_direction.value} {self.wind_speed_kph:.0f} km/h"
            f"{magic}"
        )


# ---------------------------------------------------------------------------
# Cozy description generator
# ---------------------------------------------------------------------------

_COZY_TEMPLATES: dict[Sky, list[str]] = {
    Sky.CLEAR: [
        "Sunshine spills across the cobblestones like warm honey.",
        "Not a cloud in sight — laundry-drying weather for the whole village.",
        "The sky is a perfect, dreamy blue above the thatched rooftops.",
    ],
    Sky.PARTLY_CLOUDY: [
        "Fluffy clouds drift lazily, casting playful shadows on the meadow.",
        "Patches of sunlight dance between soft white clouds.",
        "A gentle breeze nudges cotton-ball clouds across the sky.",
    ],
    Sky.OVERCAST: [
        "A thick quilt of grey blankets the sky — perfect for reading by the fire.",
        "The clouds hang low, promising a quiet, introspective afternoon.",
        "A silver-grey sky wraps the village in a contemplative hush.",
    ],
    Sky.DRIZZLE: [
        "A fine mist of rain patters on windowpanes like tiny fingertips.",
        "The lightest drizzle coats the garden roses in shimmering droplets.",
        "Soft rain whispers through the leaves — time for tea and biscuits.",
    ],
    Sky.RAIN: [
        "Steady rain drums on the bakery's tin roof, filling the air with rhythm.",
        "Puddles form in the village square, delighting every passing duck.",
        "Rain cascades off the eaves in silver curtains.",
    ],
    Sky.THUNDERSTORM: [
        "Thunder rumbles over the hills — the cats all hide under the bed.",
        "Lightning briefly illuminates the old windmill on the ridge.",
        "A dramatic storm rolls in, sending villagers scurrying for shelter.",
    ],
    Sky.SNOW: [
        "Fat, lazy snowflakes tumble down, dusting the village like powdered sugar.",
        "A hush falls over the village as snow softly blankets every rooftop.",
        "Children press their noses to frosted windows, watching the snowfall.",
    ],
    Sky.BLIZZARD: [
        "The wind howls and snow flies sideways — best to stay by the hearth.",
        "A fierce blizzard turns the world into a swirling white canvas.",
        "Snowdrifts pile against doorways; the blacksmith stokes the forge higher.",
    ],
    Sky.FOG: [
        "Thick fog curls through the streets like a sleepy grey cat.",
        "The village lanterns glow like fireflies in the dense morning mist.",
        "Everything beyond the garden gate vanishes into soft white mystery.",
    ],
    Sky.HAIL: [
        "Tiny ice pebbles bounce off the cobblestones with a cheerful clatter.",
        "A sudden burst of hail sends the market vendors covering their stalls.",
        "Hailstones rattle against shutters before melting into tiny streams.",
    ],
}

_MAGIC_TEMPLATES: dict[MagicalEvent, list[str]] = {
    MagicalEvent.AURORA_SHOWER: [
        "Ribbons of green and violet light ripple across the night sky.",
        "The northern lights descend unusually low, painting the snow in colour.",
    ],
    MagicalEvent.PETAL_BLIZZARD: [
        "Cherry-blossom petals swirl through the air like pink snowflakes.",
        "A warm wind carries thousands of flower petals through the village.",
    ],
    MagicalEvent.MOONBOW_NIGHT: [
        "A pale, luminous rainbow arcs across the moonlit sky.",
        "The full moon casts a ghostly rainbow over the sleeping village.",
    ],
    MagicalEvent.GOLDEN_HOUR_ETERNAL: [
        "The sun lingers just above the horizon, bathing everything in gold.",
        "Time seems to slow as the world glows in an endless golden sunset.",
    ],
    MagicalEvent.STARFALL: [
        "Shooting stars streak across the heavens in dazzling silver trails.",
        "The sky erupts with falling stars — children rush outside to wish.",
    ],
    MagicalEvent.WHISPERING_MIST: [
        "The fog seems to murmur old lullabies as it drifts between houses.",
        "Villagers swear the mist carries faint, melodic whispers tonight.",
    ],
    MagicalEvent.FIREFLY_STORM: [
        "Thousands of fireflies rise from the meadow in a living constellation.",
        "The warm night air sparkles with countless tiny floating lanterns.",
    ],
    MagicalEvent.CRYSTAL_FROST: [
        "Every surface is covered in intricate frost patterns like lace.",
        "Ice crystals bloom on windows in impossibly beautiful fractal designs.",
    ],
    MagicalEvent.RAINBOW_RAIN: [
        "Each raindrop catches the light, falling in tiny prismatic colours.",
        "The rain itself shimmers with iridescent hues — a rainbow made liquid.",
    ],
    MagicalEvent.SUNDOG_HALO: [
        "Twin phantom suns flank the real one, ringed by a brilliant halo.",
        "A shimmering circle of light crowns the sun — the village gasps.",
    ],
}


def _build_description(sky: Sky, event: MagicalEvent, rng: random.Random) -> str:
    """Compose a cozy narrative snippet for a forecast."""
    parts: list[str] = [rng.choice(_COZY_TEMPLATES[sky])]
    if event is not MagicalEvent.NONE:
        parts.append(rng.choice(_MAGIC_TEMPLATES[event]))
    return " ".join(parts)


# ---------------------------------------------------------------------------
# Transition weights — which sky follows which, per-season
# ---------------------------------------------------------------------------

# Each mapping: current Sky → list of (next Sky, weight).
# Weights are relative; the engine normalises them.

_BASE_TRANSITIONS: dict[Sky, list[tuple[Sky, float]]] = {
    Sky.CLEAR: [
        (Sky.CLEAR, 5), (Sky.PARTLY_CLOUDY, 3), (Sky.FOG, 1),
    ],
    Sky.PARTLY_CLOUDY: [
        (Sky.CLEAR, 3), (Sky.PARTLY_CLOUDY, 3), (Sky.OVERCAST, 2),
        (Sky.DRIZZLE, 1),
    ],
    Sky.OVERCAST: [
        (Sky.PARTLY_CLOUDY, 2), (Sky.OVERCAST, 3), (Sky.DRIZZLE, 2),
        (Sky.RAIN, 1), (Sky.FOG, 1), (Sky.SNOW, 0.5),
    ],
    Sky.DRIZZLE: [
        (Sky.OVERCAST, 2), (Sky.DRIZZLE, 3), (Sky.RAIN, 2),
        (Sky.CLEAR, 1),
    ],
    Sky.RAIN: [
        (Sky.DRIZZLE, 2), (Sky.RAIN, 3), (Sky.THUNDERSTORM, 1),
        (Sky.OVERCAST, 2), (Sky.HAIL, 0.5),
    ],
    Sky.THUNDERSTORM: [
        (Sky.RAIN, 3), (Sky.OVERCAST, 2), (Sky.DRIZZLE, 1),
        (Sky.HAIL, 1),
    ],
    Sky.SNOW: [
        (Sky.SNOW, 4), (Sky.BLIZZARD, 1), (Sky.OVERCAST, 2),
        (Sky.CLEAR, 1),
    ],
    Sky.BLIZZARD: [
        (Sky.SNOW, 3), (Sky.BLIZZARD, 2), (Sky.OVERCAST, 2),
    ],
    Sky.FOG: [
        (Sky.FOG, 2), (Sky.CLEAR, 3), (Sky.PARTLY_CLOUDY, 2),
        (Sky.DRIZZLE, 1),
    ],
    Sky.HAIL: [
        (Sky.RAIN, 3), (Sky.OVERCAST, 2), (Sky.DRIZZLE, 1),
    ],
}

# Seasonal modifiers: multiply the weight of specific transitions.
_SEASON_MODIFIERS: dict[Season, dict[Sky, float]] = {
    Season.SPRING: {Sky.DRIZZLE: 1.8, Sky.RAIN: 1.4, Sky.FOG: 1.3},
    Season.SUMMER: {Sky.CLEAR: 1.6, Sky.THUNDERSTORM: 1.5, Sky.SNOW: 0.0, Sky.BLIZZARD: 0.0},
    Season.AUTUMN: {Sky.OVERCAST: 1.5, Sky.FOG: 2.0, Sky.RAIN: 1.3},
    Season.WINTER: {Sky.SNOW: 2.5, Sky.BLIZZARD: 1.8, Sky.CLEAR: 0.7, Sky.RAIN: 0.3},
}


def _pick_weighted(choices: list[tuple[Sky, float]], rng: random.Random) -> Sky:
    """Select from a weighted list using the provided RNG."""
    total = sum(w for _, w in choices)
    r = rng.random() * total
    cumulative = 0.0
    for item, weight in choices:
        cumulative += weight
        if r <= cumulative:
            return item
    return choices[-1][0]


def _next_sky(current: Sky, season: Season, rng: random.Random) -> Sky:
    """Markov-chain step: pick the next sky state."""
    raw = _BASE_TRANSITIONS.get(current, [(Sky.CLEAR, 1)])
    mods = _SEASON_MODIFIERS.get(season, {})
    adjusted = [(s, w * mods.get(s, 1.0)) for s, w in raw if w * mods.get(s, 1.0) > 0]
    if not adjusted:
        adjusted = [(Sky.CLEAR, 1)]
    return _pick_weighted(adjusted, rng)


# ---------------------------------------------------------------------------
# Weather engine
# ---------------------------------------------------------------------------

# Probability that *any* magical event fires on a given day.
_MAGIC_BASE_CHANCE = 0.08  # ~8 % per day

# Bonus chance during the season's "peak magic" window (middle third).
_MAGIC_PEAK_BONUS = 0.07


@dataclass
class WeatherEngine:
    """
    Stateful weather generator for the cozy village.

    Usage::

        engine = WeatherEngine(seed=42)
        for _ in range(10):
            forecast = engine.advance()
            print(forecast.short_summary())

    The engine tracks the current day, sky state, and an internal RNG so that
    weather sequences are deterministic for a given seed.
    """

    seed: int | None = None
    day: int = 0
    _sky: Sky = field(default=Sky.CLEAR, repr=False)
    _rng: random.Random = field(default_factory=random.Random, repr=False)
    _listeners: list[Callable[[Forecast], None]] = field(
        default_factory=list, repr=False,
    )

    def __post_init__(self) -> None:
        self._rng = random.Random(self.seed)

    # -- public API ---------------------------------------------------------

    def advance(self, days: int = 1) -> Forecast:
        """Advance the simulation by *days* ticks and return the final forecast."""
        forecast: Forecast | None = None
        for _ in range(days):
            forecast = self._step()
        assert forecast is not None
        return forecast

    def peek(self) -> Forecast:
        """Return a forecast for the current day without advancing time."""
        state = self._rng.getstate()
        forecast = self._make_forecast(self.day, self._sky)
        self._rng.setstate(state)
        return forecast

    def forecast_ahead(self, days: int) -> list[Forecast]:
        """
        Preview upcoming weather without mutating engine state.

        Returns a list of *days* forecasts starting from the current day.
        Uses a cloned RNG so the real timeline is unaffected.
        """
        clone = WeatherEngine(seed=None, day=self.day, _sky=self._sky)
        clone._rng.setstate(self._rng.getstate())
        return [clone.advance() for _ in range(days)]

    def subscribe(self, callback: Callable[[Forecast], None]) -> None:
        """Register a listener that is called after every new forecast."""
        self._listeners.append(callback)

    def unsubscribe(self, callback: Callable[[Forecast], None]) -> None:
        """Remove a previously registered listener."""
        self._listeners.remove(callback)

    def set_sky(self, sky: Sky) -> None:
        """Override the current sky — useful for story events or debugging."""
        self._sky = sky

    # -- internals ----------------------------------------------------------

    def _step(self) -> Forecast:
        season = day_to_season(self.day)
        self._sky = _next_sky(self._sky, season, self._rng)
        forecast = self._make_forecast(self.day, self._sky)
        self.day += 1
        for cb in self._listeners:
            cb(forecast)
        return forecast

    def _make_forecast(self, day: int, sky: Sky) -> Forecast:
        season = day_to_season(day)
        temp = self._jittered_temp(day)
        humidity = self._compute_humidity(sky)
        wind = self._compute_wind(sky)
        wind_dir = self._compute_wind_direction(season)
        event = self._roll_magic(day, season)
        desc = _build_description(sky, event, self._rng)
        return Forecast(
            day=day,
            season=season,
            sky=sky,
            temperature_c=round(temp, 1),
            humidity=round(humidity, 2),
            wind_speed_kph=round(wind, 1),
            wind_direction=wind_dir,
            magical_event=event,
            description=desc,
        )

    def _jittered_temp(self, day: int) -> float:
        base = base_temperature(day)
        jitter = self._rng.gauss(0, 2.5)
        return base + jitter

    def _compute_humidity(self, sky: Sky) -> float:
        base_map: dict[Sky, float] = {
            Sky.CLEAR: 0.30, Sky.PARTLY_CLOUDY: 0.45, Sky.OVERCAST: 0.65,
            Sky.DRIZZLE: 0.75, Sky.RAIN: 0.85, Sky.THUNDERSTORM: 0.90,
            Sky.SNOW: 0.70, Sky.BLIZZARD: 0.75, Sky.FOG: 0.95,
            Sky.HAIL: 0.80,
        }
        return min(1.0, max(0.0, base_map.get(sky, 0.5) + self._rng.gauss(0, 0.05)))

    def _compute_wind(self, sky: Sky) -> float:
        base_map: dict[Sky, float] = {
            Sky.CLEAR: 5.0, Sky.PARTLY_CLOUDY: 8.0, Sky.OVERCAST: 10.0,
            Sky.DRIZZLE: 7.0, Sky.RAIN: 15.0, Sky.THUNDERSTORM: 35.0,
            Sky.SNOW: 12.0, Sky.BLIZZARD: 50.0, Sky.FOG: 2.0,
            Sky.HAIL: 25.0,
        }
        return max(0.0, base_map.get(sky, 8.0) + self._rng.gauss(0, 3.0))

    def _compute_wind_direction(self, season: Season) -> WindDirection:
        weights = _SEASONAL_WIND_BIAS.get(season, [1] * 8)
        total = sum(weights)
        r = self._rng.random() * total
        cumulative = 0.0
        for direction, w in zip(_WIND_DIRECTIONS, weights):
            cumulative += w
            if r <= cumulative:
                return direction
        return _WIND_DIRECTIONS[-1]

    def _roll_magic(self, day: int, season: Season) -> MagicalEvent:
        chance = _MAGIC_BASE_CHANCE
        mid = DAYS_PER_SEASON // 2
        dist = abs(day_within_season(day) - mid)
        if dist < DAYS_PER_SEASON / 6:  # float division for true middle third
            chance += _MAGIC_PEAK_BONUS

        if self._rng.random() > chance:
            return MagicalEvent.NONE

        pool = _SEASONAL_MAGIC.get(season, [])
        if not pool:
            return MagicalEvent.NONE

        events, weights = zip(*pool)
        total = sum(weights)
        r = self._rng.random() * total
        cumulative = 0.0
        for ev, w in zip(events, weights):
            cumulative += w
            if r <= cumulative:
                return ev
        return events[-1]


# ---------------------------------------------------------------------------
# Village mood — derived from weather over time
# ---------------------------------------------------------------------------

class VillageMood(enum.Enum):
    """Aggregate mood of the village, influenced by recent weather."""
    JOYFUL = "joyful"
    CONTENT = "content"
    MELANCHOLY = "melancholy"
    COZY = "cozy"
    ENCHANTED = "enchanted"
    RESTLESS = "restless"


_SKY_MOOD_SCORE: dict[Sky, float] = {
    Sky.CLEAR: 1.0, Sky.PARTLY_CLOUDY: 0.8, Sky.OVERCAST: 0.3,
    Sky.DRIZZLE: 0.5, Sky.RAIN: 0.4, Sky.THUNDERSTORM: 0.1,
    Sky.SNOW: 0.7, Sky.BLIZZARD: 0.0, Sky.FOG: 0.4,
    Sky.HAIL: 0.2,
}


def compute_village_mood(recent: list[Forecast], window: int = 5) -> VillageMood:
    """
    Determine the village mood from the last *window* forecasts.

    The mood is a blend of average "pleasantness" and whether any magical
    events occurred recently.
    """
    if not recent:
        return VillageMood.CONTENT

    tail = recent[-window:]
    avg_score = sum(_SKY_MOOD_SCORE.get(f.sky, 0.5) for f in tail) / len(tail)
    magic_count = sum(1 for f in tail if f.is_magical)

    if magic_count >= 2:
        return VillageMood.ENCHANTED
    if avg_score >= 0.75:
        return VillageMood.JOYFUL
    if avg_score >= 0.55:
        return VillageMood.CONTENT
    if avg_score >= 0.35:
        return VillageMood.COZY
    if avg_score >= 0.20:
        return VillageMood.MELANCHOLY
    return VillageMood.RESTLESS


def detect_weather_streak(history: list[Forecast]) -> tuple[Sky, int]:
    """Return the current sky state and how many consecutive days it has lasted.

    Useful for triggering streak-based events or dialogue (e.g. villagers
    complaining about a week of rain).
    """
    if not history:
        return Sky.CLEAR, 0
    current = history[-1].sky
    streak = 0
    for fc in reversed(history):
        if fc.sky == current:
            streak += 1
        else:
            break
    return current, streak


# ---------------------------------------------------------------------------
# Seasonal festival eligibility
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class FestivalCondition:
    """A weather requirement for a seasonal festival to trigger."""
    name: str
    season: Season
    required_sky: set[Sky] | None = None
    min_temp_c: float | None = None
    max_temp_c: float | None = None
    requires_magic: bool = False
    required_magic: MagicalEvent | None = None

    def is_met(self, forecast: Forecast) -> bool:
        if forecast.season is not self.season:
            return False
        if self.required_sky and forecast.sky not in self.required_sky:
            return False
        if self.min_temp_c is not None and forecast.temperature_c < self.min_temp_c:
            return False
        if self.max_temp_c is not None and forecast.temperature_c > self.max_temp_c:
            return False
        if self.requires_magic and not forecast.is_magical:
            return False
        if self.required_magic and forecast.magical_event is not self.required_magic:
            return False
        return True


# Pre-defined village festivals.
FESTIVALS: list[FestivalCondition] = [
    FestivalCondition(
        name="Blossom Dance",
        season=Season.SPRING,
        required_sky={Sky.CLEAR, Sky.PARTLY_CLOUDY},
        min_temp_c=10.0,
    ),
    FestivalCondition(
        name="Petal Reverie",
        season=Season.SPRING,
        requires_magic=True,
        required_magic=MagicalEvent.PETAL_BLIZZARD,
    ),
    FestivalCondition(
        name="Firefly Gala",
        season=Season.SUMMER,
        required_sky={Sky.CLEAR},
        min_temp_c=20.0,
        requires_magic=True,
        required_magic=MagicalEvent.FIREFLY_STORM,
    ),
    FestivalCondition(
        name="Midsummer Feast",
        season=Season.SUMMER,
        required_sky={Sky.CLEAR, Sky.PARTLY_CLOUDY},
        min_temp_c=22.0,
    ),
    FestivalCondition(
        name="Harvest Moon Vigil",
        season=Season.AUTUMN,
        required_sky={Sky.CLEAR, Sky.FOG},
        requires_magic=True,
        required_magic=MagicalEvent.MOONBOW_NIGHT,
    ),
    FestivalCondition(
        name="Lantern Walk",
        season=Season.AUTUMN,
        required_sky={Sky.OVERCAST, Sky.FOG},
    ),
    FestivalCondition(
        name="Frost Fair",
        season=Season.WINTER,
        required_sky={Sky.SNOW, Sky.CLEAR},
        max_temp_c=0.0,
    ),
    FestivalCondition(
        name="Aurora Celebration",
        season=Season.WINTER,
        requires_magic=True,
        required_magic=MagicalEvent.AURORA_SHOWER,
    ),
]


def eligible_festivals(forecast: Forecast) -> list[str]:
    """Return names of all festivals whose conditions are met by *forecast*."""
    return [f.name for f in FESTIVALS if f.is_met(forecast)]


# ---------------------------------------------------------------------------
# Convenience: quick demo when run as a script
# ---------------------------------------------------------------------------

def _demo() -> None:
    engine = WeatherEngine(seed=7)
    history: list[Forecast] = []
    print("=== Cozy Village Weather — One Full Year ===\n")
    for _ in range(DAYS_PER_YEAR):
        fc = engine.advance()
        history.append(fc)
        fests = eligible_festivals(fc)
        fest_str = f"  Festivals: {', '.join(fests)}" if fests else ""
        severity_bar = "#" * int(fc.severity * 10)
        print(f"  {fc.short_summary()}  [{severity_bar:<10}]{fest_str}")
        if fc.is_magical:
            print(f"    -> {fc.description}")
    print()
    mood = compute_village_mood(history)
    sky, streak = detect_weather_streak(history)
    print(f"After a full year, the village mood is: {mood.value}")
    print(f"Current weather streak: {streak} day(s) of {sky.value}")


if __name__ == "__main__":
    _demo()
