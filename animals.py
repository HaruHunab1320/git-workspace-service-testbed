"""
animals.py — Cozy Village Simulator: Pet & Animal Companion System

Adopt a pet, build a bond, and explore the village together.
Each animal has its own personality, favourite weather, preferred
villagers, and foraging instincts.  They react to the seasons,
find hidden treasures, and make the village feel truly alive.
"""

from __future__ import annotations

import enum
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


class Species(enum.Enum):
    CAT = "cat"
    DOG = "dog"
    RABBIT = "rabbit"
    OWL = "owl"
    FOX = "fox"
    HEDGEHOG = "hedgehog"


class PetPersonality(enum.Enum):
    PLAYFUL = "playful"
    LAZY = "lazy"
    CURIOUS = "curious"
    LOYAL = "loyal"
    MISCHIEVOUS = "mischievous"
    GENTLE = "gentle"


class BondTier(enum.Enum):
    STRANGER = "stranger"         # 0-14
    FAMILIAR = "familiar"         # 15-39
    COMPANION = "companion"       # 40-79
    DEVOTED = "devoted"           # 80-119
    SOULBOUND = "soulbound"       # 120+

    @classmethod
    def from_points(cls, points: int) -> BondTier:
        if points >= 120:
            return cls.SOULBOUND
        if points >= 80:
            return cls.DEVOTED
        if points >= 40:
            return cls.COMPANION
        if points >= 15:
            return cls.FAMILIAR
        return cls.STRANGER


class PetMood(enum.Enum):
    ECSTATIC = "ecstatic"
    HAPPY = "happy"
    CONTENT = "content"
    RESTLESS = "restless"
    LONELY = "lonely"


class PetActivity(enum.Enum):
    FOLLOWING = "following owner"
    EXPLORING = "exploring"
    SLEEPING = "sleeping"
    PLAYING = "playing"
    FORAGING = "foraging"
    GREETING = "greeting a villager"
    SHELTERING = "sheltering from weather"


# ---------------------------------------------------------------------------
# Species data tables
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SpeciesProfile:
    """Static data about a pet species."""
    species: Species
    description: str
    favourite_weather: str          # simplified weather name
    disliked_weather: str
    favourite_season: Season
    sleep_hours: int                # how many time-slots per day they sleep
    forage_categories: tuple[str, ...]  # types of items they find
    base_forage_chance: float       # 0.0-1.0 chance per forage action


SPECIES_PROFILES: dict[Species, SpeciesProfile] = {
    Species.CAT: SpeciesProfile(
        Species.CAT,
        "Independent and graceful, with a talent for finding warm spots.",
        "sunny", "rainy",
        Season.SUMMER, sleep_hours=3,
        forage_categories=("fish", "gemstone", "trinket"),
        base_forage_chance=0.35,
    ),
    Species.DOG: SpeciesProfile(
        Species.DOG,
        "Loyal and friendly, always happy to see you.",
        "sunny", "stormy",
        Season.AUTUMN, sleep_hours=2,
        forage_categories=("stick", "bone", "foraged"),
        base_forage_chance=0.45,
    ),
    Species.RABBIT: SpeciesProfile(
        Species.RABBIT,
        "Quick and curious, with the softest ears in the village.",
        "sunny", "stormy",
        Season.SPRING, sleep_hours=2,
        forage_categories=("herb", "flower", "vegetable"),
        base_forage_chance=0.40,
    ),
    Species.OWL: SpeciesProfile(
        Species.OWL,
        "Wise and mysterious, most active under moonlight.",
        "foggy", "stormy",
        Season.AUTUMN, sleep_hours=3,
        forage_categories=("rare_book", "feather", "ancient_coin"),
        base_forage_chance=0.25,
    ),
    Species.FOX: SpeciesProfile(
        Species.FOX,
        "Clever and mischievous, with a nose for hidden things.",
        "foggy", "frost",
        Season.AUTUMN, sleep_hours=2,
        forage_categories=("gemstone", "mushroom", "rare_artifact"),
        base_forage_chance=0.30,
    ),
    Species.HEDGEHOG: SpeciesProfile(
        Species.HEDGEHOG,
        "Tiny and determined, loves pottering around the garden.",
        "rainy", "frost",
        Season.SPRING, sleep_hours=3,
        forage_categories=("mushroom", "herb", "berry"),
        base_forage_chance=0.40,
    ),
}


