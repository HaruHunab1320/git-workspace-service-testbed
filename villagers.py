"""
villagers.py — Cozy Village Simulator: NPC Daily Routines & Friendships

A complex module for managing villager NPCs in a cozy village simulator.
Villagers have personalities, daily schedules, friendship networks, moods,
gift preferences, and dynamic interactions that evolve over time.
"""

from __future__ import annotations

import enum
import random
from collections import defaultdict
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


class TimeOfDay(enum.Enum):
    DAWN = "dawn"          # 5-7
    MORNING = "morning"    # 7-12
    AFTERNOON = "afternoon"  # 12-17
    EVENING = "evening"    # 17-21
    NIGHT = "night"        # 21-5


class Personality(enum.Enum):
    CHEERFUL = "cheerful"
    GRUMPY = "grumpy"
    SHY = "shy"
    ADVENTUROUS = "adventurous"
    SCHOLARLY = "scholarly"
    NURTURING = "nurturing"


class Mood(enum.Enum):
    JOYFUL = "joyful"
    CONTENT = "content"
    NEUTRAL = "neutral"
    LONELY = "lonely"
    UPSET = "upset"


class LocationType(enum.Enum):
    HOME = "home"
    SHOP = "shop"
    PLAZA = "plaza"
    FARM = "farm"
    FOREST = "forest"
    LIBRARY = "library"
    CAFE = "cafe"
    BEACH = "beach"
    GARDEN = "garden"
    WORKSHOP = "workshop"


class GiftCategory(enum.Enum):
    FLOWER = "flower"
    FOOD = "food"
    BOOK = "book"
    TOOL = "tool"
    GEMSTONE = "gemstone"
    HANDMADE = "handmade"
    FISH = "fish"
    FORAGED = "foraged"


class FriendshipTier(enum.Enum):
    STRANGER = "stranger"        # 0-19
    ACQUAINTANCE = "acquaintance"  # 20-49
    FRIEND = "friend"            # 50-99
    CLOSE_FRIEND = "close_friend"  # 100-149
    BEST_FRIEND = "best_friend"  # 150+

    @classmethod
    def from_points(cls, points: int) -> FriendshipTier:
        if points >= 150:
            return cls.BEST_FRIEND
        if points >= 100:
            return cls.CLOSE_FRIEND
        if points >= 50:
            return cls.FRIEND
        if points >= 20:
            return cls.ACQUAINTANCE
        return cls.STRANGER


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Location:
    name: str
    location_type: LocationType
    capacity: int = 10

    def __str__(self) -> str:
        return self.name


@dataclass
class ScheduleEntry:
    """One slot in a villager's daily schedule."""
    time_of_day: TimeOfDay
    location: Location
    activity: str  # e.g. "watering crops", "reading by the fire"

    def describe(self) -> str:
        return f"{self.activity} at {self.location} during the {self.time_of_day.value}"


@dataclass
class Gift:
    name: str
    category: GiftCategory
    quality: int = 1  # 1-5 star quality

    def __str__(self) -> str:
        stars = "\u2605" * self.quality
        return f"{self.name} ({stars})"


@dataclass
class FriendshipRecord:
    """Tracks the friendship between two villagers or a villager and the player."""
    target_id: str
    points: int = 0
    gifts_given: list[str] = field(default_factory=list)
    conversations_today: int = 0
    days_known: int = 0

    @property
    def tier(self) -> FriendshipTier:
        return FriendshipTier.from_points(self.points)

    def add_points(self, amount: int) -> FriendshipTier:
        old_tier = self.tier
        self.points = max(0, self.points + amount)
        new_tier = self.tier
        if new_tier != old_tier:
            return new_tier
        return old_tier

    def record_gift(self, gift_name: str) -> None:
        self.gifts_given.append(gift_name)

    def new_day(self) -> None:
        self.conversations_today = 0
        self.days_known += 1


@dataclass
class MemoryEntry:
    """Something a villager remembers about an interaction."""
    day: int
    description: str
    sentiment: int  # -2 to +2


