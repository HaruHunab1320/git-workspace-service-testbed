"""
Tests for garden.py — Garden & Farming System
"""

import random

import pytest

from garden import (
    ALL_CROPS,
    COMPANION_PAIRS,
    COMPANION_GROWTH_BONUS,
    SEASONAL_CROPS,
    CropQuality,
    CropType,
    Garden,
    GardenPlot,
    GrowthStage,
    Harvest,
    Season,
    SoilType,
    WeatherEffect,
    STRAWBERRY,
    TULIP,
    PEA,
    BASIL,
    CHAMOMILE,
    TOMATO,
    SUNFLOWER,
    BLUEBERRY,
    PUMPKIN,
    MUSHROOM,
    WINTER_ROSE,
    FROST_MINT,
    MOONBLOOM,
    STARFRUIT,
    CRYSTAL_BERRY,
    WATERMELON,
    _determine_quality,
)


class TestCropType:
    def test_seasonal_availability(self):
        assert STRAWBERRY.can_grow_in(Season.SPRING)
        assert not STRAWBERRY.can_grow_in(Season.WINTER)

    def test_multi_season_crops(self):
        assert BASIL.can_grow_in(Season.SPRING)
        assert BASIL.can_grow_in(Season.SUMMER)
        assert not BASIL.can_grow_in(Season.WINTER)

    def test_all_season_crop(self):
        for s in Season:
            assert CRYSTAL_BERRY.can_grow_in(s)

    def test_magical_flag(self):
        assert MOONBLOOM.is_magical
        assert STARFRUIT.is_magical
        assert CRYSTAL_BERRY.is_magical
        assert not STRAWBERRY.is_magical
        assert not PUMPKIN.is_magical

    def test_regrow_flag(self):
        assert STRAWBERRY.regrows
        assert TOMATO.regrows
        assert not TULIP.regrows
        assert not SUNFLOWER.regrows


class TestCropQuality:
    def test_price_multiplier_ordering(self):
        assert CropQuality.NORMAL.price_multiplier < CropQuality.SILVER.price_multiplier
        assert CropQuality.SILVER.price_multiplier < CropQuality.GOLD.price_multiplier
        assert CropQuality.GOLD.price_multiplier < CropQuality.IRIDESCENT.price_multiplier

    def test_gift_bonus_ordering(self):
        assert CropQuality.NORMAL.gift_bonus < CropQuality.SILVER.gift_bonus
        assert CropQuality.SILVER.gift_bonus < CropQuality.GOLD.gift_bonus
        assert CropQuality.GOLD.gift_bonus < CropQuality.IRIDESCENT.gift_bonus


class TestSeasonalCropCatalogue:
    def test_every_season_has_crops(self):
        for season in Season:
            assert len(SEASONAL_CROPS[season]) > 0

    def test_spring_includes_strawberry(self):
        names = [c.name for c in SEASONAL_CROPS[Season.SPRING]]
        assert "Strawberry" in names

    def test_summer_includes_tomato(self):
        names = [c.name for c in SEASONAL_CROPS[Season.SUMMER]]
        assert "Tomato" in names

    def test_winter_includes_winter_rose(self):
        names = [c.name for c in SEASONAL_CROPS[Season.WINTER]]
        assert "Winter Rose" in names


