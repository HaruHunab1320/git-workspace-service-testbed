"""Tests for economy seasonal scarcity and spoilage age transfer."""

from __future__ import annotations

from economy import (
    INGREDIENTS,
    ITEMS,
    RECIPES,
    IngredientShop,
    InventorySlot,
    Market,
    Season,
    Villager,
)


# ---------------------------------------------------------------------------
# Seasonal scarcity — off-season crafting costs more
# ---------------------------------------------------------------------------


class TestSeasonalScarcity:
    """Verify that ingredient prices rise in off-season, making crafting
    those recipes more expensive than in their cheap/neutral season."""

    def _total_ingredient_cost(self, shop: IngredientShop, recipe_key: str) -> float:
        """Sum ingredient costs for a recipe at the shop's current season."""
        recipe = RECIPES[recipe_key]
        total = 0.0
        for ing_name, qty in recipe.ingredients.items():
            unit = shop.price(ing_name)
            assert unit is not None, f"Unknown ingredient {ing_name}"
            total += unit * qty
        return round(total, 2)

    def test_lavender_costs_more_in_winter(self):
        """Lavender has a 1.4x winter modifier — verify the raw price."""
        shop_spring = IngredientShop(Season.SPRING)
        shop_winter = IngredientShop(Season.WINTER)
        spring_price = shop_spring.price("lavender")
        winter_price = shop_winter.price("lavender")
        assert winter_price > spring_price

    def test_sunfruit_costs_more_in_winter(self):
        """Sunfruit has a 1.5x winter modifier."""
        shop_summer = IngredientShop(Season.SUMMER)
        shop_winter = IngredientShop(Season.WINTER)
        summer_price = shop_summer.price("sunfruit")
        winter_price = shop_winter.price("sunfruit")
        assert winter_price > summer_price

    def test_frost_mint_costs_more_in_summer(self):
        """Frost mint has a 1.4x summer modifier."""
        shop_winter = IngredientShop(Season.WINTER)
        shop_summer = IngredientShop(Season.SUMMER)
        winter_price = shop_winter.price("frost_mint")
        summer_price = shop_summer.price("frost_mint")
        assert summer_price > winter_price

    def test_sleep_draught_cheaper_in_spring(self):
        """Sleep Draught uses lavender×3 + moonpetal + dewdrop_moss.
        Lavender is cheap in spring (0.7x) but expensive in winter (1.4x),
        so the total recipe cost should be higher in winter."""
        shop_spring = IngredientShop(Season.SPRING)
        shop_winter = IngredientShop(Season.WINTER)
        cost_spring = self._total_ingredient_cost(shop_spring, "sleep_draught")
        cost_winter = self._total_ingredient_cost(shop_winter, "sleep_draught")
        assert cost_winter > cost_spring

    def test_berry_tart_cheaper_in_summer(self):
        """Berry Tart uses sunfruit×2. Sunfruit is 0.6x in summer but
        1.5x in winter, so winter crafting should cost significantly more."""
        shop_summer = IngredientShop(Season.SUMMER)
        shop_winter = IngredientShop(Season.WINTER)
        cost_summer = self._total_ingredient_cost(shop_summer, "berry_tart")
        cost_winter = self._total_ingredient_cost(shop_winter, "berry_tart")
        assert cost_winter > cost_summer

    def test_frost_tonic_cheaper_in_winter(self):
        """Frost Tonic uses frost_mint×3 (0.7x in winter, 1.4x in summer)
        so it should be much cheaper to craft in winter."""
        shop_winter = IngredientShop(Season.WINTER)
        shop_summer = IngredientShop(Season.SUMMER)
        cost_winter = self._total_ingredient_cost(shop_winter, "frost_tonic")
        cost_summer = self._total_ingredient_cost(shop_summer, "frost_tonic")
        assert cost_summer > cost_winter

    def test_off_season_modifier_exceeds_one(self):
        """All off-season modifiers should be > 1.0 to represent scarcity."""
        shop = IngredientShop(Season.SPRING)
        off_season_entries = {
            ("lavender", Season.WINTER): 1.4,
            ("sunfruit", Season.WINTER): 1.5,
            ("frost_mint", Season.SUMMER): 1.4,
            ("moonpetal", Season.SUMMER): 1.3,
            ("ember_root", Season.SPRING): 1.3,
            ("honey", Season.WINTER): 1.3,
            ("butter", Season.WINTER): 1.2,
        }
        for (ing, season), expected_mod in off_season_entries.items():
            mod = shop._seasonal_modifiers.get(ing, {}).get(season, 1.0)
            assert mod == expected_mod, (
                f"{ing} in {season.name}: expected {expected_mod}, got {mod}"
            )

    def test_full_crafting_cost_comparison(self):
        """Buying ingredients and crafting a sleep_draught should cost
        the villager more coins in winter than in spring."""
        for start_season, end_season in [
            (Season.SPRING, Season.WINTER),
        ]:
            v_cheap = Villager("Tester", coins=200, brewing_skill=1.0)
            v_expensive = Villager("Tester", coins=200, brewing_skill=1.0)
            shop_cheap = IngredientShop(start_season)
            shop_expensive = IngredientShop(end_season)

            recipe = RECIPES["sleep_draught"]
            for ing_name, qty in recipe.ingredients.items():
                shop_cheap.buy(v_cheap, ing_name, qty)
                shop_expensive.buy(v_expensive, ing_name, qty)

            coins_spent_cheap = 200 - v_cheap.coins
            coins_spent_expensive = 200 - v_expensive.coins
            assert coins_spent_expensive > coins_spent_cheap