# ---------------------------------------------------------------------------
# Personality → preference tables
# ---------------------------------------------------------------------------

PERSONALITY_GIFT_AFFINITY: dict[Personality, dict[GiftCategory, int]] = {
    Personality.CHEERFUL: {
        GiftCategory.FLOWER: 3, GiftCategory.FOOD: 2, GiftCategory.HANDMADE: 2,
        GiftCategory.BOOK: 0, GiftCategory.TOOL: 0, GiftCategory.GEMSTONE: 1,
        GiftCategory.FISH: 1, GiftCategory.FORAGED: 1,
    },
    Personality.GRUMPY: {
        GiftCategory.FLOWER: -1, GiftCategory.FOOD: 1, GiftCategory.HANDMADE: 0,
        GiftCategory.BOOK: 1, GiftCategory.TOOL: 3, GiftCategory.GEMSTONE: 2,
        GiftCategory.FISH: 2, GiftCategory.FORAGED: 0,
    },
    Personality.SHY: {
        GiftCategory.FLOWER: 2, GiftCategory.FOOD: 1, GiftCategory.HANDMADE: 3,
        GiftCategory.BOOK: 2, GiftCategory.TOOL: 0, GiftCategory.GEMSTONE: 1,
        GiftCategory.FISH: 0, GiftCategory.FORAGED: 2,
    },
    Personality.ADVENTUROUS: {
        GiftCategory.FLOWER: 0, GiftCategory.FOOD: 1, GiftCategory.HANDMADE: 1,
        GiftCategory.BOOK: 1, GiftCategory.TOOL: 2, GiftCategory.GEMSTONE: 3,
        GiftCategory.FISH: 2, GiftCategory.FORAGED: 2,
    },
    Personality.SCHOLARLY: {
        GiftCategory.FLOWER: 1, GiftCategory.FOOD: 0, GiftCategory.HANDMADE: 1,
        GiftCategory.BOOK: 3, GiftCategory.TOOL: 1, GiftCategory.GEMSTONE: 2,
        GiftCategory.FISH: 0, GiftCategory.FORAGED: 1,
    },
    Personality.NURTURING: {
        GiftCategory.FLOWER: 3, GiftCategory.FOOD: 3, GiftCategory.HANDMADE: 2,
        GiftCategory.BOOK: 1, GiftCategory.TOOL: 0, GiftCategory.GEMSTONE: 1,
        GiftCategory.FISH: 1, GiftCategory.FORAGED: 2,
    },
}

PERSONALITY_MOOD_WEIGHTS: dict[Personality, dict[Mood, float]] = {
    Personality.CHEERFUL:    {Mood.JOYFUL: 0.40, Mood.CONTENT: 0.35, Mood.NEUTRAL: 0.15, Mood.LONELY: 0.05, Mood.UPSET: 0.05},
    Personality.GRUMPY:      {Mood.JOYFUL: 0.05, Mood.CONTENT: 0.15, Mood.NEUTRAL: 0.35, Mood.LONELY: 0.10, Mood.UPSET: 0.35},
    Personality.SHY:         {Mood.JOYFUL: 0.10, Mood.CONTENT: 0.25, Mood.NEUTRAL: 0.30, Mood.LONELY: 0.25, Mood.UPSET: 0.10},
    Personality.ADVENTUROUS: {Mood.JOYFUL: 0.35, Mood.CONTENT: 0.30, Mood.NEUTRAL: 0.20, Mood.LONELY: 0.05, Mood.UPSET: 0.10},
    Personality.SCHOLARLY:   {Mood.JOYFUL: 0.15, Mood.CONTENT: 0.35, Mood.NEUTRAL: 0.30, Mood.LONELY: 0.10, Mood.UPSET: 0.10},
    Personality.NURTURING:   {Mood.JOYFUL: 0.30, Mood.CONTENT: 0.35, Mood.NEUTRAL: 0.15, Mood.LONELY: 0.15, Mood.UPSET: 0.05},
}