class TestGardenPlot:
    def test_empty_by_default(self):
        plot = GardenPlot(0, 0)
        assert plot.is_empty
        assert not plot.is_harvestable

    def test_plant_success(self):
        plot = GardenPlot(0, 0)
        msg = plot.plant(STRAWBERRY, Season.SPRING)
        assert "Planted" in msg
        assert not plot.is_empty
        assert plot.stage is GrowthStage.SEED

    def test_plant_wrong_season(self):
        plot = GardenPlot(0, 0)
        msg = plot.plant(STRAWBERRY, Season.WINTER)
        assert "can't be planted" in msg
        assert plot.is_empty

    def test_plant_occupied(self):
        plot = GardenPlot(0, 0)
        plot.plant(STRAWBERRY, Season.SPRING)
        msg = plot.plant(TULIP, Season.SPRING)
        assert "already has" in msg

    def test_water(self):
        plot = GardenPlot(0, 0)
        plot.plant(STRAWBERRY, Season.SPRING)
        msg = plot.water()
        assert "Watered" in msg
        assert plot.watered_today
        assert plot.times_watered == 1

    def test_double_water(self):
        plot = GardenPlot(0, 0)
        plot.plant(STRAWBERRY, Season.SPRING)
        plot.water()
        msg = plot.water()
        assert "already been watered" in msg
        assert plot.times_watered == 1

    def test_water_empty(self):
        plot = GardenPlot(0, 0)
        msg = plot.water()
        assert "Nothing to water" in msg

    def test_clear(self):
        plot = GardenPlot(0, 0)
        plot.plant(STRAWBERRY, Season.SPRING)
        msg = plot.clear()
        assert "Cleared" in msg
        assert plot.is_empty

    def test_clear_empty(self):
        plot = GardenPlot(0, 0)
        msg = plot.clear()
        assert "already empty" in msg

    def test_harvest_not_ready(self):
        plot = GardenPlot(0, 0)
        plot.plant(STRAWBERRY, Season.SPRING)
        assert plot.harvest() is None

    def test_harvest_ready(self):
        plot = GardenPlot(0, 0)
        plot.plant(STRAWBERRY, Season.SPRING)
        plot.stage = GrowthStage.HARVESTABLE
        plot.quality_score = 5.0
        h = plot.harvest()
        assert h is not None
        assert h.crop.name == "Strawberry"
        assert h.quantity >= 1

    def test_regrow_after_harvest(self):
        plot = GardenPlot(0, 0)
        plot.plant(STRAWBERRY, Season.SPRING)
        plot.stage = GrowthStage.HARVESTABLE
        plot.quality_score = 5.0
        h = plot.harvest()
        assert h is not None
        # Strawberry regrows, so plot should reset to GROWING
        assert not plot.is_empty
        assert plot.stage is GrowthStage.GROWING

    def test_non_regrow_clears_after_harvest(self):
        plot = GardenPlot(0, 0)
        plot.plant(TULIP, Season.SPRING)
        plot.stage = GrowthStage.HARVESTABLE
        plot.quality_score = 5.0
        h = plot.harvest()
        assert h is not None
        assert plot.is_empty


class TestHarvest:
    def test_sell_value(self):
        h = Harvest(crop=STRAWBERRY, quality=CropQuality.NORMAL, quantity=1)
        assert h.sell_value == STRAWBERRY.base_sell_price

    def test_sell_value_with_quality(self):
        h = Harvest(crop=STRAWBERRY, quality=CropQuality.GOLD, quantity=1)
        assert h.sell_value > STRAWBERRY.base_sell_price

    def test_display_string(self):
        h = Harvest(crop=TULIP, quality=CropQuality.SILVER, quantity=2)
        assert "Silver" in h.display
        assert "Tulip" in h.display
        assert "2x" in h.display


