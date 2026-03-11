"""
economy.py — Cozy Village Economy Simulator

A trading system for baked goods and potions in a peaceful village setting.
Villagers bake bread, brew potions, and trade with one another at the
village market. Prices fluctuate with seasons and supply/demand.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional


# ---------------------------------------------------------------------------
# Core enums
# ---------------------------------------------------------------------------

class Season(Enum):
    SPRING = auto()
    SUMMER = auto()
    AUTUMN = auto()
    WINTER = auto()

    def next(self) -> "Season":
        members = list(Season)
        idx = (members.index(self) + 1) % len(members)
        return members[idx]


class ItemCategory(Enum):
    BAKED_GOOD = "baked_good"
    POTION = "potion"


# ---------------------------------------------------------------------------
# Items & recipes
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Item:
    name: str
    category: ItemCategory
    base_price: float
    shelf_life: int  # days before spoilage (0 = never spoils)
    seasonal_bonus: dict[Season, float] = field(default_factory=dict)

    def price_in_season(self, season: Season) -> float:
        multiplier = self.seasonal_bonus.get(season, 1.0)
        return round(self.base_price * multiplier, 2)


@dataclass(frozen=True)
class Ingredient:
    name: str
    base_cost: float


@dataclass(frozen=True)
class Recipe:
    output: Item
    ingredients: dict[str, int]  # ingredient name -> quantity
    craft_time: int  # minutes
    skill_required: float  # 0.0 – 1.0


# ---------------------------------------------------------------------------
# Pre-built catalogue
# ---------------------------------------------------------------------------

INGREDIENTS: dict[str, Ingredient] = {
    "flour": Ingredient("flour", 0.30),
    "sugar": Ingredient("sugar", 0.25),
    "butter": Ingredient("butter", 0.50),
    "eggs": Ingredient("eggs", 0.20),
    "yeast": Ingredient("yeast", 0.15),
    "honey": Ingredient("honey", 0.60),
    "milk": Ingredient("milk", 0.35),
    "lavender": Ingredient("lavender", 0.80),
    "moonpetal": Ingredient("moonpetal", 1.50),
    "sunfruit": Ingredient("sunfruit", 1.20),
    "frost_mint": Ingredient("frost_mint", 1.00),
    "ember_root": Ingredient("ember_root", 1.40),
    "dewdrop_moss": Ingredient("dewdrop_moss", 0.90),
}

ITEMS: dict[str, Item] = {
    "sourdough_loaf": Item(
        "Sourdough Loaf", ItemCategory.BAKED_GOOD, 3.50, shelf_life=5,
        seasonal_bonus={Season.AUTUMN: 1.3, Season.WINTER: 1.5},
    ),
    "honey_cake": Item(
        "Honey Cake", ItemCategory.BAKED_GOOD, 5.00, shelf_life=4,
        seasonal_bonus={Season.SPRING: 1.4, Season.SUMMER: 1.2},
    ),
    "cinnamon_roll": Item(
        "Cinnamon Roll", ItemCategory.BAKED_GOOD, 2.75, shelf_life=4,
        seasonal_bonus={Season.WINTER: 1.6},
    ),
    "lavender_scone": Item(
        "Lavender Scone", ItemCategory.BAKED_GOOD, 4.50, shelf_life=3,
        seasonal_bonus={Season.SPRING: 1.5, Season.SUMMER: 1.3},
    ),
    "berry_tart": Item(
        "Berry Tart", ItemCategory.BAKED_GOOD, 5.50, shelf_life=3,
        seasonal_bonus={Season.SUMMER: 1.7},
    ),
    "healing_potion": Item(
        "Healing Potion", ItemCategory.POTION, 12.00, shelf_life=0,
        seasonal_bonus={Season.SPRING: 0.9},
    ),
    "energy_elixir": Item(
        "Energy Elixir", ItemCategory.POTION, 10.00, shelf_life=0,
        seasonal_bonus={Season.SUMMER: 1.3, Season.AUTUMN: 1.2},
    ),
    "sleep_draught": Item(
        "Sleep Draught", ItemCategory.POTION, 9.50, shelf_life=0,
        seasonal_bonus={Season.WINTER: 1.4},
    ),
    "frost_tonic": Item(
        "Frost Tonic", ItemCategory.POTION, 13.50, shelf_life=0,
        seasonal_bonus={Season.WINTER: 1.8, Season.AUTUMN: 1.3},
    ),
    "sunshine_brew": Item(
        "Sunshine Brew", ItemCategory.POTION, 11.00, shelf_life=0,
        seasonal_bonus={Season.SPRING: 1.5, Season.SUMMER: 1.6},
    ),
}

RECIPES: dict[str, Recipe] = {
    "sourdough_loaf": Recipe(
        ITEMS["sourdough_loaf"],
        {"flour": 3, "yeast": 1, "butter": 1},
        craft_time=90, skill_required=0.3,
    ),
    "honey_cake": Recipe(
        ITEMS["honey_cake"],
        {"flour": 2, "honey": 2, "eggs": 2, "butter": 1},
        craft_time=60, skill_required=0.4,
    ),
    "cinnamon_roll": Recipe(
        ITEMS["cinnamon_roll"],
        {"flour": 2, "sugar": 1, "butter": 1, "yeast": 1},
        craft_time=45, skill_required=0.2,
    ),
    "lavender_scone": Recipe(
        ITEMS["lavender_scone"],
        {"flour": 2, "butter": 1, "lavender": 2, "sugar": 1},
        craft_time=35, skill_required=0.3,
    ),
    "berry_tart": Recipe(
        ITEMS["berry_tart"],
        {"flour": 1, "butter": 1, "sugar": 1, "sunfruit": 2},
        craft_time=50, skill_required=0.5,
    ),
    "healing_potion": Recipe(
        ITEMS["healing_potion"],
        {"moonpetal": 2, "dewdrop_moss": 1, "honey": 1},
        craft_time=30, skill_required=0.6,
    ),
    "energy_elixir": Recipe(
        ITEMS["energy_elixir"],
        {"sunfruit": 2, "ember_root": 1, "honey": 1},
        craft_time=25, skill_required=0.5,
    ),
    "sleep_draught": Recipe(
        ITEMS["sleep_draught"],
        {"lavender": 3, "moonpetal": 1, "dewdrop_moss": 1},
        craft_time=40, skill_required=0.5,
    ),
    "frost_tonic": Recipe(
        ITEMS["frost_tonic"],
        {"frost_mint": 3, "moonpetal": 1, "dewdrop_moss": 2},
        craft_time=55, skill_required=0.7,
    ),
    "sunshine_brew": Recipe(
        ITEMS["sunshine_brew"],
        {"sunfruit": 3, "ember_root": 1, "honey": 1},
        craft_time=35, skill_required=0.6,
    ),
}


# ---------------------------------------------------------------------------
# Inventory slot (tracks age for spoilage)
# ---------------------------------------------------------------------------

@dataclass
class InventorySlot:
    item: Item
    quantity: int
    age_days: int = 0

    @property
    def is_spoiled(self) -> bool:
        return self.item.shelf_life > 0 and self.age_days >= self.item.shelf_life

    def advance_day(self) -> None:
        self.age_days += 1


# ---------------------------------------------------------------------------
# Villager
# ---------------------------------------------------------------------------

class Villager:
    def __init__(
        self,
        name: str,
        coins: float = 50.0,
        baking_skill: float = 0.3,
        brewing_skill: float = 0.3,
    ) -> None:
        self.name = name
        self.coins = round(coins, 2)
        self.baking_skill = max(0.0, min(1.0, baking_skill))
        self.brewing_skill = max(0.0, min(1.0, brewing_skill))
        self.inventory: dict[str, InventorySlot] = {}
        self.ingredients: dict[str, int] = {}
        self.reputation: float = 0.0
        self.trades_completed: int = 0

    # --- inventory helpers ---------------------------------------------------

    def add_item(self, item_key: str, quantity: int = 1, age_days: int = 0) -> None:
        if item_key in self.inventory:
            slot = self.inventory[item_key]
            slot.age_days = max(slot.age_days, age_days)
            slot.quantity += quantity
        else:
            self.inventory[item_key] = InventorySlot(ITEMS[item_key], quantity, age_days)

    def remove_item(self, item_key: str, quantity: int = 1) -> bool:
        slot = self.inventory.get(item_key)
        if slot is None or slot.quantity < quantity:
            return False
        slot.quantity -= quantity
        if slot.quantity == 0:
            del self.inventory[item_key]
        return True

    def add_ingredient(self, name: str, quantity: int = 1) -> None:
        self.ingredients[name] = self.ingredients.get(name, 0) + quantity

    def remove_spoiled(self) -> list[str]:
        spoiled = [k for k, s in self.inventory.items() if s.is_spoiled]
        for k in spoiled:
            del self.inventory[k]
        return spoiled

    # --- crafting ------------------------------------------------------------

    def _skill_for(self, recipe: Recipe) -> float:
        if recipe.output.category is ItemCategory.BAKED_GOOD:
            return self.baking_skill
        return self.brewing_skill

    def can_craft(self, recipe_key: str) -> bool:
        recipe = RECIPES.get(recipe_key)
        if recipe is None:
            return False
        if self._skill_for(recipe) < recipe.skill_required:
            return False
        for ing_name, qty in recipe.ingredients.items():
            if self.ingredients.get(ing_name, 0) < qty:
                return False
        return True

    def craft(self, recipe_key: str) -> Optional[str]:
        """Attempt to craft an item. Returns an error message or None on success."""
        recipe = RECIPES.get(recipe_key)
        if recipe is None:
            return f"Unknown recipe: {recipe_key}"
        skill = self._skill_for(recipe)
        if skill < recipe.skill_required:
            return (
                f"{self.name} lacks skill ({skill:.0%} < "
                f"{recipe.skill_required:.0%}) for {recipe.output.name}"
            )
        for ing_name, qty in recipe.ingredients.items():
            if self.ingredients.get(ing_name, 0) < qty:
                return f"Not enough {ing_name} (need {qty})"
        # consume ingredients
        for ing_name, qty in recipe.ingredients.items():
            self.ingredients[ing_name] -= qty
            if self.ingredients[ing_name] == 0:
                del self.ingredients[ing_name]
        # bonus yield for high skill
        bonus = 1 + int(skill >= 0.9)
        self.add_item(recipe_key, bonus)
        # skill growth
        if recipe.output.category is ItemCategory.BAKED_GOOD:
            self.baking_skill = min(1.0, self.baking_skill + 0.01)
        else:
            self.brewing_skill = min(1.0, self.brewing_skill + 0.01)
        return None

    # --- display -------------------------------------------------------------

    def __repr__(self) -> str:
        return (
            f"Villager({self.name!r}, coins={self.coins}, "
            f"baking={self.baking_skill:.0%}, brewing={self.brewing_skill:.0%})"
        )


# ---------------------------------------------------------------------------
# Trade result
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class TradeResult:
    success: bool
    message: str
    buyer: str
    seller: str
    item_name: str
    quantity: int
    total_price: float


# ---------------------------------------------------------------------------
# Market — the central trading hub
# ---------------------------------------------------------------------------

class Market:
    """The village market where villagers trade goods."""

    TAX_RATE = 0.05  # 5 % market tax on every sale
    REPUTATION_DISCOUNT_CAP = 0.15  # max 15 % discount from reputation

    def __init__(self, season: Season = Season.SPRING) -> None:
        self.season = season
        self.day: int = 1
        self.price_noise: dict[str, float] = {}  # per-item supply/demand jitter
        self.trade_log: list[TradeResult] = []
        self._refresh_noise()

    # --- season / day --------------------------------------------------------

    def advance_day(self, villagers: list[Villager]) -> list[str]:
        """Tick one day forward. Returns list of notable events."""
        events: list[str] = []
        self.day += 1

        # season changes every 28 days
        if self.day % 28 == 1 and self.day > 1:
            old = self.season
            self.season = self.season.next()
            events.append(f"Season changed from {old.name} to {self.season.name}!")
            self._refresh_noise()

        # age inventories & remove spoiled items
        for v in villagers:
            for slot in v.inventory.values():
                slot.advance_day()
            spoiled = v.remove_spoiled()
            for key in spoiled:
                events.append(
                    f"{v.name}'s {ITEMS[key].name} spoiled and was discarded."
                )

        # minor price fluctuations every 7 days
        if self.day % 7 == 0:
            self._refresh_noise()
            events.append("Market prices shifted with supply and demand.")

        return events

    def _refresh_noise(self) -> None:
        for key in ITEMS:
            self.price_noise[key] = random.uniform(0.85, 1.15)

    # --- pricing -------------------------------------------------------------

    def current_price(self, item_key: str) -> float:
        item = ITEMS[item_key]
        seasonal = item.price_in_season(self.season)
        noise = self.price_noise.get(item_key, 1.0)
        return round(seasonal * noise, 2)

    def sell_price(self, item_key: str, seller: Villager) -> float:
        """Estimated per-unit revenue after tax. Seller reputation reduces
        the effective tax rate (up to 80% reduction at max reputation)."""
        base = self.current_price(item_key)
        rep_tax_relief = min(seller.reputation * 0.08, 0.80)
        effective_tax = self.TAX_RATE * (1 - rep_tax_relief)
        return round(base * (1 - effective_tax), 2)

    def buy_price(self, item_key: str, buyer: Villager) -> float:
        """Price a buyer pays (reputation gives a discount)."""
        base = self.current_price(item_key)
        rep_discount = min(buyer.reputation * 0.01, self.REPUTATION_DISCOUNT_CAP)
        return round(base * (1 - rep_discount), 2)

    # --- trading -------------------------------------------------------------

    def trade(
        self,
        buyer: Villager,
        seller: Villager,
        item_key: str,
        quantity: int = 1,
    ) -> TradeResult:
        item = ITEMS.get(item_key)
        if item is None:
            return TradeResult(False, f"Unknown item: {item_key}", buyer.name,
                               seller.name, item_key, quantity, 0)

        slot = seller.inventory.get(item_key)
        if slot is None or slot.quantity < quantity:
            available = slot.quantity if slot else 0
            return TradeResult(
                False,
                f"{seller.name} only has {available} {item.name}(s).",
                buyer.name, seller.name, item.name, quantity, 0,
            )

        if slot.is_spoiled:
            return TradeResult(
                False, f"{item.name} has spoiled!", buyer.name,
                seller.name, item.name, quantity, 0,
            )

        unit_price = self.buy_price(item_key, buyer)
        total = round(unit_price * quantity, 2)

        if buyer.coins < total:
            return TradeResult(
                False,
                f"{buyer.name} can't afford {quantity} {item.name}(s) "
                f"({total} coins needed, has {buyer.coins}).",
                buyer.name, seller.name, item.name, quantity, total,
            )

        # execute the trade — transfer items with their current age
        item_age = slot.age_days
        seller.remove_item(item_key, quantity)
        buyer.add_item(item_key, quantity, age_days=item_age)
        buyer.coins = round(buyer.coins - total, 2)
        # seller revenue derived from buyer payment minus tax (no coin creation)
        rep_tax_relief = min(seller.reputation * 0.08, 0.80)
        effective_tax = self.TAX_RATE * (1 - rep_tax_relief)
        tax = round(total * effective_tax, 2)
        seller_revenue = round(total - tax, 2)
        seller.coins = round(seller.coins + seller_revenue, 2)

        # reputation
        buyer.trades_completed += 1
        seller.trades_completed += 1
        seller.reputation = min(10.0, seller.reputation + 0.1 * quantity)
        buyer.reputation = min(10.0, buyer.reputation + 0.05 * quantity)

        result = TradeResult(
            True,
            f"{buyer.name} bought {quantity} {item.name}(s) from "
            f"{seller.name} for {total} coins.",
            buyer.name, seller.name, item.name, quantity, total,
        )
        self.trade_log.append(result)
        return result

    # --- bulk pricing & summaries -------------------------------------------

    def price_board(self) -> list[dict]:
        """Return a list of dicts suitable for display as a price board."""
        rows = []
        for key, item in ITEMS.items():
            rows.append({
                "key": key,
                "name": item.name,
                "category": item.category.value,
                "price": self.current_price(key),
                "base_price": item.base_price,
                "season": self.season.name,
                "shelf_life": item.shelf_life or "infinite",
            })
        return rows

    def trade_summary(self) -> dict:
        """Aggregate stats from the trade log."""
        if not self.trade_log:
            return {"total_trades": 0, "total_volume": 0, "top_item": None}
        volume: dict[str, int] = {}
        for t in self.trade_log:
            if t.success:
                volume[t.item_name] = volume.get(t.item_name, 0) + t.quantity
        top = max(volume, key=volume.get) if volume else None  # type: ignore[arg-type]
        return {
            "total_trades": len([t for t in self.trade_log if t.success]),
            "total_volume": sum(volume.values()),
            "top_item": top,
            "coins_exchanged": round(
                sum(t.total_price for t in self.trade_log if t.success), 2
            ),
        }


# ---------------------------------------------------------------------------
# Ingredient shop — villagers buy raw materials here
# ---------------------------------------------------------------------------

class IngredientShop:
    """Sells raw ingredients to villagers at fluctuating prices."""

    def __init__(self, season: Season = Season.SPRING) -> None:
        self.season = season
        self._seasonal_modifiers: dict[str, dict[Season, float]] = {
            "lavender": {Season.SPRING: 0.7, Season.SUMMER: 0.8, Season.WINTER: 1.4},
            "sunfruit": {Season.SUMMER: 0.6, Season.WINTER: 1.5},
            "frost_mint": {Season.WINTER: 0.7, Season.SUMMER: 1.4},
            "moonpetal": {Season.AUTUMN: 0.8, Season.WINTER: 0.9, Season.SUMMER: 1.3},
            "ember_root": {Season.WINTER: 0.75, Season.SPRING: 1.3},
            "honey": {Season.SPRING: 0.8, Season.WINTER: 1.3},
            "butter": {Season.WINTER: 1.2},
        }

    def price(self, ingredient_name: str) -> Optional[float]:
        ing = INGREDIENTS.get(ingredient_name)
        if ing is None:
            return None
        mod = self._seasonal_modifiers.get(ingredient_name, {}).get(self.season, 1.0)
        return round(ing.base_cost * mod, 2)

    def buy(self, villager: Villager, ingredient_name: str, qty: int = 1) -> str:
        unit = self.price(ingredient_name)
        if unit is None:
            return f"Unknown ingredient: {ingredient_name}"
        total = round(unit * qty, 2)
        if villager.coins < total:
            return (
                f"{villager.name} can't afford {qty} {ingredient_name} "
                f"(costs {total}, has {villager.coins})"
            )
        villager.coins = round(villager.coins - total, 2)
        villager.add_ingredient(ingredient_name, qty)
        return f"{villager.name} bought {qty} {ingredient_name} for {total} coins."


# ---------------------------------------------------------------------------
# Village — top-level simulation wrapper
# ---------------------------------------------------------------------------

class Village:
    """Ties together villagers, market, and ingredient shop."""

    def __init__(self, name: str = "Willowbrook", season: Season = Season.SPRING):
        self.name = name
        self.villagers: dict[str, Villager] = {}
        self.market = Market(season)
        self.shop = IngredientShop(season)

    def add_villager(self, villager: Villager) -> None:
        self.villagers[villager.name] = villager

    def get_villager(self, name: str) -> Optional[Villager]:
        return self.villagers.get(name)

    def advance_day(self) -> list[str]:
        events = self.market.advance_day(list(self.villagers.values()))
        # sync season to shop
        self.shop.season = self.market.season
        return events

    def simulate_days(self, n: int) -> list[str]:
        all_events: list[str] = []
        for _ in range(n):
            all_events.extend(self.advance_day())
        return all_events

    # --- convenience ---------------------------------------------------------

    def leaderboard(self) -> list[dict]:
        """Rank villagers by coins + reputation score."""
        rows = []
        for v in self.villagers.values():
            score = v.coins + v.reputation * 10
            rows.append({
                "name": v.name,
                "coins": v.coins,
                "reputation": round(v.reputation, 2),
                "trades": v.trades_completed,
                "score": round(score, 2),
            })
        rows.sort(key=lambda r: r["score"], reverse=True)
        return rows

    def __repr__(self) -> str:
        return (
            f"Village({self.name!r}, day={self.market.day}, "
            f"season={self.market.season.name}, "
            f"villagers={len(self.villagers)})"
        )


# ---------------------------------------------------------------------------
# Quick demo when run directly
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    village = Village("Willowbrook")

    # create some villagers
    ada = Villager("Ada", coins=80, baking_skill=0.5, brewing_skill=0.2)
    bram = Villager("Bram", coins=60, baking_skill=0.2, brewing_skill=0.7)
    clara = Villager("Clara", coins=100, baking_skill=0.8, brewing_skill=0.5)

    for v in [ada, bram, clara]:
        village.add_villager(v)

    # buy ingredients
    for ing, qty in [("flour", 6), ("honey", 4), ("eggs", 4), ("butter", 3)]:
        print(village.shop.buy(ada, ing, qty))

    for ing, qty in [("moonpetal", 4), ("dewdrop_moss", 2), ("honey", 2)]:
        print(village.shop.buy(bram, ing, qty))

    # craft some goods
    print()
    err = ada.craft("honey_cake")
    print(f"Ada crafts honey cake: {err or 'success!'}")

    err = bram.craft("healing_potion")
    print(f"Bram crafts healing potion: {err or 'success!'}")

    # trade at market
    print()
    result = village.market.trade(clara, ada, "honey_cake", 1)
    print(result.message)

    result = village.market.trade(ada, bram, "healing_potion", 1)
    print(result.message)

    # advance a few days
    print()
    events = village.simulate_days(7)
    for e in events:
        print(f"  * {e}")

    # show price board
    print("\n--- Price Board ---")
    for row in village.market.price_board():
        print(f"  {row['name']:20s}  {row['price']:>6.2f} coins  ({row['category']})")

    # leaderboard
    print("\n--- Leaderboard ---")
    for i, row in enumerate(village.leaderboard(), 1):
        print(
            f"  {i}. {row['name']:8s}  {row['coins']:>7.2f} coins  "
            f"rep={row['reputation']:.2f}  trades={row['trades']}"
        )