# ---------------------------------------------------------------------------
# Personality mood weights
# ---------------------------------------------------------------------------

_PERSONALITY_MOOD: dict[PetPersonality, dict[PetMood, float]] = {
    PetPersonality.PLAYFUL:     {PetMood.ECSTATIC: 0.30, PetMood.HAPPY: 0.35, PetMood.CONTENT: 0.20, PetMood.RESTLESS: 0.10, PetMood.LONELY: 0.05},
    PetPersonality.LAZY:        {PetMood.ECSTATIC: 0.10, PetMood.HAPPY: 0.20, PetMood.CONTENT: 0.45, PetMood.RESTLESS: 0.05, PetMood.LONELY: 0.20},
    PetPersonality.CURIOUS:     {PetMood.ECSTATIC: 0.25, PetMood.HAPPY: 0.30, PetMood.CONTENT: 0.20, PetMood.RESTLESS: 0.20, PetMood.LONELY: 0.05},
    PetPersonality.LOYAL:       {PetMood.ECSTATIC: 0.20, PetMood.HAPPY: 0.35, PetMood.CONTENT: 0.25, PetMood.RESTLESS: 0.05, PetMood.LONELY: 0.15},
    PetPersonality.MISCHIEVOUS: {PetMood.ECSTATIC: 0.25, PetMood.HAPPY: 0.25, PetMood.CONTENT: 0.15, PetMood.RESTLESS: 0.30, PetMood.LONELY: 0.05},
    PetPersonality.GENTLE:      {PetMood.ECSTATIC: 0.15, PetMood.HAPPY: 0.30, PetMood.CONTENT: 0.35, PetMood.RESTLESS: 0.05, PetMood.LONELY: 0.15},
}


# ---------------------------------------------------------------------------
# Found item table
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class FoundItem:
    """An item discovered by a pet while foraging."""
    name: str
    category: str
    rarity: str       # "common", "uncommon", "rare"
    description: str

    @property
    def value(self) -> float:
        return {"common": 2.0, "uncommon": 5.0, "rare": 12.0}.get(self.rarity, 1.0)


