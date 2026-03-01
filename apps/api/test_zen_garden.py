"""
Tests for zen_garden.py — Zen Garden Succulent & Rock System
"""

import random

import pytest

from zen_garden import (
    ALL_SUCCULENTS,
    ALL_ROCKS,
    COMMON_SUCCULENTS,
    RARE_SUCCULENTS,
    HARMONY_PAIRS,
    HARMONY_PAIR_BONUS,
    SucculentStage,
    SucculentType,
    RockSize,
    RockType,
    TileKind,
    RakePattern,
    ZenTile,
    ZenGarden,
    ECHEVERIA,
    JADE_PLANT,
    ALOE,
    HENS_AND_CHICKS,
    BURROS_TAIL,
    ZEBRA_PLANT,
    AGAVE,
    LITHOPS,
    MOONSTONE,
    BLACK_PRINCE,
    RIVER_STONE,
    PEBBLE,
    GRANITE_BOULDER,
    SLATE_SLAB,
    SANDSTONE,
    MOSS_ROCK,
    QUARTZ_CRYSTAL,
    OBSIDIAN,
)


class TestSucculentType:
    def test_common_succulents_exist(self):
        assert len(COMMON_SUCCULENTS) >= 5

    def test_rare_succulents_exist(self):
        assert len(RARE_SUCCULENTS) >= 2

    def test_rare_flag(self):
        assert LITHOPS.is_rare
        assert MOONSTONE.is_rare
        assert BLACK_PRINCE.is_rare
        assert not ECHEVERIA.is_rare
        assert not JADE_PLANT.is_rare

    def test_rarity_label(self):
        assert LITHOPS.rarity_label == "Rare"
        assert ECHEVERIA.rarity_label == "Common"

    def test_all_have_descriptions(self):
        for s in ALL_SUCCULENTS:
            assert s.description
            assert s.name
            assert s.emoji

    def test_all_have_positive_maturity(self):
        for s in ALL_SUCCULENTS:
            assert s.days_to_mature > 0

    def test_water_tolerance_range(self):
        for s in ALL_SUCCULENTS:
            assert 0 <= s.water_tolerance <= 3


class TestRockType:
    def test_all_rocks_exist(self):
        assert len(ALL_ROCKS) >= 6

    def test_size_variety(self):
        sizes = {r.size for r in ALL_ROCKS}
        assert RockSize.SMALL in sizes
        assert RockSize.MEDIUM in sizes
        assert RockSize.LARGE in sizes

    def test_special_rocks(self):
        assert QUARTZ_CRYSTAL.is_special
        assert OBSIDIAN.is_special
        assert not RIVER_STONE.is_special

    def test_all_have_descriptions(self):
        for r in ALL_ROCKS:
            assert r.description
            assert r.name
            assert r.emoji

    def test_weight_positive(self):
        for r in ALL_ROCKS:
            assert r.weight > 0


class TestSucculentStage:
    def test_growth_order(self):
        assert SucculentStage.SPROUT.growth_order == 0
        assert SucculentStage.YOUNG.growth_order == 1
        assert SucculentStage.MATURE.growth_order == 2
        assert SucculentStage.BLOOMING.growth_order == 3

    def test_ordering_is_monotonic(self):
        stages = list(SucculentStage)
        for i in range(len(stages) - 1):
            assert stages[i].growth_order < stages[i + 1].growth_order


