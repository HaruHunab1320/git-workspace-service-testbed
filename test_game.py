"""
Tests for game.py — Unified Game Engine
"""

import random

import pytest

from game import (
    CozyVillageGame,
    DailyReport,
    _SKY_TO_WEATHER_EFFECT,
    _SKY_TO_PET_WEATHER,
)
from villagers import Season, Gift, GiftCategory
from weather import Sky
from garden import (
    STRAWBERRY, BASIL, PEA, TULIP, CHAMOMILE, MUSHROOM,
    CropQuality, Harvest, WeatherEffect,
)
from animals import Species, PetPersonality, BondTier


class TestGameCreation:
    def test_create_default(self):
        game = CozyVillageGame.create_default()
        assert game.day == 0
        assert game.season is Season.SPRING
        assert len(game.village.villagers) == 6

    def test_create_with_seed(self):
        game1 = CozyVillageGame.create_default(seed=42)
        game2 = CozyVillageGame.create_default(seed=42)
        r1 = game1.advance_day()
        r2 = game2.advance_day()
        assert r1.weather_summary == r2.weather_summary


class TestWeatherMapping:
    def test_all_sky_states_mapped_to_weather_effect(self):
        for sky in Sky:
            assert sky in _SKY_TO_WEATHER_EFFECT

    def test_all_sky_states_mapped_to_pet_weather(self):
        for sky in Sky:
            assert sky in _SKY_TO_PET_WEATHER

    def test_thunderstorm_is_stormy(self):
        assert _SKY_TO_WEATHER_EFFECT[Sky.THUNDERSTORM] is WeatherEffect.STORMY

    def test_clear_is_sunny(self):
        assert _SKY_TO_WEATHER_EFFECT[Sky.CLEAR] is WeatherEffect.SUNNY

    def test_rain_is_rainy(self):
        assert _SKY_TO_WEATHER_EFFECT[Sky.RAIN] is WeatherEffect.RAINY


class TestAdvanceDay:
    def test_advances_day_counter(self):
        game = CozyVillageGame.create_default()
        game.advance_day()
        assert game.day == 1

    def test_returns_daily_report(self):
        game = CozyVillageGame.create_default()
        report = game.advance_day()
        assert isinstance(report, DailyReport)
        assert report.day == 1
        assert report.season == "Spring"
        assert len(report.weather_summary) > 0

    def test_weather_description_present(self):
        game = CozyVillageGame.create_default()
        report = game.advance_day()
        assert len(report.weather_description) > 0

    def test_village_mood_present(self):
        game = CozyVillageGame.create_default()
        report = game.advance_day()
        assert report.village_mood in (
            "joyful", "content", "melancholy", "cozy", "enchanted", "restless",
        )

    def test_multiple_days(self):
        game = CozyVillageGame.create_default()
        reports = game.simulate_days(7)
        assert len(reports) == 7
        assert reports[-1].day == 7


class TestGardenIntegration:
    def test_plant_crop(self):
        game = CozyVillageGame.create_default()
        msg = game.plant_crop(0, 0, STRAWBERRY)
        assert "Planted" in msg

    def test_garden_grows_over_time(self):
        random.seed(42)
        game = CozyVillageGame.create_default(seed=42)
        game.plant_crop(0, 0, PEA)  # 5-day crop
        for _ in range(10):
            game.advance_day()
        status = game.garden_status()
        assert "Planted: 1" in status or "Harvestable" in status

    def test_garden_events_in_report(self):
        random.seed(42)
        game = CozyVillageGame.create_default(seed=42)
        game.plant_crop(0, 0, STRAWBERRY)
        game.plant_crop(0, 1, BASIL)
        # Run enough days for growth events
        all_garden_events = []
        for _ in range(10):
            report = game.advance_day()
            all_garden_events.extend(report.garden_events)
        # Should have at least some growth events
        assert len(all_garden_events) > 0

    def test_garden_status(self):
        game = CozyVillageGame.create_default()
        game.plant_crop(0, 0, STRAWBERRY)
        status = game.garden_status()
        assert "Garden" in status


class TestPetIntegration:
    def test_adopt_pet(self):
        game = CozyVillageGame.create_default()
        pet = game.adopt_pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        assert pet.name == "Biscuit"
        assert "Biscuit" in game.pets.pets

    def test_pet_events_in_report(self):
        random.seed(42)
        game = CozyVillageGame.create_default(seed=42)
        game.adopt_pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        all_pet_events = []
        for _ in range(10):
            report = game.advance_day()
            all_pet_events.extend(report.pet_events)
        # Dog should have some events (weather reactions, foraging, greetings)
        assert len(all_pet_events) > 0

    def test_pet_status(self):
        game = CozyVillageGame.create_default()
        game.adopt_pet("Whiskers", Species.CAT, PetPersonality.LAZY)
        status = game.pet_status()
        assert "Whiskers" in status