_FORAGE_TABLE: dict[str, list[FoundItem]] = {
    "fish": [
        FoundItem("Small Trout", "fish", "common", "A wriggling little fish."),
        FoundItem("Silver Perch", "fish", "uncommon", "Scales gleam like tiny mirrors."),
        FoundItem("Golden Koi", "fish", "rare", "A legendary pond fish of good fortune."),
    ],
    "gemstone": [
        FoundItem("Quartz Pebble", "gemstone", "common", "A smooth, cloudy stone."),
        FoundItem("Amethyst Shard", "gemstone", "uncommon", "Purple crystal fragment."),
        FoundItem("Star Sapphire", "gemstone", "rare", "A deep blue gem with a star inside."),
    ],
    "trinket": [
        FoundItem("Old Button", "trinket", "common", "Brass, slightly tarnished."),
        FoundItem("Glass Marble", "trinket", "uncommon", "Swirled with green and gold."),
        FoundItem("Tiny Music Box", "trinket", "rare", "Plays a soft, mysterious tune."),
    ],
    "stick": [
        FoundItem("Ordinary Stick", "stick", "common", "The best stick in the world."),
        FoundItem("Gnarled Branch", "stick", "uncommon", "Twisted into an interesting shape."),
        FoundItem("Petrified Twig", "stick", "rare", "Ancient wood turned to stone."),
    ],
    "bone": [
        FoundItem("Old Bone", "bone", "common", "Probably from a rabbit. Probably."),
        FoundItem("Carved Bone", "bone", "uncommon", "Etched with tiny rune-like marks."),
        FoundItem("Dragon Tooth", "bone", "rare", "Far too large. Best not think about it."),
    ],
    "foraged": [
        FoundItem("Acorn", "foraged", "common", "A shiny brown acorn."),
        FoundItem("Four-Leaf Clover", "foraged", "uncommon", "Lucky!"),
        FoundItem("Ancient Seed", "foraged", "rare", "It hums faintly when you hold it."),
    ],
    "herb": [
        FoundItem("Wild Mint", "herb", "common", "Fresh and fragrant."),
        FoundItem("Healing Herb", "herb", "uncommon", "Leaves shimmer faintly."),
        FoundItem("Moonpetal Sprig", "herb", "rare", "Glows softly after dark."),
    ],
    "flower": [
        FoundItem("Daisy", "flower", "common", "Simple and cheerful."),
        FoundItem("Wild Orchid", "flower", "uncommon", "Delicate purple petals."),
        FoundItem("Enchanted Rose", "flower", "rare", "Never wilts, always fragrant."),
    ],
    "vegetable": [
        FoundItem("Wild Carrot", "vegetable", "common", "Small but crunchy."),
        FoundItem("Golden Turnip", "vegetable", "uncommon", "Unusually lustrous."),
        FoundItem("Fairy Radish", "vegetable", "rare", "Sparkles in sunlight."),
    ],
    "rare_book": [
        FoundItem("Torn Page", "rare_book", "common", "Fragment of an old text."),
        FoundItem("Leather Journal", "rare_book", "uncommon", "Filled with observations."),
        FoundItem("Enchanted Tome", "rare_book", "rare", "The pages turn themselves."),
    ],
    "feather": [
        FoundItem("Grey Feather", "feather", "common", "Soft and downy."),
        FoundItem("Owl Plume", "feather", "uncommon", "Striped brown and cream."),
        FoundItem("Phoenix Feather", "feather", "rare", "Warm to the touch."),
    ],
    "ancient_coin": [
        FoundItem("Copper Penny", "ancient_coin", "common", "Worn and green with age."),
        FoundItem("Silver Ducat", "ancient_coin", "uncommon", "An old trading coin."),
        FoundItem("Golden Relic Coin", "ancient_coin", "rare", "Stamped with a forgotten king."),
    ],
    "mushroom": [
        FoundItem("Button Mushroom", "mushroom", "common", "Cute and round."),
        FoundItem("Chanterelle", "mushroom", "uncommon", "Golden and aromatic."),
        FoundItem("Starlight Truffle", "mushroom", "rare", "Speckled with glowing dots."),
    ],
    "rare_artifact": [
        FoundItem("Rusted Key", "rare_artifact", "common", "Opens... something."),
        FoundItem("Crystal Compass", "rare_artifact", "uncommon", "Points toward magic."),
        FoundItem("Ancient Amulet", "rare_artifact", "rare", "Warm and humming with old power."),
    ],
    "berry": [
        FoundItem("Wild Raspberry", "berry", "common", "Tart and sweet."),
        FoundItem("Elderberry Cluster", "berry", "uncommon", "Deep purple, almost black."),
        FoundItem("Shimmer Berry", "berry", "rare", "Translucent and faintly glowing."),
    ],
}


def _roll_forage_item(category: str) -> Optional[FoundItem]:
    """Pick a random item from a forage category, weighted by rarity."""
    items = _FORAGE_TABLE.get(category, [])
    if not items:
        return None
    weights = {"common": 0.65, "uncommon": 0.28, "rare": 0.07}
    w = [weights.get(i.rarity, 0.5) for i in items]
    return random.choices(items, weights=w, k=1)[0]


# ---------------------------------------------------------------------------
# Pet
# ---------------------------------------------------------------------------