class TestGarden:
    def test_creation(self):
        garden = Garden(3, 4)
        assert garden.rows == 3
        assert garden.cols == 4
        assert len(garden.all_plots()) == 12

    def test_plant(self):
        garden = Garden(3, 4)
        msg = garden.plant(0, 0, STRAWBERRY)
        assert "Planted" in msg
        assert len(garden.planted_plots()) == 1

    def test_plant_invalid_position(self):
        garden = Garden(3, 4)
        msg = garden.plant(99, 99, STRAWBERRY)
        assert "doesn't exist" in msg

    def test_water_all(self):
        garden = Garden(3, 4)
        garden.plant(0, 0, STRAWBERRY)
        garden.plant(0, 1, PEA)
        msgs = garden.water_all()
        assert len(msgs) == 2
        assert all("Watered" in m for m in msgs)

    def test_water_all_empty(self):
        garden = Garden(3, 4)
        msgs = garden.water_all()
        assert any("Nothing to water" in m for m in msgs)

    def test_advance_day_grows_crops(self):
        random.seed(42)
        garden = Garden(3, 4)
        garden.plant(0, 0, PEA)  # 5 day crop
        # Water and advance several days
        for _ in range(5):
            garden.water_all()
            garden.advance_day(WeatherEffect.SUNNY)
        plot = garden.get_plot(0, 0)
        # Should have progressed past seed stage
        assert plot.stage is not GrowthStage.SEED

    def test_rain_auto_waters(self):
        garden = Garden(3, 4)
        garden.plant(0, 0, STRAWBERRY)
        events = garden.advance_day(WeatherEffect.RAINY)
        assert any("rain waters" in e.lower() for e in events)

    def test_frost_damages_non_winter_crops(self):
        garden = Garden(3, 4)
        garden.season = Season.SPRING
        garden.plant(0, 0, STRAWBERRY)
        events = garden.advance_day(WeatherEffect.FROST, Season.SPRING)
        assert any("frost" in e.lower() for e in events)

    def test_season_mismatch_withers(self):
        garden = Garden(3, 4)
        garden.season = Season.SPRING
        garden.plant(0, 0, STRAWBERRY)
        # Advance to summer — strawberry is spring-only
        events = garden.advance_day(WeatherEffect.SUNNY, Season.SUMMER)
        assert any("withered" in e.lower() for e in events)

    def test_full_growth_cycle(self):
        random.seed(42)
        garden = Garden(3, 4)
        garden.plant(0, 0, PEA)  # 5-day crop
        for _ in range(10):
            garden.water_all()
            garden.advance_day(WeatherEffect.RAINY)
        # With rain bonus + watering, should be harvestable
        harvestable = garden.harvestable_plots()
        assert len(harvestable) >= 1

    def test_harvest_all(self):
        random.seed(42)
        garden = Garden(3, 4)
        garden.plant(0, 0, PEA)
        # Force harvestable
        garden.get_plot(0, 0).stage = GrowthStage.HARVESTABLE
        garden.get_plot(0, 0).quality_score = 5.0
        harvests = garden.harvest_all()
        assert len(harvests) == 1
        assert harvests[0].crop.name == "Pea"

    def test_companion_planting(self):
        garden = Garden(3, 4)
        garden.plant(0, 0, STRAWBERRY)
        garden.plant(0, 1, BASIL)  # companion pair
        plot = garden.get_plot(0, 0)
        assert garden._has_companion(plot)

    def test_no_companion(self):
        garden = Garden(3, 4)
        garden.plant(0, 0, STRAWBERRY)
        garden.plant(0, 1, TULIP)  # not a companion pair
        plot = garden.get_plot(0, 0)
        assert not garden._has_companion(plot)

    def test_status_display(self):
        garden = Garden(3, 4)
        garden.plant(0, 0, STRAWBERRY)
        status = garden.status()
        assert "Garden" in status
        assert "Planted: 1" in status

    def test_seasonal_planting_guide(self):
        garden = Garden(3, 4)
        garden.season = Season.SUMMER
        guide = garden.seasonal_planting_guide()
        assert "Tomato" in guide
        assert "Sunflower" in guide

    def test_magical_weather_boost(self):
        random.seed(42)
        garden = Garden(3, 4)
        garden.plant(0, 0, PEA)
        for _ in range(5):
            garden.water_all()
            garden.advance_day(WeatherEffect.MAGICAL)
        plot = garden.get_plot(0, 0)
        # Magical weather gives 1.5x growth and +2.0 quality
        assert plot.quality_score > 5.0


class TestDetermineQuality:
    def test_low_care_gives_normal(self):
        random.seed(42)
        q = _determine_quality(0.0, SoilType.NORMAL, STRAWBERRY)
        assert q is CropQuality.NORMAL

    def test_high_care_gives_better(self):
        random.seed(42)
        q = _determine_quality(20.0, SoilType.ENRICHED, STRAWBERRY)
        assert q.price_multiplier > CropQuality.NORMAL.price_multiplier

    def test_enchanted_soil_bonus(self):
        random.seed(42)
        q_normal = _determine_quality(5.0, SoilType.NORMAL, STRAWBERRY)
        random.seed(42)
        q_enchanted = _determine_quality(5.0, SoilType.ENCHANTED, STRAWBERRY)
        assert q_enchanted.price_multiplier >= q_normal.price_multiplier


class TestCompanionPairs:
    def test_known_pairs_exist(self):
        assert frozenset({"Strawberry", "Basil"}) in COMPANION_PAIRS
        assert frozenset({"Tomato", "Basil"}) in COMPANION_PAIRS

    def test_growth_bonus_positive(self):
        assert COMPANION_GROWTH_BONUS > 0
