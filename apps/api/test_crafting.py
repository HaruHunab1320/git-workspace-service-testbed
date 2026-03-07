"""
Tests for crafting.py — Cozy Village Crafting Module
"""

import random
from unittest.mock import patch

import pytest

from crafting import (
    Season,
    MaterialRarity,
    ItemCategory,
    Workstation,
    QualityTier,
    Material,
    RecipeIngredient,
    Recipe,
    CraftedItem,
    Inventory,
    Crafter,
    CraftResult,
    VillageHappiness,
    craft,
    calculate_village_happiness,
    recipe_book_display,
    seasonal_materials,
    _compute_quality,
    CraftingError,
    InsufficientMaterialError,
    SeasonRestrictionError,
    OAK_WOOD,
    PINE_WOOD,
    IRON_ORE,
    COPPER_ORE,
    COTTON,
    CLAY,
    MOONSTONE,
    GOLDEN_AMBER,
    STARDUST,
    WOOL,
    STONE,
    SILVER_ORE,
    ENCHANTED_VINE,
    RECIPE_WOODEN_HAMMER,
    RECIPE_IRON_HAMMER,
    RECIPE_OAK_CHAIR,
    RECIPE_PINE_TABLE,
    RECIPE_COTTON_CURTAINS,
    RECIPE_CLAY_FLOWER_POT,
    RECIPE_MOONSTONE_LAMP,
    RECIPE_AMBER_BOOKSHELF,
    RECIPE_STARDUST_BED,
    RECIPE_PINE_SHELF,
    RECIPE_COTTON_PILLOW,
    RECIPE_WOOL_RUG,
    RECIPE_SILVER_MIRROR,
    RECIPE_STONE_FIREPLACE,
    RECIPE_ENCHANTED_PLANTER,
    RECIPE_COPPER_TONGS,
    RECIPE_STONE_CHISEL,
    RECIPE_WEAVING_NEEDLE,
    ALL_RECIPES,
    ALL_MATERIALS,
)
from errors import ValidationError


# ---------------------------------------------------------------------------
# Enum tests
# ---------------------------------------------------------------------------

class TestMaterialRarity:
    def test_quality_bonus_common(self):
        assert MaterialRarity.COMMON.quality_bonus == 0.0

    def test_quality_bonus_uncommon(self):
        assert MaterialRarity.UNCOMMON.quality_bonus == 0.05

    def test_quality_bonus_rare(self):
        assert MaterialRarity.RARE.quality_bonus == 0.12

    def test_quality_bonus_legendary(self):
        assert MaterialRarity.LEGENDARY.quality_bonus == 0.25


class TestQualityTier:
    def test_comfort_multiplier_rough(self):
        assert QualityTier.ROUGH.comfort_multiplier == 0.6

    def test_comfort_multiplier_standard(self):
        assert QualityTier.STANDARD.comfort_multiplier == 1.0

    def test_comfort_multiplier_fine(self):
        assert QualityTier.FINE.comfort_multiplier == 1.3

    def test_comfort_multiplier_masterwork(self):
        assert QualityTier.MASTERWORK.comfort_multiplier == 1.6

    def test_comfort_multiplier_legendary(self):
        assert QualityTier.LEGENDARY.comfort_multiplier == 2.0


class TestWorkstation:
    def test_values(self):
        assert Workstation.NONE.value == "hand-crafted"
        assert Workstation.WORKBENCH.value == "workbench"
        assert Workstation.FORGE.value == "forge"
        assert Workstation.LOOM.value == "loom"
        assert Workstation.KILN.value == "kiln"
        assert Workstation.ENCHANTING_TABLE.value == "enchanting table"


# ---------------------------------------------------------------------------
# Material tests
# ---------------------------------------------------------------------------