class Pet:
    """A single animal companion in the village."""

    def __init__(
        self,
        name: str,
        species: Species,
        personality: PetPersonality,
        *,
        owner: str = "Player",
    ) -> None:
        self.name = name
        self.species = species
        self.personality = personality
        self.owner = owner
        self.profile = SPECIES_PROFILES[species]

        self.bond_points: int = 0
        self.mood: PetMood = PetMood.CONTENT
        self.energy: int = 100
        self.activity: PetActivity = PetActivity.SLEEPING
        self.found_items: list[FoundItem] = []
        self.days_owned: int = 0
        self.times_pet_today: int = 0
        self.fed_today: bool = False
        self.favourite_villager: Optional[str] = None
        self._interactions_today: int = 0

    @property
    def bond_tier(self) -> BondTier:
        return BondTier.from_points(self.bond_points)

    # -- Daily actions --------------------------------------------------------

    def pet(self) -> str:
        """Give the pet some affection."""
        if self.times_pet_today >= 3:
            return f"{self.name} purrs contentedly but is all petted out for today."
        self.times_pet_today += 1
        base = 2
        if self.personality is PetPersonality.GENTLE:
            base += 1
        if self.mood in (PetMood.ECSTATIC, PetMood.HAPPY):
            base += 1
        self.bond_points += base
        self.mood = _shift_mood(self.mood, 1)
        return random.choice(_PET_REACTIONS[self.species])

    def feed(self, food_name: str = "kibble") -> str:
        """Feed the pet. Once per day."""
        if self.fed_today:
            return f"{self.name} sniffs the {food_name} but isn't hungry."
        self.fed_today = True
        self.energy = min(100, self.energy + 30)
        self.bond_points += 3
        self.mood = _shift_mood(self.mood, 1)
        return f"{self.name} munches the {food_name} happily!"

    def play(self) -> str:
        """Play with the pet. Costs energy but builds the bond."""
        if self.energy < 15:
            return f"{self.name} is too tired to play right now."
        self.energy = max(0, self.energy - 15)
        base = 3
        if self.personality is PetPersonality.PLAYFUL:
            base += 2
        elif self.personality is PetPersonality.LAZY:
            base -= 1
        self.bond_points += max(1, base)
        self._interactions_today += 1
        self.mood = _shift_mood(self.mood, 1)
        return random.choice(_PLAY_DESCRIPTIONS[self.species])

    # -- Foraging -------------------------------------------------------------

    def forage(self, season: Season) -> Optional[FoundItem]:
        """Attempt to find an item while exploring."""
        if self.energy < 10:
            return None
        self.energy = max(0, self.energy - 10)
        self.activity = PetActivity.FORAGING

        chance = self.profile.base_forage_chance
        # Bond level boosts foraging luck
        if self.bond_tier in (BondTier.DEVOTED, BondTier.SOULBOUND):
            chance += 0.10
        # Favourite season bonus
        if season is self.profile.favourite_season:
            chance += 0.05
        # Curious pets forage better
        if self.personality is PetPersonality.CURIOUS:
            chance += 0.08

        if random.random() > chance:
            return None

        category = random.choice(self.profile.forage_categories)
        item = _roll_forage_item(category)
        if item:
            self.found_items.append(item)
            self.bond_points += 1
        return item

    # -- Weather reactions ----------------------------------------------------

    def react_to_weather(self, weather: str) -> str:
        """Return a description of how the pet reacts to current weather."""
        if weather == self.profile.disliked_weather:
            self.mood = _shift_mood(self.mood, -1)
            self.activity = PetActivity.SHELTERING
            return random.choice(_WEATHER_DISLIKE[self.species])
        if weather == self.profile.favourite_weather:
            self.mood = _shift_mood(self.mood, 1)
            self.activity = PetActivity.PLAYING
            return random.choice(_WEATHER_LOVE[self.species])
        return f"{self.name} doesn't seem bothered by the {weather}."

    # -- Villager interactions ------------------------------------------------

    def greet_villager(self, villager_name: str) -> tuple[str, int]:
        """Pet interacts with a villager. Returns (description, friendship_bonus).

        The friendship bonus is applied to the villager's friendship with
        the pet's owner.
        """
        self.activity = PetActivity.GREETING
        base_bonus = 1
        if self.species is Species.DOG:
            base_bonus = 3  # dogs are friendship machines
        elif self.species is Species.CAT:
            base_bonus = 1 if random.random() > 0.3 else 0  # cats are picky
        if villager_name == self.favourite_villager:
            base_bonus += 2

        desc = random.choice(_VILLAGER_GREET[self.species]).format(
            pet=self.name, villager=villager_name,
        )
        self.bond_points += 1
        return desc, base_bonus

    # -- Day lifecycle --------------------------------------------------------

    def start_new_day(self) -> None:
        self.days_owned += 1
        self.times_pet_today = 0
        self.fed_today = False
        self._interactions_today = 0
        self.energy = min(100, self.energy + 40)
        self._roll_mood()
        # Loneliness if no interactions yesterday
        if self._interactions_today == 0 and self.days_owned > 1:
            self.bond_points = max(0, self.bond_points - 1)

    def _roll_mood(self) -> None:
        weights = _PERSONALITY_MOOD[self.personality]
        moods = list(weights.keys())
        probs = list(weights.values())
        self.mood = random.choices(moods, weights=probs, k=1)[0]

    # -- Display --------------------------------------------------------------

    def status(self) -> str:
        tier = self.bond_tier.value
        return (
            f"{self.name} the {self.species.value} "
            f"({self.personality.value}) — "
            f"Mood: {self.mood.value}  |  "
            f"Bond: {self.bond_points}pts ({tier})  |  "
            f"Energy: {self.energy}/100  |  "
            f"Items found: {len(self.found_items)}"
        )

    def __repr__(self) -> str:
        return (
            f"Pet({self.name!r}, {self.species.value}, "
            f"bond={self.bond_points}, mood={self.mood.value})"
        )