# Dialogue snippets keyed by (Personality, Mood)
DIALOGUE_TEMPLATES: dict[tuple[Personality, Mood], list[str]] = {
    (Personality.CHEERFUL, Mood.JOYFUL): [
        "What a beautiful day! I could dance in the meadow!",
        "Everything just feels *right* today, don't you think?",
    ],
    (Personality.CHEERFUL, Mood.CONTENT): [
        "Hey there, neighbour! Need anything from the market?",
        "I baked extra scones this morning — want one?",
    ],
    (Personality.GRUMPY, Mood.NEUTRAL): [
        "Hmph. At least the weather's tolerable.",
        "You again? ...Fine, I suppose you can stay.",
    ],
    (Personality.GRUMPY, Mood.UPSET): [
        "Don't talk to me. Just — don't.",
        "Everything is awful and my turnips are wilting.",
    ],
    (Personality.SHY, Mood.LONELY): [
        "Oh... hi. I was just... sitting here. Alone.",
        "Do you... want to maybe hang out? It's okay if not.",
    ],
    (Personality.SHY, Mood.CONTENT): [
        "I finished a new pressed-flower bookmark today!",
        "It's nice here, isn't it? Quiet...",
    ],
    (Personality.ADVENTUROUS, Mood.JOYFUL): [
        "I found a hidden trail up the mountain — wanna come?!",
        "Today I'm mapping the caves past the old bridge!",
    ],
    (Personality.ADVENTUROUS, Mood.CONTENT): [
        "I collected some neat rocks on my hike. Look!",
        "The view from the ridge at dawn was incredible.",
    ],
    (Personality.SCHOLARLY, Mood.CONTENT): [
        "I just finished a fascinating chapter on soil composition.",
        "Did you know there are over 300 species of beetle in this region?",
    ],
    (Personality.SCHOLARLY, Mood.NEUTRAL): [
        "Hmm? Oh, sorry, I was deep in thought.",
        "I need to reorganize the library's mythology section...",
    ],
    (Personality.NURTURING, Mood.JOYFUL): [
        "The new seedlings in the garden are sprouting! Come see!",
        "I made soup for everyone — grab a bowl, dear!",
    ],
    (Personality.NURTURING, Mood.CONTENT): [
        "How are you feeling today? You look a little tired.",
        "Remember to eat well and rest, okay?",
    ],
}


# ---------------------------------------------------------------------------
# Villager
# ---------------------------------------------------------------------------