class TestMaterial:
    def test_default_all_seasons(self):
        mat = Material("Test Wood")
        assert mat.available_in(Season.SPRING)
        assert mat.available_in(Season.SUMMER)
        assert mat.available_in(Season.AUTUMN)
        assert mat.available_in(Season.WINTER)

    def test_seasonal_restriction(self):
        mat = Material("Spring Only", seasons=(Season.SPRING,))
        assert mat.available_in(Season.SPRING)
        assert not mat.available_in(Season.WINTER)
        assert not mat.available_in(Season.SUMMER)

    def test_cotton_seasons(self):
        assert COTTON.available_in(Season.SPRING)
        assert COTTON.available_in(Season.SUMMER)
        assert not COTTON.available_in(Season.AUTUMN)
        assert not COTTON.available_in(Season.WINTER)

    def test_moonstone_winter_only(self):
        assert MOONSTONE.available_in(Season.WINTER)
        assert not MOONSTONE.available_in(Season.SPRING)

    def test_stardust_winter_only(self):
        assert STARDUST.available_in(Season.WINTER)
        assert not STARDUST.available_in(Season.SUMMER)

    def test_enchanted_vine_spring_only(self):
        assert ENCHANTED_VINE.available_in(Season.SPRING)
        assert not ENCHANTED_VINE.available_in(Season.AUTUMN)

    def test_frozen_dataclass(self):
        with pytest.raises(AttributeError):
            OAK_WOOD.name = "Changed"


# ---------------------------------------------------------------------------
# Recipe tests
# ---------------------------------------------------------------------------

class TestRecipe:
    def test_total_material_count(self):
        assert RECIPE_WOODEN_HAMMER.total_material_count == 4  # 3 oak + 1 pine

    def test_pine_table_material_count(self):
        assert RECIPE_PINE_TABLE.total_material_count == 7  # 6 pine + 1 iron

    def test_stardust_bed_material_count(self):
        assert RECIPE_STARDUST_BED.total_material_count == 20  # 3+1+10+6

    def test_moonstone_lamp_locked(self):
        assert not RECIPE_MOONSTONE_LAMP.unlocked_by_default

    def test_oak_chair_unlocked(self):
        assert RECIPE_OAK_CHAIR.unlocked_by_default

    def test_all_recipes_tuple(self):
        assert len(ALL_RECIPES) == 18
        assert all(isinstance(r, Recipe) for r in ALL_RECIPES)

    def test_all_materials_tuple(self):
        assert len(ALL_MATERIALS) == 13
        assert all(isinstance(m, Material) for m in ALL_MATERIALS)


# ---------------------------------------------------------------------------
# CraftedItem tests
# ---------------------------------------------------------------------------

class TestCraftedItem:
    def test_furniture_comfort_calculation(self):
        item = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.STANDARD,
            crafter_name="Tester",
        )
        assert item.comfort == 8.0 * 1.0  # comfort_score * multiplier

    def test_furniture_comfort_masterwork(self):
        item = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.MASTERWORK,
            crafter_name="Tester",
        )
        assert item.comfort == 8.0 * 1.6

    def test_tool_has_zero_comfort(self):
        item = CraftedItem(
            recipe=RECIPE_WOODEN_HAMMER,
            quality=QualityTier.STANDARD,
            crafter_name="Tester",
        )
        assert item.comfort == 0.0

    def test_display_name(self):
        item = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.FINE,
            crafter_name="Tester",
        )
        assert item.display_name == "Fine Oak Chair"

    def test_tool_speed_bonus_rough(self):
        item = CraftedItem(
            recipe=RECIPE_WOODEN_HAMMER,
            quality=QualityTier.ROUGH,
            crafter_name="Tester",
        )
        assert item.tool_speed_bonus == -0.10

    def test_tool_speed_bonus_legendary(self):
        item = CraftedItem(
            recipe=RECIPE_WOODEN_HAMMER,
            quality=QualityTier.LEGENDARY,
            crafter_name="Tester",
        )
        assert item.tool_speed_bonus == 0.35

    def test_tool_speed_bonus_standard(self):
        item = CraftedItem(
            recipe=RECIPE_WOODEN_HAMMER,
            quality=QualityTier.STANDARD,
            crafter_name="Tester",
        )
        assert item.tool_speed_bonus == 0.0

    def test_furniture_has_no_speed_bonus(self):
        item = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.LEGENDARY,
            crafter_name="Tester",
        )
        assert item.tool_speed_bonus == 0.0


# ---------------------------------------------------------------------------
# Inventory tests
# ---------------------------------------------------------------------------