# ---------------------------------------------------------------------------
# Mood shifting helper
# ---------------------------------------------------------------------------

_MOOD_ORDER = [PetMood.LONELY, PetMood.RESTLESS, PetMood.CONTENT, PetMood.HAPPY, PetMood.ECSTATIC]


def _shift_mood(current: PetMood, delta: int) -> PetMood:
    idx = _MOOD_ORDER.index(current)
    new_idx = max(0, min(len(_MOOD_ORDER) - 1, idx + delta))
    return _MOOD_ORDER[new_idx]


# ---------------------------------------------------------------------------
# Narrative templates
# ---------------------------------------------------------------------------

_PET_REACTIONS: dict[Species, list[str]] = {
    Species.CAT: [
        "{name} purrs and bumps their head against your hand.",
        "{name} rolls over, showing a fluffy belly. (It's a trap.)",
        "{name} slow-blinks at you — the highest cat compliment.",
    ],
    Species.DOG: [
        "{name} wags their tail so hard their whole body wiggles!",
        "{name} licks your hand and gazes up adoringly.",
        "{name} barks once, tail going a mile a minute.",
    ],
    Species.RABBIT: [
        "{name} does a little binky hop of happiness!",
        "{name} nuzzles into your palm, nose twitching.",
        "{name} flops onto their side — total relaxation.",
    ],
    Species.OWL: [
        "{name} ruffles their feathers and hoots softly.",
        "{name} closes their eyes and leans into the scritches.",
        "{name} tilts their head 180 degrees, looking pleased.",
    ],
    Species.FOX: [
        "{name} makes that funny chuckling sound foxes do.",
        "{name} rolls in a patch of sunlight, belly up.",
        "{name} nips your sleeve playfully and darts away.",
    ],
    Species.HEDGEHOG: [
        "{name} uncurls and sniffs your fingers trustingly.",
        "{name}'s little nose wiggles with delight.",
        "{name} trundles in a happy circle around your feet.",
    ],
}

# Format the name into the templates
for _species, _templates in _PET_REACTIONS.items():
    _PET_REACTIONS[_species] = [t.replace("{name}", "{self.name}") for t in _templates]
# Revert — we'll format at call time with a different approach
_PET_REACTIONS = {
    Species.CAT: [
        "purrs and bumps their head against your hand.",
        "rolls over, showing a fluffy belly. (It's a trap.)",
        "slow-blinks at you — the highest cat compliment.",
    ],
    Species.DOG: [
        "wags their tail so hard their whole body wiggles!",
        "licks your hand and gazes up adoringly.",
        "barks once, tail going a mile a minute.",
    ],
    Species.RABBIT: [
        "does a little binky hop of happiness!",
        "nuzzles into your palm, nose twitching.",
        "flops onto their side — total relaxation.",
    ],
    Species.OWL: [
        "ruffles their feathers and hoots softly.",
        "closes their eyes and leans into the scritches.",
        "tilts their head, looking pleased.",
    ],
    Species.FOX: [
        "makes that funny chuckling sound foxes do.",
        "rolls in a patch of sunlight, belly up.",
        "nips your sleeve playfully and darts away.",
    ],
    Species.HEDGEHOG: [
        "uncurls and sniffs your fingers trustingly.",
        "wiggles their little nose with delight.",
        "trundles in a happy circle around your feet.",
    ],
}

