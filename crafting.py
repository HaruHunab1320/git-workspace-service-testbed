"""
Cozy Village Simulator — Crafting Module
=========================================

A crafting system for a cozy village simulator that lets users gather
resources, learn recipes, and craft furniture and tools for their village.

Features:
  - Tiered material system (common → rare → legendary)
  - Recipe discovery and unlocking through crafting experience
  - Quality system influenced by crafter skill and tool bonuses
  - Workstation requirements (workbench, forge, loom, kiln)
  - Seasonal material availability
  - Furniture placement comfort scores for village happiness
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Season(Enum):
    SPRING = auto()
    SUMMER = auto()
    AUTUMN = auto()
    WINTER = auto()


class MaterialRarity(Enum):
    COMMON = 1
    UNCOMMON = 2
    RARE = 3
    LEGENDARY = 4

    @property
    def quality_bonus(self) -> float:
        return {1: 0.0, 2: 0.05, 3: 0.12, 4: 0.25}[self.value]


class ItemCategory(Enum):
    MATERIAL = auto()
    TOOL = auto()
    FURNITURE = auto()


class Workstation(Enum):
    NONE = "hand-crafted"
    WORKBENCH = "workbench"
    FORGE = "forge"
    LOOM = "loom"
    KILN = "kiln"
    ENCHANTING_TABLE = "enchanting table"


class QualityTier(Enum):
    ROUGH = "Rough"
    STANDARD = "Standard"
    FINE = "Fine"
    MASTERWORK = "Masterwork"
    LEGENDARY = "Legendary"

    @property
    def comfort_multiplier(self) -> float:
        return {
            "Rough": 0.6,
            "Standard": 1.0,
            "Fine": 1.3,
            "Masterwork": 1.6,
            "Legendary": 2.0,
        }[self.value]


# ---------------------------------------------------------------------------
# Core data classes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Material:
    """A gatherable resource used in crafting."""

    name: str
    rarity: MaterialRarity = MaterialRarity.COMMON
    seasons: tuple[Season, ...] = (
        Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER,
    )
    description: str = ""

    def available_in(self, season: Season) -> bool:
        return season in self.seasons


@dataclass(frozen=True)
class RecipeIngredient:
    """One ingredient line inside a recipe."""

    material: Material
    quantity: int = 1


@dataclass(frozen=True)
class Recipe:
    """A blueprint for crafting an item."""

    name: str
    category: ItemCategory
    ingredients: tuple[RecipeIngredient, ...]
    workstation: Workstation = Workstation.NONE
    base_craft_time: float = 1.0          # in-game hours
    skill_requirement: int = 0            # minimum crafter level
    comfort_score: int = 0                # only meaningful for furniture
    description: str = ""
    unlocked_by_default: bool = True

    @property
    def total_material_count(self) -> int:
        return sum(ing.quantity for ing in self.ingredients)


@dataclass
class CraftedItem:
    """An item produced by crafting."""

    recipe: Recipe
    quality: QualityTier
    crafter_name: str
    comfort: float = 0.0

    def __post_init__(self) -> None:
        if self.recipe.category == ItemCategory.FURNITURE:
            self.comfort = self.recipe.comfort_score * self.quality.comfort_multiplier

    @property
    def display_name(self) -> str:
        return f"{self.quality.value} {self.recipe.name}"

    @property
    def tool_speed_bonus(self) -> float:
        """Tools crafted at higher quality let the crafter work faster."""
        if self.recipe.category != ItemCategory.TOOL:
            return 0.0
        return {
            QualityTier.ROUGH: -0.10,
            QualityTier.STANDARD: 0.0,
            QualityTier.FINE: 0.10,
            QualityTier.MASTERWORK: 0.20,
            QualityTier.LEGENDARY: 0.35,
        }[self.quality]


@dataclass
class Inventory:
    """Simple quantity-tracked inventory of materials and crafted items."""

    _materials: dict[str, int] = field(default_factory=dict)
    _items: list[CraftedItem] = field(default_factory=list)

    # -- materials --

    def add_material(self, material: Material, quantity: int = 1) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be positive.")
        self._materials[material.name] = (
            self._materials.get(material.name, 0) + quantity
        )

    def remove_material(self, material: Material, quantity: int = 1) -> None:
        current = self._materials.get(material.name, 0)
        if current < quantity:
            raise InsufficientMaterialError(material.name, quantity, current)
        self._materials[material.name] = current - quantity
        if self._materials[material.name] == 0:
            del self._materials[material.name]

    def material_count(self, material: Material) -> int:
        return self._materials.get(material.name, 0)

    def has_materials_for(self, recipe: Recipe) -> bool:
        return all(
            self.material_count(ing.material) >= ing.quantity
            for ing in recipe.ingredients
        )

    @property
    def material_summary(self) -> dict[str, int]:
        return dict(self._materials)

    # -- crafted items --

    def add_item(self, item: CraftedItem) -> None:
        self._items.append(item)

    @property
    def items(self) -> list[CraftedItem]:
        return list(self._items)

    @property
    def total_comfort(self) -> float:
        return sum(item.comfort for item in self._items)


# ---------------------------------------------------------------------------
# Crafter (the player / villager doing the crafting)
# ---------------------------------------------------------------------------

@dataclass
class Crafter:
    """A villager who can gather materials and craft items."""

    name: str
    skill_level: int = 1
    experience: int = 0
    inventory: Inventory = field(default_factory=Inventory)
    known_recipes: set[str] = field(default_factory=set)
    equipped_tool: Optional[CraftedItem] = None

    _XP_PER_LEVEL: int = field(default=100, init=False, repr=False)
    _MAX_LEVEL: int = field(default=50, init=False, repr=False)

    # -- experience & leveling --

    def gain_experience(self, amount: int) -> list[str]:
        """Award XP and return a list of messages (e.g. level-ups)."""
        messages: list[str] = []
        self.experience += amount
        while (
            self.experience >= self._xp_for_next_level
            and self.skill_level < self._MAX_LEVEL
        ):
            self.experience -= self._xp_for_next_level
            self.skill_level += 1
            messages.append(
                f"{self.name} reached crafting level {self.skill_level}!"
            )
        return messages

    @property
    def _xp_for_next_level(self) -> int:
        return int(self._XP_PER_LEVEL * (1 + 0.15 * (self.skill_level - 1)))

    # -- recipe knowledge --

    def learn_recipe(self, recipe: Recipe) -> str:
        if recipe.name in self.known_recipes:
            return f"{self.name} already knows how to craft {recipe.name}."
        self.known_recipes.add(recipe.name)
        return f"{self.name} learned the recipe for {recipe.name}!"

    def knows_recipe(self, recipe: Recipe) -> bool:
        return recipe.unlocked_by_default or recipe.name in self.known_recipes

    # -- tool equipping --

    def equip_tool(self, item: CraftedItem) -> str:
        if item.recipe.category != ItemCategory.TOOL:
            raise CraftingError(f"{item.display_name} is not a tool.")
        self.equipped_tool = item
        return f"{self.name} equipped {item.display_name}."

    # -- gathering --

    def gather(
        self, material: Material, season: Season, quantity: int = 1,
    ) -> str:
        if not material.available_in(season):
            raise SeasonRestrictionError(material.name, season)
        bonus = max(1, self.skill_level // 10)
        actual = quantity + bonus
        self.inventory.add_material(material, actual)
        return (
            f"{self.name} gathered {actual}x {material.name} "
            f"(+{bonus} skill bonus)."
        )


# ---------------------------------------------------------------------------
# Crafting engine
# ---------------------------------------------------------------------------

def _compute_quality(crafter: Crafter, recipe: Recipe) -> QualityTier:
    """Determine the quality tier of a crafted item.

    Quality depends on the crafter's skill relative to the recipe requirement,
    the rarity bonus of ingredients, and a small random factor.
    """
    skill_delta = crafter.skill_level - recipe.skill_requirement
    base_score = 0.30 + 0.012 * max(skill_delta, 0)

    rarity_avg = (
        sum(ing.material.rarity.quality_bonus for ing in recipe.ingredients)
        / max(len(recipe.ingredients), 1)
    )
    base_score += rarity_avg

    if crafter.equipped_tool:
        tool_quality_bonus = {
            QualityTier.ROUGH: -0.05,
            QualityTier.STANDARD: 0.0,
            QualityTier.FINE: 0.03,
            QualityTier.MASTERWORK: 0.07,
            QualityTier.LEGENDARY: 0.12,
        }[crafter.equipped_tool.quality]
        base_score += tool_quality_bonus

    roll = random.random() * 0.20
    final = min(base_score + roll, 1.0)

    if final >= 0.92:
        return QualityTier.LEGENDARY
    if final >= 0.75:
        return QualityTier.MASTERWORK
    if final >= 0.55:
        return QualityTier.FINE
    if final >= 0.35:
        return QualityTier.STANDARD
    return QualityTier.ROUGH


def craft(
    crafter: Crafter,
    recipe: Recipe,
    *,
    available_workstation: Workstation = Workstation.NONE,
    season: Optional[Season] = None,
) -> CraftResult:
    """Attempt to craft an item.

    Validates all preconditions, consumes materials, awards XP, and returns
    a :class:`CraftResult` describing the outcome.
    """
    errors: list[str] = []

    if not crafter.knows_recipe(recipe):
        errors.append(f"{crafter.name} hasn't learned the recipe for {recipe.name}.")

    if crafter.skill_level < recipe.skill_requirement:
        errors.append(
            f"Requires crafting level {recipe.skill_requirement} "
            f"(current: {crafter.skill_level})."
        )

    if recipe.workstation != Workstation.NONE and available_workstation != recipe.workstation:
        errors.append(
            f"Requires a {recipe.workstation.value} "
            f"(have: {available_workstation.value})."
        )

    if season is not None:
        for ing in recipe.ingredients:
            if not ing.material.available_in(season):
                errors.append(
                    f"{ing.material.name} is not available in {season.name}."
                )

    if not crafter.inventory.has_materials_for(recipe):
        for ing in recipe.ingredients:
            have = crafter.inventory.material_count(ing.material)
            if have < ing.quantity:
                errors.append(
                    f"Need {ing.quantity}x {ing.material.name} (have {have})."
                )

    if errors:
        return CraftResult(success=False, errors=tuple(errors))

    # Consume materials
    for ing in recipe.ingredients:
        crafter.inventory.remove_material(ing.material, ing.quantity)

    # Determine quality
    quality = _compute_quality(crafter, recipe)
    item = CraftedItem(
        recipe=recipe, quality=quality, crafter_name=crafter.name,
    )

    # Calculate craft time
    speed_bonus = (
        crafter.equipped_tool.tool_speed_bonus
        if crafter.equipped_tool
        else 0.0
    )
    craft_time = recipe.base_craft_time * (1.0 - speed_bonus)

    # Award XP
    base_xp = 10 * recipe.total_material_count + 5 * recipe.skill_requirement
    xp = max(int(base_xp * (1 + 0.05 * crafter.skill_level)), 1)
    level_messages = crafter.gain_experience(xp)

    crafter.inventory.add_item(item)

    return CraftResult(
        success=True,
        item=item,
        xp_gained=xp,
        craft_time=round(craft_time, 2),
        level_up_messages=tuple(level_messages),
    )


@dataclass(frozen=True)
class CraftResult:
    """Outcome of a crafting attempt."""

    success: bool
    item: Optional[CraftedItem] = None
    xp_gained: int = 0
    craft_time: float = 0.0
    errors: tuple[str, ...] = ()
    level_up_messages: tuple[str, ...] = ()

    @property
    def summary(self) -> str:
        if not self.success:
            return "Crafting failed:\n" + "\n".join(f"  - {e}" for e in self.errors)
        parts = [f"Crafted {self.item.display_name}!"]
        if self.item.comfort > 0:
            parts.append(f"  Comfort: {self.item.comfort:.1f}")
        parts.append(f"  XP gained: {self.xp_gained}")
        parts.append(f"  Time: {self.craft_time}h")
        for msg in self.level_up_messages:
            parts.append(f"  ** {msg} **")
        return "\n".join(parts)


# ---------------------------------------------------------------------------
# Village happiness calculator
# ---------------------------------------------------------------------------

def calculate_village_happiness(
    placed_furniture: list[CraftedItem],
    villager_count: int = 1,
) -> VillageHappiness:
    """Score the village's happiness based on placed furniture.

    Happiness scales with total comfort but has diminishing returns per
    villager so that larger villages need proportionally more furniture.
    """
    total_comfort = sum(item.comfort for item in placed_furniture)
    per_capita = total_comfort / max(villager_count, 1)

    # Diminishing returns: comfort → happiness via log curve
    raw = 20.0 * math.log1p(per_capita)
    happiness = min(round(raw, 1), 100.0)

    unique_types = len({item.recipe.name for item in placed_furniture})
    variety_bonus = min(unique_types * 2.0, 20.0)
    happiness = min(happiness + variety_bonus, 100.0)

    return VillageHappiness(
        total_comfort=round(total_comfort, 1),
        per_capita_comfort=round(per_capita, 1),
        furniture_count=len(placed_furniture),
        unique_types=unique_types,
        happiness_score=happiness,
    )


@dataclass(frozen=True)
class VillageHappiness:
    total_comfort: float
    per_capita_comfort: float
    furniture_count: int
    unique_types: int
    happiness_score: float

    @property
    def mood(self) -> str:
        if self.happiness_score >= 80:
            return "Blissful"
        if self.happiness_score >= 60:
            return "Content"
        if self.happiness_score >= 40:
            return "Comfortable"
        if self.happiness_score >= 20:
            return "Uneasy"
        return "Unhappy"


# ---------------------------------------------------------------------------
# Recipe book — default recipes shipped with the module
# ---------------------------------------------------------------------------

# -- Materials --

OAK_WOOD = Material("Oak Wood", MaterialRarity.COMMON, description="Sturdy hardwood.")
PINE_WOOD = Material("Pine Wood", MaterialRarity.COMMON, description="Light softwood.")
IRON_ORE = Material(
    "Iron Ore", MaterialRarity.UNCOMMON, description="Raw iron from the hillside.",
)
COPPER_ORE = Material("Copper Ore", MaterialRarity.COMMON, description="Greenish ore.")
COTTON = Material(
    "Cotton", MaterialRarity.COMMON,
    seasons=(Season.SPRING, Season.SUMMER),
    description="Soft fibers for weaving.",
)
CLAY = Material(
    "Clay", MaterialRarity.COMMON,
    seasons=(Season.SPRING, Season.SUMMER, Season.AUTUMN),
    description="Malleable earth from the riverbank.",
)
MOONSTONE = Material(
    "Moonstone", MaterialRarity.RARE,
    seasons=(Season.WINTER,),
    description="A pale gem that glows faintly under starlight.",
)
GOLDEN_AMBER = Material(
    "Golden Amber", MaterialRarity.RARE,
    seasons=(Season.AUTUMN,),
    description="Fossilized tree resin with a warm glow.",
)
STARDUST = Material(
    "Stardust", MaterialRarity.LEGENDARY,
    seasons=(Season.WINTER,),
    description="Shimmering dust that falls on the coldest nights.",
)
WOOL = Material(
    "Wool", MaterialRarity.COMMON,
    seasons=(Season.AUTUMN, Season.WINTER),
    description="Warm fleece from village sheep.",
)
STONE = Material(
    "Stone", MaterialRarity.COMMON,
    description="Grey stone from the quarry.",
)
SILVER_ORE = Material(
    "Silver Ore", MaterialRarity.UNCOMMON,
    description="Lustrous ore with a pale sheen.",
)
ENCHANTED_VINE = Material(
    "Enchanted Vine", MaterialRarity.RARE,
    seasons=(Season.SPRING,),
    description="A vine that hums softly with magic.",
)

# -- Tool recipes --

RECIPE_WOODEN_HAMMER = Recipe(
    name="Wooden Hammer",
    category=ItemCategory.TOOL,
    ingredients=(
        RecipeIngredient(OAK_WOOD, 3),
        RecipeIngredient(PINE_WOOD, 1),
    ),
    workstation=Workstation.WORKBENCH,
    base_craft_time=0.5,
    skill_requirement=0,
    description="A basic crafting hammer.",
)

RECIPE_IRON_HAMMER = Recipe(
    name="Iron Hammer",
    category=ItemCategory.TOOL,
    ingredients=(
        RecipeIngredient(IRON_ORE, 2),
        RecipeIngredient(OAK_WOOD, 1),
    ),
    workstation=Workstation.FORGE,
    base_craft_time=1.5,
    skill_requirement=5,
    description="A sturdy hammer for advanced projects.",
)

RECIPE_COPPER_TONGS = Recipe(
    name="Copper Tongs",
    category=ItemCategory.TOOL,
    ingredients=(
        RecipeIngredient(COPPER_ORE, 3),
    ),
    workstation=Workstation.FORGE,
    base_craft_time=1.0,
    skill_requirement=3,
    description="Useful for handling hot materials at the kiln.",
)

RECIPE_STONE_CHISEL = Recipe(
    name="Stone Chisel",
    category=ItemCategory.TOOL,
    ingredients=(
        RecipeIngredient(STONE, 2),
        RecipeIngredient(IRON_ORE, 1),
    ),
    workstation=Workstation.WORKBENCH,
    base_craft_time=0.75,
    skill_requirement=2,
    description="A pointed chisel for detail work in stone and clay.",
)

RECIPE_WEAVING_NEEDLE = Recipe(
    name="Weaving Needle",
    category=ItemCategory.TOOL,
    ingredients=(
        RecipeIngredient(IRON_ORE, 2),
        RecipeIngredient(COTTON, 1),
    ),
    workstation=Workstation.LOOM,
    base_craft_time=0.75,
    skill_requirement=4,
    description="A fine needle that makes loom work effortless.",
)

# -- Furniture recipes --

RECIPE_OAK_CHAIR = Recipe(
    name="Oak Chair",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(OAK_WOOD, 4),
    ),
    workstation=Workstation.WORKBENCH,
    base_craft_time=1.0,
    skill_requirement=1,
    comfort_score=8,
    description="A simple but sturdy chair.",
)

RECIPE_PINE_TABLE = Recipe(
    name="Pine Table",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(PINE_WOOD, 6),
        RecipeIngredient(IRON_ORE, 1),
    ),
    workstation=Workstation.WORKBENCH,
    base_craft_time=2.0,
    skill_requirement=3,
    comfort_score=12,
    description="A large table for the whole family.",
)

RECIPE_COTTON_CURTAINS = Recipe(
    name="Cotton Curtains",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(COTTON, 8),
        RecipeIngredient(OAK_WOOD, 1),
    ),
    workstation=Workstation.LOOM,
    base_craft_time=1.5,
    skill_requirement=4,
    comfort_score=10,
    description="Soft curtains that let in gentle light.",
)

RECIPE_CLAY_FLOWER_POT = Recipe(
    name="Clay Flower Pot",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(CLAY, 3),
    ),
    workstation=Workstation.KILN,
    base_craft_time=1.0,
    skill_requirement=2,
    comfort_score=5,
    description="A hand-shaped pot for wildflowers.",
)

RECIPE_MOONSTONE_LAMP = Recipe(
    name="Moonstone Lamp",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(MOONSTONE, 1),
        RecipeIngredient(IRON_ORE, 2),
        RecipeIngredient(OAK_WOOD, 2),
    ),
    workstation=Workstation.FORGE,
    base_craft_time=3.0,
    skill_requirement=10,
    comfort_score=20,
    description="A lamp that bathes the room in soft silver light.",
    unlocked_by_default=False,
)

RECIPE_AMBER_BOOKSHELF = Recipe(
    name="Amber Bookshelf",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(GOLDEN_AMBER, 2),
        RecipeIngredient(OAK_WOOD, 5),
        RecipeIngredient(IRON_ORE, 1),
    ),
    workstation=Workstation.WORKBENCH,
    base_craft_time=3.5,
    skill_requirement=12,
    comfort_score=18,
    description="A warm bookshelf that smells of autumn.",
    unlocked_by_default=False,
)

RECIPE_STARDUST_BED = Recipe(
    name="Stardust Bed",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(STARDUST, 3),
        RecipeIngredient(MOONSTONE, 1),
        RecipeIngredient(COTTON, 10),
        RecipeIngredient(OAK_WOOD, 6),
    ),
    workstation=Workstation.ENCHANTING_TABLE,
    base_craft_time=6.0,
    skill_requirement=20,
    comfort_score=40,
    description="Sleeping here fills your dreams with starlight.",
    unlocked_by_default=False,
)

RECIPE_PINE_SHELF = Recipe(
    name="Pine Shelf",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(PINE_WOOD, 3),
        RecipeIngredient(IRON_ORE, 1),
    ),
    workstation=Workstation.WORKBENCH,
    base_craft_time=1.0,
    skill_requirement=2,
    comfort_score=7,
    description="A small shelf for trinkets and jars.",
)

RECIPE_COTTON_PILLOW = Recipe(
    name="Cotton Pillow",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(COTTON, 4),
        RecipeIngredient(WOOL, 2),
    ),
    workstation=Workstation.LOOM,
    base_craft_time=1.0,
    skill_requirement=3,
    comfort_score=6,
    description="A plump pillow stuffed with wool.",
)

RECIPE_WOOL_RUG = Recipe(
    name="Wool Rug",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(WOOL, 6),
        RecipeIngredient(COTTON, 2),
    ),
    workstation=Workstation.LOOM,
    base_craft_time=2.0,
    skill_requirement=5,
    comfort_score=14,
    description="A thick woven rug that warms cold floors.",
)

RECIPE_SILVER_MIRROR = Recipe(
    name="Silver Mirror",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(SILVER_ORE, 3),
        RecipeIngredient(OAK_WOOD, 2),
    ),
    workstation=Workstation.FORGE,
    base_craft_time=2.5,
    skill_requirement=7,
    comfort_score=15,
    description="A polished mirror in a carved wooden frame.",
)

RECIPE_STONE_FIREPLACE = Recipe(
    name="Stone Fireplace",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(STONE, 8),
        RecipeIngredient(IRON_ORE, 2),
        RecipeIngredient(CLAY, 1),
    ),
    workstation=Workstation.FORGE,
    base_craft_time=4.0,
    skill_requirement=8,
    comfort_score=22,
    description="A grand fireplace that warms the whole house.",
)

RECIPE_ENCHANTED_PLANTER = Recipe(
    name="Enchanted Planter",
    category=ItemCategory.FURNITURE,
    ingredients=(
        RecipeIngredient(ENCHANTED_VINE, 2),
        RecipeIngredient(CLAY, 3),
        RecipeIngredient(MOONSTONE, 1),
    ),
    workstation=Workstation.ENCHANTING_TABLE,
    base_craft_time=4.0,
    skill_requirement=15,
    comfort_score=28,
    description="Flowers planted here bloom in every season.",
    unlocked_by_default=False,
)

ALL_RECIPES: tuple[Recipe, ...] = (
    RECIPE_WOODEN_HAMMER,
    RECIPE_IRON_HAMMER,
    RECIPE_COPPER_TONGS,
    RECIPE_STONE_CHISEL,
    RECIPE_WEAVING_NEEDLE,
    RECIPE_OAK_CHAIR,
    RECIPE_PINE_TABLE,
    RECIPE_PINE_SHELF,
    RECIPE_COTTON_CURTAINS,
    RECIPE_COTTON_PILLOW,
    RECIPE_CLAY_FLOWER_POT,
    RECIPE_WOOL_RUG,
    RECIPE_SILVER_MIRROR,
    RECIPE_STONE_FIREPLACE,
    RECIPE_MOONSTONE_LAMP,
    RECIPE_AMBER_BOOKSHELF,
    RECIPE_ENCHANTED_PLANTER,
    RECIPE_STARDUST_BED,
)

ALL_MATERIALS: tuple[Material, ...] = (
    OAK_WOOD, PINE_WOOD, IRON_ORE, COPPER_ORE,
    COTTON, CLAY, WOOL, STONE, SILVER_ORE,
    MOONSTONE, GOLDEN_AMBER, ENCHANTED_VINE, STARDUST,
)


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class CraftingError(Exception):
    """Base exception for crafting-related errors."""


class InsufficientMaterialError(CraftingError):
    def __init__(self, material: str, needed: int, have: int) -> None:
        self.material = material
        self.needed = needed
        self.have = have
        super().__init__(
            f"Not enough {material}: need {needed}, have {have}."
        )


class SeasonRestrictionError(CraftingError):
    def __init__(self, material: str, season: Season) -> None:
        self.material = material
        self.season = season
        super().__init__(
            f"{material} cannot be gathered in {season.name}."
        )


# ---------------------------------------------------------------------------
# Convenience helpers
# ---------------------------------------------------------------------------

def recipe_book_display(recipes: tuple[Recipe, ...] = ALL_RECIPES) -> str:
    """Return a formatted string listing all recipes for display."""
    lines: list[str] = ["=== Recipe Book ===", ""]
    for recipe in recipes:
        lock = "" if recipe.unlocked_by_default else " [locked]"
        lines.append(f"  {recipe.name}{lock}  ({recipe.category.name})")
        lines.append(f"    {recipe.description}")
        lines.append(f"    Station: {recipe.workstation.value}")
        lines.append(f"    Skill req: {recipe.skill_requirement}")
        if recipe.comfort_score:
            lines.append(f"    Base comfort: {recipe.comfort_score}")
        ing_parts = [
            f"{ing.quantity}x {ing.material.name}"
            for ing in recipe.ingredients
        ]
        lines.append(f"    Materials: {', '.join(ing_parts)}")
        lines.append("")
    return "\n".join(lines)


def seasonal_materials(season: Season) -> list[Material]:
    """Return materials available in the given season."""
    return [m for m in ALL_MATERIALS if m.available_in(season)]