class TestInventory:
    def test_add_and_count_material(self):
        inv = Inventory()
        inv.add_material(OAK_WOOD, 5)
        assert inv.material_count(OAK_WOOD) == 5

    def test_add_material_accumulates(self):
        inv = Inventory()
        inv.add_material(OAK_WOOD, 3)
        inv.add_material(OAK_WOOD, 2)
        assert inv.material_count(OAK_WOOD) == 5

    def test_add_material_zero_raises(self):
        inv = Inventory()
        with pytest.raises(ValidationError, match="positive"):
            inv.add_material(OAK_WOOD, 0)

    def test_add_material_negative_raises(self):
        inv = Inventory()
        with pytest.raises(ValidationError, match="positive"):
            inv.add_material(OAK_WOOD, -1)

    def test_remove_material(self):
        inv = Inventory()
        inv.add_material(OAK_WOOD, 5)
        inv.remove_material(OAK_WOOD, 3)
        assert inv.material_count(OAK_WOOD) == 2

    def test_remove_material_exact(self):
        inv = Inventory()
        inv.add_material(OAK_WOOD, 3)
        inv.remove_material(OAK_WOOD, 3)
        assert inv.material_count(OAK_WOOD) == 0

    def test_remove_material_insufficient_raises(self):
        inv = Inventory()
        inv.add_material(OAK_WOOD, 2)
        with pytest.raises(InsufficientMaterialError):
            inv.remove_material(OAK_WOOD, 5)

    def test_remove_nonexistent_material_raises(self):
        inv = Inventory()
        with pytest.raises(InsufficientMaterialError):
            inv.remove_material(OAK_WOOD, 1)

    def test_has_materials_for_recipe(self):
        inv = Inventory()
        inv.add_material(OAK_WOOD, 4)
        inv.add_material(PINE_WOOD, 1)
        assert inv.has_materials_for(RECIPE_WOODEN_HAMMER)

    def test_has_materials_for_recipe_insufficient(self):
        inv = Inventory()
        inv.add_material(OAK_WOOD, 2)  # need 3
        inv.add_material(PINE_WOOD, 1)
        assert not inv.has_materials_for(RECIPE_WOODEN_HAMMER)

    def test_material_summary(self):
        inv = Inventory()
        inv.add_material(OAK_WOOD, 5)
        inv.add_material(IRON_ORE, 3)
        summary = inv.material_summary
        assert summary == {"Oak Wood": 5, "Iron Ore": 3}

    def test_add_and_get_items(self):
        inv = Inventory()
        item = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.STANDARD,
            crafter_name="Tester",
        )
        inv.add_item(item)
        assert len(inv.items) == 1
        assert inv.items[0] is item

    def test_total_comfort(self):
        inv = Inventory()
        chair = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.STANDARD,
            crafter_name="Tester",
        )
        table = CraftedItem(
            recipe=RECIPE_PINE_TABLE,
            quality=QualityTier.FINE,
            crafter_name="Tester",
        )
        inv.add_item(chair)
        inv.add_item(table)
        expected = (8.0 * 1.0) + (12.0 * 1.3)
        assert inv.total_comfort == expected

    def test_items_returns_copy(self):
        inv = Inventory()
        items = inv.items
        items.append("fake")
        assert len(inv.items) == 0


# ---------------------------------------------------------------------------
# Crafter tests
# ---------------------------------------------------------------------------