_PLAY_DESCRIPTIONS: dict[Species, list[str]] = {
    Species.CAT: [
        "chases a dangling piece of string with laser focus.",
        "pounces on a crinkly leaf, victorious.",
        "bats a ball of yarn across the room.",
    ],
    Species.DOG: [
        "fetches a stick and brings it back, dripping with pride.",
        "zooms around the garden in circles — pure joy!",
        "tugs on a rope toy, tail wagging furiously.",
    ],
    Species.RABBIT: [
        "binkies through a little obstacle course!",
        "hops through a tunnel of cardboard boxes.",
        "kicks their back legs up in a joyful sprint.",
    ],
    Species.OWL: [
        "swoops between perches with silent grace.",
        "catches a tossed treat mid-air — impressive!",
        "plays hide-and-seek, blending perfectly with the bookshelf.",
    ],
    Species.FOX: [
        "pounces on a hidden squeaky toy with glee.",
        "plays keep-away, always just out of reach.",
        "digs a pretend burrow in a pile of blankets.",
    ],
    Species.HEDGEHOG: [
        "explores a maze made of books and cushions.",
        "pushes a tiny ball around with their nose.",
        "splashes happily in a shallow dish of water.",
    ],
}

_WEATHER_LOVE: dict[Species, list[str]] = {
    Species.CAT: [
        "stretches out in a perfect sunbeam, utterly blissful.",
        "finds the warmest spot and claims it immediately.",
    ],
    Species.DOG: [
        "bounds through the sunshine, tongue lolling happily.",
        "rolls in the warm grass, legs in the air.",
    ],
    Species.RABBIT: [
        "hops around the sunlit garden, ears perked up.",
        "stretches out flat in a warm sunny patch.",
    ],
    Species.OWL: [
        "perches in the misty tree, eyes gleaming with interest.",
        "glides silently through the fog, perfectly at home.",
    ],
    Species.FOX: [
        "disappears into the mist and reappears with something shiny.",
        "pads silently through the fog, looking mysterious.",
    ],
    Species.HEDGEHOG: [
        "trundles happily through puddles after the rain.",
        "snuffles through the damp garden, finding treasures.",
    ],
}

_WEATHER_DISLIKE: dict[Species, list[str]] = {
    Species.CAT: [
        "gives the rain a deeply offended look and retreats indoors.",
        "sits in the window, glaring at every raindrop.",
    ],
    Species.DOG: [
        "whimpers at the thunder and presses close to you.",
        "hides under the table until the storm passes.",
    ],
    Species.RABBIT: [
        "thumps their back leg nervously at the loud thunder.",
        "dives into their burrow and won't come out.",
    ],
    Species.OWL: [
        "fluffs up grumpily and hunkers down on a high shelf.",
        "tucks their head under a wing, very put out.",
    ],
    Species.FOX: [
        "shivers and curls up by the fire, looking small.",
        "tucks their nose under their tail and waits it out.",
    ],
    Species.HEDGEHOG: [
        "rolls into a tight ball and refuses to uncurl.",
        "burrows under a blanket, only a nose visible.",
    ],
}

_VILLAGER_GREET: dict[Species, list[str]] = {
    Species.CAT: [
        "{pet} winds between {villager}'s ankles, purring.",
        "{pet} deigns to sniff {villager}'s offered hand.",
    ],
    Species.DOG: [
        "{pet} bounds up to {villager}, tail a blur of excitement!",
        "{pet} drops a stick at {villager}'s feet, hopeful.",
    ],
    Species.RABBIT: [
        "{pet} hops up to {villager} and sniffs their shoes curiously.",
        "{pet} lets {villager} gently stroke their ears.",
    ],
    Species.OWL: [
        "{pet} swoops down and lands on {villager}'s shoulder!",
        "{pet} hoots a dignified greeting at {villager}.",
    ],
    Species.FOX: [
        "{pet} approaches {villager} cautiously, then steals a snack.",
        "{pet} yips at {villager} and does a little dance.",
    ],
    Species.HEDGEHOG: [
        "{pet} trundles up to {villager}'s feet, snuffling.",
        "{pet} lets {villager} carefully pick them up.",
    ],
}


# ---------------------------------------------------------------------------
# Pet manager — oversees all pets in the village
# ---------------------------------------------------------------------------