class Villager:
    """An NPC villager with a daily schedule, personality, friendships, and memories."""

    def __init__(
        self,
        villager_id: str,
        name: str,
        personality: Personality,
        home: Location,
        *,
        birthday_season: Season = Season.SPRING,
        birthday_day: int = 1,
        favourite_gift: Optional[Gift] = None,
    ) -> None:
        self.villager_id = villager_id
        self.name = name
        self.personality = personality
        self.home = home
        self.birthday_season = birthday_season
        self.birthday_day = birthday_day
        self.favourite_gift = favourite_gift

        self.mood: Mood = Mood.NEUTRAL
        self.energy: int = 100  # 0-100
        self.current_location: Location = home
        self.schedule: dict[Season, list[ScheduleEntry]] = {}
        self.friendships: dict[str, FriendshipRecord] = {}
        self.memories: list[MemoryEntry] = []
        self._activity: str = "resting at home"

    # -- Schedule -----------------------------------------------------------

    def set_schedule(self, season: Season, entries: list[ScheduleEntry]) -> None:
        self.schedule[season] = entries

    def get_current_schedule_entry(
        self, season: Season, time: TimeOfDay
    ) -> Optional[ScheduleEntry]:
        for entry in self.schedule.get(season, []):
            if entry.time_of_day == time:
                return entry
        return None

    def advance_to(self, season: Season, time: TimeOfDay) -> str:
        """Move the villager according to their schedule and return a description."""
        entry = self.get_current_schedule_entry(season, time)
        if entry:
            self.current_location = entry.location
            self._activity = entry.activity
        else:
            # Default: go home if no schedule entry
            self.current_location = self.home
            self._activity = "resting at home"
        # Drain energy over the day, recover at night
        if time == TimeOfDay.NIGHT:
            self.energy = min(100, self.energy + 40)
        else:
            self.energy = max(0, self.energy - random.randint(5, 15))
        return f"{self.name} is {self._activity} ({self.current_location})."

    # -- Mood ---------------------------------------------------------------

    def roll_daily_mood(self) -> Mood:
        """Sample today's base mood from personality-weighted distribution."""
        weights = PERSONALITY_MOOD_WEIGHTS[self.personality]
        moods = list(weights.keys())
        probs = list(weights.values())
        self.mood = random.choices(moods, weights=probs, k=1)[0]
        return self.mood

    def adjust_mood(self, delta: int) -> Mood:
        """Shift mood on the ordered scale by *delta* steps (positive = happier)."""
        ordered = [Mood.UPSET, Mood.LONELY, Mood.NEUTRAL, Mood.CONTENT, Mood.JOYFUL]
        idx = ordered.index(self.mood)
        new_idx = max(0, min(len(ordered) - 1, idx + delta))
        self.mood = ordered[new_idx]
        return self.mood

    # -- Friendships --------------------------------------------------------

    def get_friendship(self, target_id: str) -> FriendshipRecord:
        if target_id not in self.friendships:
            self.friendships[target_id] = FriendshipRecord(target_id=target_id)
        return self.friendships[target_id]

    def talk_to(self, other: Villager, day: int) -> str:
        """Simulate a conversation between two villagers."""
        record = self.get_friendship(other.villager_id)
        other_record = other.get_friendship(self.villager_id)

        if record.conversations_today >= 3:
            return f"{other.name} seems tired of chatting with {self.name} for now."

        # Base points from conversation
        base = 2
        # Bonus if compatible personalities
        if _personalities_compatible(self.personality, other.personality):
            base += 2
        # Mood modifiers
        if self.mood in (Mood.JOYFUL, Mood.CONTENT):
            base += 1
        if other.mood == Mood.UPSET:
            base -= 1

        record.add_points(base)
        record.conversations_today += 1
        other_record.add_points(base)
        other_record.conversations_today += 1

        self.memories.append(MemoryEntry(day, f"Chatted with {other.name}", 1))
        other.memories.append(MemoryEntry(day, f"Chatted with {self.name}", 1))

        return self.get_dialogue()

    def give_gift(self, gift: Gift, from_id: str, day: int) -> tuple[str, int]:
        """Receive a gift; return (reaction_text, friendship_change)."""
        record = self.get_friendship(from_id)

        # Calculate affinity score
        affinity = PERSONALITY_GIFT_AFFINITY.get(self.personality, {}).get(
            gift.category, 0
        )
        points = affinity * gift.quality

        # Favourite gift bonus
        if self.favourite_gift and gift.name == self.favourite_gift.name:
            points += 10
            reaction = f"{self.name} gasps: \"This is my absolute favourite! Thank you!\""
        elif points >= 8:
            reaction = f"{self.name} beams: \"Oh, I love this! How thoughtful.\""
        elif points > 0:
            reaction = f"{self.name} smiles: \"That's nice, thank you.\""
        elif points == 0:
            reaction = f"{self.name} nods politely: \"Oh... thanks, I guess.\""
        else:
            reaction = f"{self.name} frowns: \"Um... this isn't really my thing.\""

        # Birthday bonus
        points = max(points, -5)  # floor to prevent too-negative gifts
        record.add_points(points)
        record.record_gift(gift.name)

        sentiment = 2 if points >= 8 else (1 if points > 0 else (-1 if points < 0 else 0))
        self.memories.append(
            MemoryEntry(day, f"Received {gift.name} from someone", sentiment)
        )

        if points > 0:
            self.adjust_mood(1)
        elif points < 0:
            self.adjust_mood(-1)

        return reaction, points

    def is_birthday(self, season: Season, day: int) -> bool:
        return self.birthday_season == season and self.birthday_day == day

    # -- Dialogue -----------------------------------------------------------

    def get_dialogue(self) -> str:
        key = (self.personality, self.mood)
        templates = DIALOGUE_TEMPLATES.get(key)
        if templates:
            return f"{self.name}: \"{random.choice(templates)}\""
        # Fallback generic lines
        fallback = {
            Mood.JOYFUL: "What a lovely day!",
            Mood.CONTENT: "Things are going well.",
            Mood.NEUTRAL: "Hello there.",
            Mood.LONELY: "It's been quiet lately...",
            Mood.UPSET: "I'd rather be alone right now.",
        }
        return f"{self.name}: \"{fallback.get(self.mood, 'Hello.')}\""

    # -- Memory -------------------------------------------------------------

    def recall_recent(self, count: int = 5) -> list[MemoryEntry]:
        return self.memories[-count:]

    def overall_sentiment(self) -> float:
        if not self.memories:
            return 0.0
        return sum(m.sentiment for m in self.memories) / len(self.memories)

    # -- Day lifecycle ------------------------------------------------------

    def start_new_day(self) -> None:
        self.roll_daily_mood()
        self.energy = 100
        for record in self.friendships.values():
            record.new_day()
        # Slight natural decay on friendships each day to encourage interaction
        for record in self.friendships.values():
            if record.points > 0 and record.conversations_today == 0:
                record.points = max(0, record.points - 1)

    def __repr__(self) -> str:
        return (
            f"Villager({self.name!r}, {self.personality.value}, "
            f"mood={self.mood.value}, loc={self.current_location})"
        )