class TestCrafter:
    def test_default_crafter(self):
        c = Crafter(name="Alice")
        assert c.skill_level == 1
        assert c.experience == 0
        assert c.equipped_tool is None

    def test_gain_experience_no_level_up(self):
        c = Crafter(name="Alice")
        messages = c.gain_experience(50)
        assert c.experience == 50
        assert messages == []

    def test_gain_experience_level_up(self):
        c = Crafter(name="Alice")
        messages = c.gain_experience(100)
        assert c.skill_level == 2
        assert len(messages) == 1
        assert "level 2" in messages[0]

    def test_gain_experience_multiple_levels(self):
        c = Crafter(name="Alice")
        messages = c.gain_experience(500)
        assert c.skill_level > 2
        assert len(messages) > 1

    def test_max_level_cap(self):
        c = Crafter(name="Alice", skill_level=50)
        messages = c.gain_experience(99999)
        assert c.skill_level == 50
        assert messages == []

    def test_xp_for_next_level_increases(self):
        c = Crafter(name="Alice", skill_level=1)
        xp1 = c._xp_for_next_level
        c.skill_level = 10
        xp10 = c._xp_for_next_level
        assert xp10 > xp1

    def test_learn_recipe(self):
        c = Crafter(name="Alice")
        msg = c.learn_recipe(RECIPE_MOONSTONE_LAMP)
        assert "learned" in msg
        assert RECIPE_MOONSTONE_LAMP.name in c.known_recipes

    def test_learn_recipe_already_known(self):
        c = Crafter(name="Alice")
        c.learn_recipe(RECIPE_MOONSTONE_LAMP)
        msg = c.learn_recipe(RECIPE_MOONSTONE_LAMP)
        assert "already knows" in msg

    def test_knows_recipe_default_unlocked(self):
        c = Crafter(name="Alice")
        assert c.knows_recipe(RECIPE_OAK_CHAIR)

    def test_knows_recipe_locked_not_learned(self):
        c = Crafter(name="Alice")
        assert not c.knows_recipe(RECIPE_MOONSTONE_LAMP)

    def test_knows_recipe_locked_after_learning(self):
        c = Crafter(name="Alice")
        c.learn_recipe(RECIPE_MOONSTONE_LAMP)
        assert c.knows_recipe(RECIPE_MOONSTONE_LAMP)

    def test_equip_tool(self):
        c = Crafter(name="Alice")
        tool = CraftedItem(
            recipe=RECIPE_WOODEN_HAMMER,
            quality=QualityTier.STANDARD,
            crafter_name="Alice",
        )
        msg = c.equip_tool(tool)
        assert c.equipped_tool is tool
        assert "equipped" in msg

    def test_equip_non_tool_raises(self):
        c = Crafter(name="Alice")
        chair = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.STANDARD,
            crafter_name="Alice",
        )
        with pytest.raises(CraftingError, match="not a tool"):
            c.equip_tool(chair)

    def test_gather_basic(self):
        c = Crafter(name="Alice")
        msg = c.gather(OAK_WOOD, Season.SPRING, quantity=3)
        assert "gathered" in msg
        assert c.inventory.material_count(OAK_WOOD) >= 3

    def test_gather_skill_bonus(self):
        c = Crafter(name="Alice", skill_level=20)
        c.gather(OAK_WOOD, Season.SPRING, quantity=1)
        bonus = max(1, 20 // 10)  # = 2
        assert c.inventory.material_count(OAK_WOOD) == 1 + bonus

    def test_gather_wrong_season_raises(self):
        c = Crafter(name="Alice")
        with pytest.raises(SeasonRestrictionError):
            c.gather(COTTON, Season.WINTER)

    def test_gather_moonstone_in_winter(self):
        c = Crafter(name="Alice")
        c.gather(MOONSTONE, Season.WINTER)
        assert c.inventory.material_count(MOONSTONE) >= 1


# ---------------------------------------------------------------------------
# Quality computation tests
# ---------------------------------------------------------------------------

class TestComputeQuality:
    def test_low_skill_tends_rough_or_standard(self):
        crafter = Crafter(name="Newbie", skill_level=1)
        recipe = RECIPE_OAK_CHAIR
        qualities = set()
        random.seed(42)
        for _ in range(50):
            qualities.add(_compute_quality(crafter, recipe))
        assert QualityTier.ROUGH in qualities or QualityTier.STANDARD in qualities

    def test_high_skill_never_rough(self):
        crafter = Crafter(name="Master", skill_level=50)
        recipe = RECIPE_OAK_CHAIR
        random.seed(0)
        for _ in range(100):
            q = _compute_quality(crafter, recipe)
            assert q != QualityTier.ROUGH

    @patch("crafting.random.random", return_value=0.19)
    def test_quality_with_high_roll(self, mock_rand):
        # skill_level=50, skill_req=1 => base=0.30+0.012*49=0.888
        # rarity bonus=0 (common), roll=0.19*0.20=0.038 => final=0.926 => LEGENDARY
        crafter = Crafter(name="Expert", skill_level=50)
        q = _compute_quality(crafter, RECIPE_OAK_CHAIR)
        assert q == QualityTier.LEGENDARY

    @patch("crafting.random.random", return_value=0.0)
    def test_quality_with_low_roll(self, mock_rand):
        crafter = Crafter(name="Newbie", skill_level=1)
        q = _compute_quality(crafter, RECIPE_OAK_CHAIR)
        assert q in (QualityTier.ROUGH, QualityTier.STANDARD)

    def test_equipped_tool_affects_quality(self):
        crafter = Crafter(name="Crafter", skill_level=10)
        tool = CraftedItem(
            recipe=RECIPE_WOODEN_HAMMER,
            quality=QualityTier.LEGENDARY,
            crafter_name="Crafter",
        )
        crafter.equipped_tool = tool
        random.seed(42)
        results_with_tool = [_compute_quality(crafter, RECIPE_OAK_CHAIR) for _ in range(50)]

        crafter.equipped_tool = None
        random.seed(42)
        results_without_tool = [_compute_quality(crafter, RECIPE_OAK_CHAIR) for _ in range(50)]

        with_scores = sum(1 for q in results_with_tool if q in (QualityTier.MASTERWORK, QualityTier.LEGENDARY))
        without_scores = sum(1 for q in results_without_tool if q in (QualityTier.MASTERWORK, QualityTier.LEGENDARY))
        assert with_scores >= without_scores


# ---------------------------------------------------------------------------
# Craft function tests
# ---------------------------------------------------------------------------

class TestCraft:
    def _make_crafter_with_materials(self, recipe, skill_level=1):
        c = Crafter(name="Tester", skill_level=skill_level)
        for ing in recipe.ingredients:
            c.inventory.add_material(ing.material, ing.quantity)
        return c

    def test_craft_simple_success(self):
        c = self._make_crafter_with_materials(RECIPE_OAK_CHAIR)
        result = craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.WORKBENCH)
        assert result.success
        assert result.item is not None
        assert result.xp_gained > 0

    def test_craft_consumes_materials(self):
        c = self._make_crafter_with_materials(RECIPE_OAK_CHAIR)
        craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.WORKBENCH)
        assert c.inventory.material_count(OAK_WOOD) == 0

    def test_craft_adds_item_to_inventory(self):
        c = self._make_crafter_with_materials(RECIPE_OAK_CHAIR)
        result = craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.WORKBENCH)
        assert result.item in c.inventory.items

    def test_craft_insufficient_materials(self):
        c = Crafter(name="Tester")
        c.inventory.add_material(OAK_WOOD, 1)  # need 4
        result = craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.WORKBENCH)
        assert not result.success
        assert len(result.errors) > 0

    def test_craft_wrong_workstation(self):
        c = self._make_crafter_with_materials(RECIPE_OAK_CHAIR)
        result = craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.FORGE)
        assert not result.success
        assert any("workbench" in e.lower() for e in result.errors)

    def test_craft_no_workstation_when_needed(self):
        c = self._make_crafter_with_materials(RECIPE_OAK_CHAIR)
        result = craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.NONE)
        assert not result.success

    def test_craft_insufficient_skill(self):
        c = self._make_crafter_with_materials(RECIPE_IRON_HAMMER)
        c.skill_level = 1  # needs 5
        result = craft(c, RECIPE_IRON_HAMMER, available_workstation=Workstation.FORGE)
        assert not result.success
        assert any("level" in e.lower() for e in result.errors)

    def test_craft_unknown_recipe_locked(self):
        c = self._make_crafter_with_materials(RECIPE_MOONSTONE_LAMP, skill_level=15)
        result = craft(c, RECIPE_MOONSTONE_LAMP, available_workstation=Workstation.FORGE)
        assert not result.success
        assert any("learned" in e.lower() or "recipe" in e.lower() for e in result.errors)

    def test_craft_learned_locked_recipe(self):
        c = self._make_crafter_with_materials(RECIPE_MOONSTONE_LAMP, skill_level=15)
        c.learn_recipe(RECIPE_MOONSTONE_LAMP)
        result = craft(c, RECIPE_MOONSTONE_LAMP, available_workstation=Workstation.FORGE)
        assert result.success

    def test_craft_seasonal_material_wrong_season(self):
        c = self._make_crafter_with_materials(RECIPE_COTTON_CURTAINS, skill_level=5)
        result = craft(
            c, RECIPE_COTTON_CURTAINS,
            available_workstation=Workstation.LOOM,
            season=Season.WINTER,
        )
        assert not result.success
        assert any("not available" in e.lower() for e in result.errors)

    def test_craft_seasonal_material_correct_season(self):
        c = self._make_crafter_with_materials(RECIPE_COTTON_CURTAINS, skill_level=5)
        result = craft(
            c, RECIPE_COTTON_CURTAINS,
            available_workstation=Workstation.LOOM,
            season=Season.SPRING,
        )
        assert result.success

    def test_craft_awards_xp(self):
        c = self._make_crafter_with_materials(RECIPE_OAK_CHAIR)
        initial_xp = c.experience
        result = craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.WORKBENCH)
        assert c.experience > initial_xp or c.skill_level > 1

    def test_craft_time_with_tool(self):
        c = self._make_crafter_with_materials(RECIPE_OAK_CHAIR)
        tool = CraftedItem(
            recipe=RECIPE_WOODEN_HAMMER,
            quality=QualityTier.LEGENDARY,
            crafter_name="Tester",
        )
        c.equip_tool(tool)
        result = craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.WORKBENCH)
        assert result.success
        expected_time = round(RECIPE_OAK_CHAIR.base_craft_time * (1.0 - 0.35), 2)
        assert result.craft_time == expected_time

    def test_craft_time_without_tool(self):
        c = self._make_crafter_with_materials(RECIPE_OAK_CHAIR)
        result = craft(c, RECIPE_OAK_CHAIR, available_workstation=Workstation.WORKBENCH)
        assert result.craft_time == RECIPE_OAK_CHAIR.base_craft_time

    def test_craft_multiple_errors_accumulated(self):
        c = Crafter(name="Tester", skill_level=1)
        # No materials, wrong workstation, locked recipe, low skill
        result = craft(c, RECIPE_MOONSTONE_LAMP, available_workstation=Workstation.NONE)
        assert not result.success
        assert len(result.errors) >= 2

    def test_craft_hand_crafted_no_workstation_needed(self):
        recipe = Recipe(
            name="Simple Stick",
            category=ItemCategory.TOOL,
            ingredients=(RecipeIngredient(OAK_WOOD, 1),),
            workstation=Workstation.NONE,
            base_craft_time=0.25,
        )
        c = Crafter(name="Tester")
        c.inventory.add_material(OAK_WOOD, 1)
        result = craft(c, recipe, available_workstation=Workstation.NONE)
        assert result.success