class TestZenTile:
    def test_default_is_sand(self):
        tile = ZenTile(0, 0)
        assert tile.kind is TileKind.SAND
        assert tile.is_empty
        assert not tile.has_succulent
        assert not tile.has_rock

    def test_place_succulent(self):
        tile = ZenTile(0, 0)
        msg = tile.place_succulent(ECHEVERIA)
        assert "Planted" in msg
        assert tile.has_succulent
        assert not tile.is_empty
        assert tile.succulent is ECHEVERIA
        assert tile.succulent_stage is SucculentStage.SPROUT

    def test_place_rock(self):
        tile = ZenTile(0, 0)
        msg = tile.place_rock(RIVER_STONE)
        assert "Placed" in msg
        assert tile.has_rock
        assert not tile.is_empty
        assert tile.rock is RIVER_STONE

    def test_place_succulent_on_occupied_rock(self):
        tile = ZenTile(0, 0)
        tile.place_rock(RIVER_STONE)
        msg = tile.place_succulent(ECHEVERIA)
        assert "Remove it first" in msg
        assert tile.has_rock

    def test_place_rock_on_occupied_succulent(self):
        tile = ZenTile(0, 0)
        tile.place_succulent(ECHEVERIA)
        msg = tile.place_rock(RIVER_STONE)
        assert "Remove it first" in msg
        assert tile.has_succulent

    def test_place_succulent_on_succulent(self):
        tile = ZenTile(0, 0)
        tile.place_succulent(ECHEVERIA)
        msg = tile.place_succulent(JADE_PLANT)
        assert "already has" in msg

    def test_place_rock_on_rock(self):
        tile = ZenTile(0, 0)
        tile.place_rock(RIVER_STONE)
        msg = tile.place_rock(GRANITE_BOULDER)
        assert "already has" in msg

    def test_rake_empty_tile(self):
        tile = ZenTile(0, 0)
        msg = tile.rake(RakePattern.WAVES)
        assert "Raked" in msg
        assert tile.rake_pattern is RakePattern.WAVES

    def test_rake_occupied_tile(self):
        tile = ZenTile(0, 0)
        tile.place_rock(RIVER_STONE)
        msg = tile.rake(RakePattern.WAVES)
        assert "only rake empty" in msg.lower()

    def test_remove_succulent(self):
        tile = ZenTile(0, 0)
        tile.place_succulent(ECHEVERIA)
        msg = tile.remove()
        assert "Removed" in msg
        assert "Echeveria" in msg
        assert tile.is_empty

    def test_remove_rock(self):
        tile = ZenTile(0, 0)
        tile.place_rock(GRANITE_BOULDER)
        msg = tile.remove()
        assert "Removed" in msg
        assert "Granite Boulder" in msg
        assert tile.is_empty

    def test_remove_rake_pattern(self):
        tile = ZenTile(0, 0)
        tile.rake(RakePattern.CIRCLES)
        msg = tile.remove()
        assert "Smoothed" in msg
        assert tile.rake_pattern is RakePattern.NONE

    def test_remove_empty(self):
        tile = ZenTile(0, 0)
        msg = tile.remove()
        assert "already empty" in msg


class TestZenGarden:
    def test_creation(self):
        garden = ZenGarden(5, 7)
        assert garden.rows == 5
        assert garden.cols == 7
        assert len(garden.all_tiles()) == 35

    def test_place_succulent(self):
        garden = ZenGarden(5, 7)
        msg = garden.place_succulent(1, 1, ECHEVERIA)
        assert "Planted" in msg
        assert len(garden.succulent_tiles()) == 1
        assert garden.total_placements == 1

    def test_place_rock(self):
        garden = ZenGarden(5, 7)
        msg = garden.place_rock(2, 3, GRANITE_BOULDER)
        assert "Placed" in msg
        assert len(garden.rock_tiles()) == 1
        assert garden.total_placements == 1

    def test_place_invalid_position(self):
        garden = ZenGarden(5, 7)
        msg = garden.place_succulent(99, 99, ECHEVERIA)
        assert "doesn't exist" in msg

    def test_rake_tile(self):
        garden = ZenGarden(5, 7)
        msg = garden.rake_tile(0, 0, RakePattern.WAVES)
        assert "Raked" in msg
        assert len(garden.raked_tiles()) == 1

    def test_remove_item(self):
        garden = ZenGarden(5, 7)
        garden.place_succulent(1, 1, ECHEVERIA)
        msg = garden.remove_item(1, 1)
        assert "Removed" in msg
        assert len(garden.succulent_tiles()) == 0

    def test_remove_invalid_position(self):
        garden = ZenGarden(5, 7)
        msg = garden.remove_item(99, 99)
        assert "doesn't exist" in msg

    def test_advance_day_grows_succulents(self):
        random.seed(42)
        garden = ZenGarden(5, 7)
        garden.place_succulent(0, 0, HENS_AND_CHICKS)  # 8 day succulent
        for _ in range(5):
            garden.advance_day()
        tile = garden.get_tile(0, 0)
        assert tile.growth_progress > 0
        assert tile.days_planted == 5

    def test_full_growth_cycle(self):
        random.seed(42)
        garden = ZenGarden(5, 7)
        garden.place_succulent(0, 0, HENS_AND_CHICKS)  # 8 days to mature
        for _ in range(25):
            garden.advance_day()
        tile = garden.get_tile(0, 0)
        assert tile.succulent_stage is SucculentStage.BLOOMING
        assert tile.growth_progress >= 0.95

    def test_growth_events_emitted(self):
        random.seed(42)
        garden = ZenGarden(5, 7)
        garden.place_succulent(0, 0, HENS_AND_CHICKS)
        all_events = []
        for _ in range(25):
            events = garden.advance_day()
            all_events.extend(events)
        # Should have seen stage transition events
        assert len(all_events) >= 2

    def test_multiple_succulents_grow(self):
        random.seed(42)
        garden = ZenGarden(5, 7)
        garden.place_succulent(0, 0, ECHEVERIA)
        garden.place_succulent(0, 1, ALOE)
        for _ in range(15):
            garden.advance_day()
        assert garden.get_tile(0, 0).growth_progress > 0
        assert garden.get_tile(0, 1).growth_progress > 0