# ---------------------------------------------------------------------------
# Village Manager
# ---------------------------------------------------------------------------

class Village:
    """Manages a collection of villagers, locations, and the day/time cycle."""

    def __init__(self, name: str) -> None:
        self.name = name
        self.villagers: dict[str, Villager] = {}
        self.locations: dict[str, Location] = {}
        self.day: int = 1
        self.season: Season = Season.SPRING
        self.time_of_day: TimeOfDay = TimeOfDay.DAWN
        self.event_log: list[str] = []

    # -- Registration -------------------------------------------------------

    def add_location(self, location: Location) -> None:
        self.locations[location.name] = location

    def add_villager(self, villager: Villager) -> None:
        self.villagers[villager.villager_id] = villager

    def get_villager(self, villager_id: str) -> Optional[Villager]:
        return self.villagers.get(villager_id)

    # -- Time ---------------------------------------------------------------

    _TIME_ORDER = [
        TimeOfDay.DAWN,
        TimeOfDay.MORNING,
        TimeOfDay.AFTERNOON,
        TimeOfDay.EVENING,
        TimeOfDay.NIGHT,
    ]

    _SEASON_ORDER = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]

    def advance_time(self) -> str:
        """Advance one time-of-day slot, rolling over to next day/season as needed."""
        idx = self._TIME_ORDER.index(self.time_of_day)
        if idx + 1 < len(self._TIME_ORDER):
            self.time_of_day = self._TIME_ORDER[idx + 1]
        else:
            # New day
            self.time_of_day = self._TIME_ORDER[0]
            self.day += 1
            if self.day > 28:
                self.day = 1
                s_idx = self._SEASON_ORDER.index(self.season)
                self.season = self._SEASON_ORDER[(s_idx + 1) % len(self._SEASON_ORDER)]
            self._on_new_day()

        # Move all villagers
        summaries = []
        for v in self.villagers.values():
            summaries.append(v.advance_to(self.season, self.time_of_day))

        self._trigger_random_encounters()
        header = f"--- Day {self.day}, {self.season.value.title()}, {self.time_of_day.value} ---"
        return "\n".join([header] + summaries)

    def _on_new_day(self) -> None:
        for v in self.villagers.values():
            v.start_new_day()
            if v.is_birthday(self.season, self.day):
                msg = f"Today is {v.name}'s birthday!"
                self.event_log.append(msg)

    def _trigger_random_encounters(self) -> None:
        """If two villagers are at the same location, they might chat."""
        by_location: dict[str, list[Villager]] = defaultdict(list)
        for v in self.villagers.values():
            by_location[v.current_location.name].append(v)

        for loc_name, group in by_location.items():
            if len(group) < 2:
                continue
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    if random.random() < 0.4:
                        line = group[i].talk_to(group[j], self.day)
                        self.event_log.append(
                            f"[Day {self.day}] {group[i].name} & {group[j].name} "
                            f"at {loc_name}: {line}"
                        )

    # -- Queries ------------------------------------------------------------

    def villagers_at(self, location: Location) -> list[Villager]:
        return [v for v in self.villagers.values() if v.current_location == location]

    def friendship_report(self) -> list[str]:
        """Return a human-readable friendship summary for every pair."""
        lines: list[str] = []
        seen: set[tuple[str, str]] = set()
        for v in self.villagers.values():
            for target_id, record in v.friendships.items():
                pair = tuple(sorted((v.villager_id, target_id)))
                if pair in seen:
                    continue
                seen.add(pair)
                target = self.villagers.get(target_id)
                target_name = target.name if target else target_id
                lines.append(
                    f"{v.name} <-> {target_name}: "
                    f"{record.points}pts ({record.tier.value})"
                )
        return lines

    def most_popular_villager(self) -> Optional[Villager]:
        """Return the villager with the highest total incoming friendship points."""
        scores: dict[str, int] = defaultdict(int)
        for v in self.villagers.values():
            for target_id, record in v.friendships.items():
                scores[target_id] += record.points
        if not scores:
            return None
        best_id = max(scores, key=lambda k: scores[k])
        return self.villagers.get(best_id)

    def loneliest_villager(self) -> Optional[Villager]:
        """Return the villager with the lowest total incoming friendship points."""
        scores: dict[str, int] = defaultdict(int)
        for v in self.villagers.values():
            for target_id, record in v.friendships.items():
                scores[target_id] += record.points
        # Include villagers with no friendships at all
        for vid in self.villagers:
            scores.setdefault(vid, 0)
        if not scores:
            return None
        worst_id = min(scores, key=lambda k: scores[k])
        return self.villagers.get(worst_id)

    # -- Bulk actions -------------------------------------------------------

    def simulate_day(self) -> list[str]:
        """Run through an entire day (all time slots) and return event log entries."""
        day_events: list[str] = []
        for _ in self._TIME_ORDER:
            summary = self.advance_time()
            day_events.append(summary)
        day_events.extend(self.event_log[-20:])
        return day_events

    def give_gift_to(
        self, from_id: str, to_id: str, gift: Gift
    ) -> Optional[str]:
        """Player or villager gives a gift to another villager."""
        target = self.villagers.get(to_id)
        if not target:
            return None
        reaction, pts = target.give_gift(gift, from_id, self.day)
        self.event_log.append(
            f"[Day {self.day}] Gift: {gift} -> {target.name}: {reaction} ({pts:+d}pts)"
        )
        return reaction

    def __repr__(self) -> str:
        return (
            f"Village({self.name!r}, {len(self.villagers)} villagers, "
            f"Day {self.day} {self.season.value})"
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_COMPATIBLE_PAIRS: set[frozenset[Personality]] = {
    frozenset({Personality.CHEERFUL, Personality.NURTURING}),
    frozenset({Personality.CHEERFUL, Personality.ADVENTUROUS}),
    frozenset({Personality.SCHOLARLY, Personality.SHY}),
    frozenset({Personality.ADVENTUROUS, Personality.GRUMPY}),  # odd-couple charm
    frozenset({Personality.NURTURING, Personality.SHY}),
    frozenset({Personality.SCHOLARLY, Personality.NURTURING}),
}


def _personalities_compatible(a: Personality, b: Personality) -> bool:
    return frozenset({a, b}) in _COMPATIBLE_PAIRS


# ---------------------------------------------------------------------------
# Factory helpers for quick village setup
# ---------------------------------------------------------------------------

def create_default_locations() -> list[Location]:
    return [
        Location("Rosewood Cottage", LocationType.HOME),
        Location("Maple House", LocationType.HOME),
        Location("Ivy Cabin", LocationType.HOME),
        Location("Stonehearth Lodge", LocationType.HOME),
        Location("The Dusty Tome", LocationType.LIBRARY),
        Location("Blossom Cafe", LocationType.CAFE),
        Location("Town Plaza", LocationType.PLAZA, capacity=30),
        Location("Sunrise Farm", LocationType.FARM),
        Location("Whispering Woods", LocationType.FOREST, capacity=20),
        Location("Tidal Beach", LocationType.BEACH, capacity=20),
        Location("Community Garden", LocationType.GARDEN, capacity=15),
        Location("Tinker's Workshop", LocationType.WORKSHOP),
    ]


def create_sample_village() -> Village:
    """Build a ready-to-play village with locations, villagers, and schedules."""
    village = Village("Willowbrook")
    locations = create_default_locations()
    loc_map = {loc.name: loc for loc in locations}
    for loc in locations:
        village.add_location(loc)

    # --- Villagers ---
    lily = Villager(
        "lily", "Lily", Personality.CHEERFUL,
        loc_map["Rosewood Cottage"],
        birthday_season=Season.SPRING, birthday_day=14,
        favourite_gift=Gift("Sunflower Bouquet", GiftCategory.FLOWER, 3),
    )
    lily.set_schedule(Season.SPRING, [
        ScheduleEntry(TimeOfDay.DAWN, loc_map["Community Garden"], "tending seedlings"),
        ScheduleEntry(TimeOfDay.MORNING, loc_map["Town Plaza"], "selling flowers"),
        ScheduleEntry(TimeOfDay.AFTERNOON, loc_map["Blossom Cafe"], "sipping herbal tea"),
        ScheduleEntry(TimeOfDay.EVENING, loc_map["Rosewood Cottage"], "arranging bouquets"),
        ScheduleEntry(TimeOfDay.NIGHT, loc_map["Rosewood Cottage"], "sleeping"),
    ])
    lily.set_schedule(Season.SUMMER, [
        ScheduleEntry(TimeOfDay.DAWN, loc_map["Tidal Beach"], "collecting shells"),
        ScheduleEntry(TimeOfDay.MORNING, loc_map["Community Garden"], "watering flowers"),
        ScheduleEntry(TimeOfDay.AFTERNOON, loc_map["Town Plaza"], "chatting with friends"),
        ScheduleEntry(TimeOfDay.EVENING, loc_map["Blossom Cafe"], "enjoying iced lemonade"),
        ScheduleEntry(TimeOfDay.NIGHT, loc_map["Rosewood Cottage"], "sleeping"),
    ])

    gruff = Villager(
        "gruff", "Gruff", Personality.GRUMPY,
        loc_map["Stonehearth Lodge"],
        birthday_season=Season.WINTER, birthday_day=3,
        favourite_gift=Gift("Masterwork Axe", GiftCategory.TOOL, 5),
    )
    gruff.set_schedule(Season.SPRING, [
        ScheduleEntry(TimeOfDay.DAWN, loc_map["Stonehearth Lodge"], "chopping firewood"),
        ScheduleEntry(TimeOfDay.MORNING, loc_map["Tinker's Workshop"], "repairing fences"),
        ScheduleEntry(TimeOfDay.AFTERNOON, loc_map["Whispering Woods"], "foraging mushrooms"),
        ScheduleEntry(TimeOfDay.EVENING, loc_map["Stonehearth Lodge"], "whittling by the fire"),
        ScheduleEntry(TimeOfDay.NIGHT, loc_map["Stonehearth Lodge"], "sleeping"),
    ])

    fern = Villager(
        "fern", "Fern", Personality.SHY,
        loc_map["Ivy Cabin"],
        birthday_season=Season.AUTUMN, birthday_day=21,
        favourite_gift=Gift("Pressed Wildflower Journal", GiftCategory.HANDMADE, 4),
    )
    fern.set_schedule(Season.SPRING, [
        ScheduleEntry(TimeOfDay.DAWN, loc_map["Ivy Cabin"], "sketching in a journal"),
        ScheduleEntry(TimeOfDay.MORNING, loc_map["Whispering Woods"], "collecting pressed leaves"),
        ScheduleEntry(TimeOfDay.AFTERNOON, loc_map["The Dusty Tome"], "reading fairy tales"),
        ScheduleEntry(TimeOfDay.EVENING, loc_map["Ivy Cabin"], "making bookmarks"),
        ScheduleEntry(TimeOfDay.NIGHT, loc_map["Ivy Cabin"], "sleeping"),
    ])

    ridge = Villager(
        "ridge", "Ridge", Personality.ADVENTUROUS,
        loc_map["Maple House"],
        birthday_season=Season.SUMMER, birthday_day=8,
        favourite_gift=Gift("Ancient Map Fragment", GiftCategory.FORAGED, 5),
    )
    ridge.set_schedule(Season.SPRING, [
        ScheduleEntry(TimeOfDay.DAWN, loc_map["Whispering Woods"], "jogging the forest trail"),
        ScheduleEntry(TimeOfDay.MORNING, loc_map["Tidal Beach"], "swimming in the cove"),
        ScheduleEntry(TimeOfDay.AFTERNOON, loc_map["Town Plaza"], "showing off found treasures"),
        ScheduleEntry(TimeOfDay.EVENING, loc_map["Blossom Cafe"], "telling adventure stories"),
        ScheduleEntry(TimeOfDay.NIGHT, loc_map["Maple House"], "sleeping"),
    ])

    sage = Villager(
        "sage", "Sage", Personality.SCHOLARLY,
        loc_map["Ivy Cabin"],
        birthday_season=Season.AUTUMN, birthday_day=10,
        favourite_gift=Gift("Rare First Edition", GiftCategory.BOOK, 5),
    )
    sage.set_schedule(Season.SPRING, [
        ScheduleEntry(TimeOfDay.DAWN, loc_map["The Dusty Tome"], "cataloguing new arrivals"),
        ScheduleEntry(TimeOfDay.MORNING, loc_map["The Dusty Tome"], "researching local history"),
        ScheduleEntry(TimeOfDay.AFTERNOON, loc_map["Community Garden"], "studying plant species"),
        ScheduleEntry(TimeOfDay.EVENING, loc_map["Blossom Cafe"], "writing field notes"),
        ScheduleEntry(TimeOfDay.NIGHT, loc_map["Ivy Cabin"], "sleeping"),
    ])

    hazel = Villager(
        "hazel", "Hazel", Personality.NURTURING,
        loc_map["Rosewood Cottage"],
        birthday_season=Season.SPRING, birthday_day=28,
        favourite_gift=Gift("Heirloom Seed Packet", GiftCategory.FORAGED, 3),
    )
    hazel.set_schedule(Season.SPRING, [
        ScheduleEntry(TimeOfDay.DAWN, loc_map["Sunrise Farm"], "feeding the chickens"),
        ScheduleEntry(TimeOfDay.MORNING, loc_map["Community Garden"], "planting herbs"),
        ScheduleEntry(TimeOfDay.AFTERNOON, loc_map["Blossom Cafe"], "baking pies for neighbours"),
        ScheduleEntry(TimeOfDay.EVENING, loc_map["Town Plaza"], "handing out warm bread"),
        ScheduleEntry(TimeOfDay.NIGHT, loc_map["Rosewood Cottage"], "sleeping"),
    ])

    for v in [lily, gruff, fern, ridge, sage, hazel]:
        village.add_villager(v)

    return village