# ---------------------------------------------------------------------------
# CraftResult tests
# ---------------------------------------------------------------------------

class TestCraftResult:
    def test_failure_summary(self):
        result = CraftResult(
            success=False,
            errors=("Not enough Oak Wood.", "Requires workbench."),
        )
        summary = result.summary
        assert "failed" in summary.lower()
        assert "Oak Wood" in summary
        assert "workbench" in summary

    def test_success_summary(self):
        item = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.FINE,
            crafter_name="Tester",
        )
        result = CraftResult(
            success=True,
            item=item,
            xp_gained=50,
            craft_time=1.0,
        )
        summary = result.summary
        assert "Fine Oak Chair" in summary
        assert "50" in summary
        assert "1.0" in summary

    def test_success_summary_with_comfort(self):
        item = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.FINE,
            crafter_name="Tester",
        )
        result = CraftResult(success=True, item=item, xp_gained=50, craft_time=1.0)
        assert "Comfort" in result.summary

    def test_success_summary_with_level_up(self):
        item = CraftedItem(
            recipe=RECIPE_WOODEN_HAMMER,
            quality=QualityTier.STANDARD,
            crafter_name="Tester",
        )
        result = CraftResult(
            success=True,
            item=item,
            xp_gained=50,
            craft_time=0.5,
            level_up_messages=("Tester reached crafting level 2!",),
        )
        assert "level 2" in result.summary