class TestHarmonyScore:
    def test_empty_garden_low_harmony(self):
        garden = ZenGarden(5, 7)
        assert garden.harmony_score() < 20

    def test_balanced_garden_higher_harmony(self):
        garden = ZenGarden(5, 7)
        # Place some succulents and rocks
        garden.place_succulent(1, 1, ECHEVERIA)
        garden.place_succulent(1, 5, JADE_PLANT)
        garden.place_rock(0, 3, GRANITE_BOULDER)
        garden.place_rock(2, 2, RIVER_STONE)
        garden.place_rock(2, 4, MOSS_ROCK)
        # Rake some sand
        garden.rake_tile(3, 1, RakePattern.WAVES)
        garden.rake_tile(3, 2, RakePattern.WAVES)
        garden.rake_tile(3, 3, RakePattern.WAVES)

        score = garden.harmony_score()
        assert score > 20

    def test_harmony_pair_bonus(self):
        garden = ZenGarden(5, 7)
        # Place a known harmony pair adjacent
        garden.place_succulent(1, 1, ECHEVERIA)
        garden.place_rock(1, 2, RIVER_STONE)
        score_with_pair = garden.harmony_score()

        # Compare with non-pair placement
        garden2 = ZenGarden(5, 7)
        garden2.place_succulent(1, 1, ECHEVERIA)
        garden2.place_rock(1, 2, GRANITE_BOULDER)  # not a pair
        score_without_pair = garden2.harmony_score()

        assert score_with_pair >= score_without_pair

    def test_symmetry_detection(self):
        garden = ZenGarden(5, 7)
        # Place symmetrically
        garden.place_rock(0, 0, RIVER_STONE)
        garden.place_rock(0, 6, RIVER_STONE)
        garden.place_succulent(2, 1, ECHEVERIA)
        garden.place_succulent(2, 5, ECHEVERIA)
        symmetry = garden._check_symmetry()
        assert symmetry > 0.5

    def test_harmony_capped_at_100(self):
        garden = ZenGarden(5, 7)
        # Over-fill the garden to test cap
        for r in range(5):
            for c in range(7):
                if (r + c) % 2 == 0:
                    garden.place_succulent(r, c, ECHEVERIA)
                    tile = garden.get_tile(r, c)
                    tile.succulent_stage = SucculentStage.BLOOMING
                else:
                    garden.place_rock(r, c, RIVER_STONE)
        # Lots of stuff placed, should not exceed 100
        assert garden.harmony_score() <= 100

    def test_harmony_description_varies(self):
        garden = ZenGarden(5, 7)
        desc_empty = garden.harmony_description()
        assert "potential" in desc_empty.lower() or "empty" in desc_empty.lower()

        garden.place_succulent(1, 1, ECHEVERIA)
        garden.place_rock(1, 2, RIVER_STONE)
        desc_some = garden.harmony_description()
        assert desc_some != desc_empty


class TestHarmonyPairs:
    def test_known_pairs_exist(self):
        assert frozenset({"Echeveria", "River Stone"}) in HARMONY_PAIRS
        assert frozenset({"Moonstone", "Quartz Crystal"}) in HARMONY_PAIRS

    def test_pair_bonus_positive(self):
        assert HARMONY_PAIR_BONUS > 0


class TestStatusDisplay:
    def test_status_contains_info(self):
        garden = ZenGarden(5, 7)
        garden.place_succulent(1, 1, ECHEVERIA)
        garden.place_rock(0, 3, GRANITE_BOULDER)
        status = garden.status()
        assert "Zen Garden" in status
        assert "Succulents: 1" in status
        assert "Rocks: 1" in status
        assert "Harmony:" in status