class PetManager:
    """Manages all adopted pets and coordinates their daily activities."""

    def __init__(self) -> None:
        self.pets: dict[str, Pet] = {}
        self.adoption_log: list[str] = []
        self.day: int = 0

    def adopt(
        self,
        name: str,
        species: Species,
        personality: PetPersonality,
        owner: str = "Player",
    ) -> Pet:
        """Adopt a new pet and add it to the village."""
        if name in self.pets:
            raise ValueError(f"A pet named {name} already exists!")
        pet = Pet(name, species, personality, owner=owner)
        self.pets[name] = pet
        self.adoption_log.append(
            f"Day {self.day}: {owner} adopted {name} the {species.value}!"
        )
        return pet

    def get_pet(self, name: str) -> Optional[Pet]:
        return self.pets.get(name)

    def advance_day(
        self,
        season: Season,
        weather: str = "sunny",
        villager_names: Optional[list[str]] = None,
    ) -> list[str]:
        """Advance one day for all pets. Returns narrative events."""
        self.day += 1
        events: list[str] = []

        for pet in self.pets.values():
            pet.start_new_day()

            # Weather reaction
            reaction = pet.react_to_weather(weather)
            if weather in (pet.profile.favourite_weather, pet.profile.disliked_weather):
                events.append(f"{pet.name} {reaction}")

            # Foraging attempt (if not sheltering)
            if pet.activity is not PetActivity.SHELTERING:
                item = pet.forage(season)
                if item:
                    events.append(
                        f"{pet.name} found a {item.name}! ({item.rarity}) "
                        f"— {item.description}"
                    )

            # Villager greeting (random chance)
            if villager_names and random.random() < 0.3:
                villager = random.choice(villager_names)
                desc, bonus = pet.greet_villager(villager)
                events.append(desc)

        return events

    def all_found_items(self) -> list[tuple[str, FoundItem]]:
        """Return all items found by all pets as (pet_name, item) pairs."""
        result = []
        for pet in self.pets.values():
            for item in pet.found_items:
                result.append((pet.name, item))
        return result

    def status_report(self) -> str:
        """Return a summary of all pets."""
        if not self.pets:
            return "No pets adopted yet. Visit the village to find a companion!"
        lines = ["=== Pet Companions ===", ""]
        for pet in self.pets.values():
            lines.append(f"  {pet.status()}")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Pre-built adoptable pets for the village
# ---------------------------------------------------------------------------

def create_adoptable_pets() -> list[dict]:
    """Return a catalogue of pets available for adoption."""
    return [
        {"name": "Whiskers", "species": Species.CAT, "personality": PetPersonality.LAZY,
         "bio": "Found napping on the library windowsill. Prefers fish and warm laps."},
        {"name": "Biscuit", "species": Species.DOG, "personality": PetPersonality.LOYAL,
         "bio": "A scruffy golden pup who was waiting by the village gate."},
        {"name": "Clover", "species": Species.RABBIT, "personality": PetPersonality.CURIOUS,
         "bio": "Appeared in the garden one spring morning. Loves dandelions."},
        {"name": "Archimedes", "species": Species.OWL, "personality": PetPersonality.GENTLE,
         "bio": "Perches in the old oak by the library. Remarkably well-read."},
        {"name": "Russet", "species": Species.FOX, "personality": PetPersonality.MISCHIEVOUS,
         "bio": "Steals socks from clotheslines. Impossible not to love."},
        {"name": "Bramble", "species": Species.HEDGEHOG, "personality": PetPersonality.GENTLE,
         "bio": "Found curled up in the herb garden. Loves chamomile."},
    ]


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

def _demo() -> None:
    manager = PetManager()
    biscuit = manager.adopt("Biscuit", Species.DOG, PetPersonality.LOYAL)
    whiskers = manager.adopt("Whiskers", Species.CAT, PetPersonality.LAZY)

    print(biscuit.pet())
    print(biscuit.feed("bone"))
    print(biscuit.play())
    print()

    villagers = ["Lily", "Gruff", "Fern", "Ridge", "Sage", "Hazel"]
    for day in range(7):
        weather = random.choice(["sunny", "rainy", "foggy", "stormy"])
        events = manager.advance_day(Season.SPRING, weather, villagers)
        for e in events:
            print(f"  Day {day + 1}: {e}")

    print()
    print(manager.status_report())

    print("\nItems found:")
    for pet_name, item in manager.all_found_items():
        print(f"  {pet_name} found: {item.name} ({item.rarity}) — {item.description}")


if __name__ == "__main__":
    _demo()