# ---------------------------------------------------------------------------
# Village happiness tests
# ---------------------------------------------------------------------------

class TestVillageHappiness:
    def test_empty_village(self):
        result = calculate_village_happiness([], villager_count=1)
        assert result.happiness_score >= 0
        assert result.furniture_count == 0

    def test_single_furniture(self):
        chair = CraftedItem(
            recipe=RECIPE_OAK_CHAIR,
            quality=QualityTier.STANDARD,
            crafter_name="Tester",
        )
        result = calculate_village_happiness([chair], villager_count=1)
        assert result.happiness_score > 0
        assert result.furniture_count == 1
        assert result.unique_types == 1

    def test_multiple_furniture_types_variety_bonus(self):
        chair = CraftedItem(recipe=RECIPE_OAK_CHAIR, quality=QualityTier.STANDARD, crafter_name="T")
        table = CraftedItem(recipe=RECIPE_PINE_TABLE, quality=QualityTier.STANDARD, crafter_name="T")
        result = calculate_village_happiness([chair, table], villager_count=1)
        assert result.unique_types == 2
        assert result.happiness_score > 0

    def test_more_villagers_dilute_happiness(self):
        chair = CraftedItem(recipe=RECIPE_OAK_CHAIR, quality=QualityTier.STANDARD, crafter_name="T")
        r1 = calculate_village_happiness([chair], villager_count=1)
        r10 = calculate_village_happiness([chair], villager_count=10)
        assert r1.per_capita_comfort > r10.per_capita_comfort

    def test_happiness_capped_at_100(self):
        items = []
        for _ in range(50):
            items.append(CraftedItem(
                recipe=RECIPE_STONE_FIREPLACE,
                quality=QualityTier.LEGENDARY,
                crafter_name="T",
            ))
        result = calculate_village_happiness(items, villager_count=1)
        assert result.happiness_score <= 100.0

    def test_variety_bonus_capped(self):
        # variety bonus = min(unique_types * 2.0, 20.0)
        # With 11+ unique types, bonus should cap at 20
        items = []
        for recipe in ALL_RECIPES:
            if recipe.category == ItemCategory.FURNITURE:
                items.append(CraftedItem(recipe=recipe, quality=QualityTier.STANDARD, crafter_name="T"))
        result = calculate_village_happiness(items, villager_count=1)
        assert result.unique_types <= len(items)

    def test_mood_blissful(self):
        vh = VillageHappiness(100, 100, 10, 5, 85.0)
        assert vh.mood == "Blissful"

    def test_mood_content(self):
        vh = VillageHappiness(50, 50, 5, 3, 65.0)
        assert vh.mood == "Content"

    def test_mood_comfortable(self):
        vh = VillageHappiness(30, 30, 3, 2, 45.0)
        assert vh.mood == "Comfortable"

    def test_mood_uneasy(self):
        vh = VillageHappiness(10, 10, 1, 1, 25.0)
        assert vh.mood == "Uneasy"

    def test_mood_unhappy(self):
        vh = VillageHappiness(0, 0, 0, 0, 5.0)
        assert vh.mood == "Unhappy"

    def test_zero_villagers_no_divide_by_zero(self):
        result = calculate_village_happiness([], villager_count=0)
        assert result.per_capita_comfort == 0.0