# ---------------------------------------------------------------------------
# Spoilage age transfer through trades
# ---------------------------------------------------------------------------


class TestSpoilageAgeTransfer:
    """Verify that item age follows the item through multiple trades,
    rather than resetting to 0 for each new owner."""

    def _make_market(self) -> Market:
        """Return a market with deterministic (no noise) pricing."""
        m = Market(Season.SPRING)
        for key in ITEMS:
            m.price_noise[key] = 1.0
        return m

    def test_single_trade_preserves_age(self):
        """After one trade the buyer should hold the seller's item age."""
        market = self._make_market()
        seller = Villager("Seller", coins=100)
        buyer = Villager("Buyer", coins=100)

        seller.add_item("sourdough_loaf", 1, age_days=3)
        result = market.trade(buyer, seller, "sourdough_loaf")
        assert result.success
        slot = buyer.inventory["sourdough_loaf"]
        assert slot.age_days == 3

    def test_two_trades_preserve_age(self):
        """A→B→C chain: the item's age at C equals the original age at A."""
        market = self._make_market()
        alice = Villager("Alice", coins=100)
        bob = Villager("Bob", coins=100)
        carol = Villager("Carol", coins=100)

        alice.add_item("honey_cake", 1, age_days=2)
        r1 = market.trade(bob, alice, "honey_cake")
        assert r1.success
        assert bob.inventory["honey_cake"].age_days == 2

        r2 = market.trade(carol, bob, "honey_cake")
        assert r2.success
        assert carol.inventory["honey_cake"].age_days == 2

    def test_three_trades_preserve_age(self):
        """A→B→C→D chain across three trades."""
        market = self._make_market()
        v = [Villager(f"V{i}", coins=200) for i in range(4)]

        v[0].add_item("healing_potion", 1, age_days=0)
        # advance some days manually
        v[0].inventory["healing_potion"].age_days = 5

        for i in range(3):
            seller, buyer = v[i], v[i + 1]
            result = market.trade(buyer, seller, "healing_potion")
            assert result.success, result.message
            assert buyer.inventory["healing_potion"].age_days == 5

    def test_age_does_not_reset_on_trade(self):
        """Explicitly confirm age != 0 after trade of an aged item."""
        market = self._make_market()
        seller = Villager("Seller", coins=100)
        buyer = Villager("Buyer", coins=100)

        seller.add_item("cinnamon_roll", 1, age_days=2)
        result = market.trade(buyer, seller, "cinnamon_roll")
        assert result.success
        assert buyer.inventory["cinnamon_roll"].age_days != 0
        assert buyer.inventory["cinnamon_roll"].age_days == 2

    def test_traded_item_can_spoil_at_buyer(self):
        """An item traded at age close to shelf_life should spoil
        at the buyer after a few more days."""
        market = self._make_market()
        seller = Villager("Seller", coins=100)
        buyer = Villager("Buyer", coins=100)

        # Cinnamon roll: shelf_life=4 on PR branch
        seller.add_item("cinnamon_roll", 1, age_days=3)
        result = market.trade(buyer, seller, "cinnamon_roll")
        assert result.success

        slot = buyer.inventory["cinnamon_roll"]
        assert slot.age_days == 3
        assert not slot.is_spoiled  # age 3 < shelf_life 4

        slot.advance_day()  # age → 4 == shelf_life → spoiled
        assert slot.is_spoiled

    def test_age_uses_max_when_merging(self):
        """When a buyer already has the same item, add_item should keep
        the higher (older) age."""
        buyer = Villager("Buyer", coins=100)
        buyer.add_item("sourdough_loaf", 1, age_days=1)
        buyer.add_item("sourdough_loaf", 1, age_days=4)
        slot = buyer.inventory["sourdough_loaf"]
        assert slot.quantity == 2
        assert slot.age_days == 4  # max(1, 4)