class TestGiftIntegration:
    def test_give_gift_to_villager(self):
        game = CozyVillageGame.create_default()
        gift = Gift("Daisy", GiftCategory.FLOWER, quality=2)
        result = game.give_gift_to_villager("lily", gift)
        assert result is not None
        assert "Lily" in result

    def test_give_harvest_to_villager(self):
        game = CozyVillageGame.create_default()
        harvest = Harvest(
            crop=STRAWBERRY, quality=CropQuality.GOLD, quantity=1,
        )
        result = game.give_harvest_to_villager("lily", harvest)
        assert result is not None

    def test_harvest_flower_category(self):
        game = CozyVillageGame.create_default()
        harvest = Harvest(
            crop=TULIP, quality=CropQuality.SILVER, quantity=1,
        )
        result = game.give_harvest_to_villager("lily", harvest)
        # Lily is cheerful and loves flowers — should be positive
        assert result is not None

    def test_give_gift_invalid_villager(self):
        game = CozyVillageGame.create_default()
        gift = Gift("Daisy", GiftCategory.FLOWER, quality=2)
        result = game.give_gift_to_villager("nobody", gift)
        assert result is None


class TestFullStatus:
    def test_full_status_includes_sections(self):
        game = CozyVillageGame.create_default()
        game.adopt_pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        game.plant_crop(0, 0, STRAWBERRY)
        game.advance_day()
        status = game.full_status()
        assert "WILLOWBROOK" in status
        assert "Weather" in status
        assert "Villagers" in status
        assert "Garden" in status

    def test_friendship_report(self):
        game = CozyVillageGame.create_default()
        # Run a few days to build some friendships
        for _ in range(5):
            game.advance_day()
        report = game.friendship_report()
        assert isinstance(report, list)


class TestDailyReportRendering:
    def test_render_basic(self):
        report = DailyReport(
            day=1, season="Spring",
            weather_summary="Day 0 | Spring | clear",
            weather_description="Sunshine fills the cobblestones.",
            is_magical=False, magical_event="",
            festivals=[], village_mood="content",
            villager_events=["Lily is tending seedlings."],
            garden_events=["A tiny green shoot pushes through!"],
            pet_events=["Biscuit wags at Lily."],
            harvests=[], found_items=[],
        )
        text = report.render()
        assert "Day 1" in text
        assert "Spring" in text
        assert "Sunshine" in text

    def test_render_with_magic_and_festival(self):
        report = DailyReport(
            day=14, season="Spring",
            weather_summary="Day 14 | Spring | clear",
            weather_description="Petals swirl through the air.",
            is_magical=True, magical_event="petal blizzard",
            festivals=["Blossom Dance"],
            village_mood="enchanted",
            villager_events=[], garden_events=[],
            pet_events=[], harvests=[], found_items=[],
        )
        text = report.render()
        assert "petal blizzard" in text
        assert "Blossom Dance" in text
        assert "enchanted" in text


class TestFullSeasonSimulation:
    def test_28_day_season_runs_without_error(self):
        random.seed(42)
        game = CozyVillageGame.create_default(seed=42)
        game.adopt_pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        game.adopt_pet("Whiskers", Species.CAT, PetPersonality.LAZY)
        game.plant_crop(0, 0, STRAWBERRY)
        game.plant_crop(0, 1, BASIL)
        game.plant_crop(1, 0, PEA)
        game.plant_crop(1, 1, CHAMOMILE)

        reports = game.simulate_days(28)
        assert len(reports) == 28
        # Verify reports are sequential
        for i, r in enumerate(reports, 1):
            assert r.day == i

    def test_systems_interact_over_full_season(self):
        random.seed(42)
        game = CozyVillageGame.create_default(seed=42)
        game.adopt_pet("Bramble", Species.HEDGEHOG, PetPersonality.GENTLE)
        game.plant_crop(0, 0, PEA)

        all_events = {"garden": 0, "pet": 0, "villager": 0}
        for _ in range(28):
            report = game.advance_day()
            all_events["garden"] += len(report.garden_events)
            all_events["pet"] += len(report.pet_events)
            all_events["villager"] += len(report.villager_events)

        # All subsystems should have generated events
        assert all_events["garden"] > 0
        assert all_events["pet"] > 0
        assert all_events["villager"] > 0

    def test_current_weather_property(self):
        game = CozyVillageGame.create_default()
        assert game.current_weather is None
        game.advance_day()
        assert game.current_weather is not None