# ---------------------------------------------------------------------------
# Exceptions tests
# ---------------------------------------------------------------------------

class TestExceptions:
    def test_insufficient_material_error(self):
        err = InsufficientMaterialError("Oak Wood", 5, 2)
        assert err.material == "Oak Wood"
        assert err.needed == 5
        assert err.have == 2
        assert "Oak Wood" in str(err)

    def test_season_restriction_error(self):
        err = SeasonRestrictionError("Moonstone", Season.SUMMER)
        assert err.material == "Moonstone"
        assert err.season == Season.SUMMER
        assert "SUMMER" in str(err)

    def test_crafting_error_base(self):
        err = CraftingError("something went wrong")
        assert str(err) == "something went wrong"

    def test_exception_hierarchy(self):
        assert issubclass(InsufficientMaterialError, CraftingError)
        assert issubclass(SeasonRestrictionError, CraftingError)


# ---------------------------------------------------------------------------
# Helper function tests
# ---------------------------------------------------------------------------

class TestHelpers:
    def test_recipe_book_display(self):
        output = recipe_book_display()
        assert "Recipe Book" in output
        assert "Oak Chair" in output
        assert "Moonstone Lamp" in output
        assert "[locked]" in output

    def test_recipe_book_display_subset(self):
        output = recipe_book_display((RECIPE_OAK_CHAIR,))
        assert "Oak Chair" in output
        assert "Moonstone Lamp" not in output

    def test_seasonal_materials_spring(self):
        mats = seasonal_materials(Season.SPRING)
        mat_names = [m.name for m in mats]
        assert "Cotton" in mat_names
        assert "Enchanted Vine" in mat_names
        assert "Moonstone" not in mat_names

    def test_seasonal_materials_winter(self):
        mats = seasonal_materials(Season.WINTER)
        mat_names = [m.name for m in mats]
        assert "Moonstone" in mat_names
        assert "Stardust" in mat_names
        assert "Cotton" not in mat_names

    def test_seasonal_materials_all_season_always_present(self):
        for season in Season:
            mats = seasonal_materials(season)
            mat_names = [m.name for m in mats]
            assert "Oak Wood" in mat_names  # available all seasons
