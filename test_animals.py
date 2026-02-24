"""
Tests for animals.py — Pet & Animal Companion System
"""

import random

import pytest

from animals import (
    BondTier,
    FoundItem,
    Pet,
    PetActivity,
    PetManager,
    PetMood,
    PetPersonality,
    Season,
    Species,
    SpeciesProfile,
    SPECIES_PROFILES,
    create_adoptable_pets,
)


class TestBondTier:
    def test_stranger_at_zero(self):
        assert BondTier.from_points(0) is BondTier.STRANGER

    def test_familiar_threshold(self):
        assert BondTier.from_points(15) is BondTier.FAMILIAR
        assert BondTier.from_points(14) is BondTier.STRANGER

    def test_companion_threshold(self):
        assert BondTier.from_points(40) is BondTier.COMPANION
        assert BondTier.from_points(39) is BondTier.FAMILIAR

    def test_devoted_threshold(self):
        assert BondTier.from_points(80) is BondTier.DEVOTED

    def test_soulbound_threshold(self):
        assert BondTier.from_points(120) is BondTier.SOULBOUND
        assert BondTier.from_points(999) is BondTier.SOULBOUND

    def test_ordering(self):
        tiers = [BondTier.from_points(p) for p in [0, 15, 40, 80, 120]]
        assert tiers == [
            BondTier.STRANGER, BondTier.FAMILIAR, BondTier.COMPANION,
            BondTier.DEVOTED, BondTier.SOULBOUND,
        ]


class TestSpeciesProfiles:
    def test_all_species_have_profiles(self):
        for species in Species:
            assert species in SPECIES_PROFILES

    def test_profile_data_completeness(self):
        for species, profile in SPECIES_PROFILES.items():
            assert profile.species is species
            assert len(profile.description) > 0
            assert len(profile.forage_categories) > 0
            assert 0.0 < profile.base_forage_chance <= 1.0
            assert profile.sleep_hours > 0


class TestPet:
    def test_creation(self):
        pet = Pet("Whiskers", Species.CAT, PetPersonality.LAZY)
        assert pet.name == "Whiskers"
        assert pet.species is Species.CAT
        assert pet.personality is PetPersonality.LAZY
        assert pet.bond_points == 0
        assert pet.bond_tier is BondTier.STRANGER

    def test_pet_action(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        msg = pet.pet()
        assert isinstance(msg, str)
        assert pet.bond_points > 0
        assert pet.times_pet_today == 1

    def test_pet_limit_per_day(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        for _ in range(3):
            pet.pet()
        msg = pet.pet()
        assert "all petted out" in msg
        assert pet.times_pet_today == 3

    def test_feed(self):
        pet = Pet("Clover", Species.RABBIT, PetPersonality.CURIOUS)
        pet.energy = 50
        msg = pet.feed("carrot")
        assert "munches" in msg
        assert pet.energy == 80
        assert pet.fed_today

    def test_feed_twice(self):
        pet = Pet("Clover", Species.RABBIT, PetPersonality.CURIOUS)
        pet.feed()
        msg = pet.feed()
        assert "isn't hungry" in msg

    def test_play(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.PLAYFUL)
        msg = pet.play()
        assert isinstance(msg, str)
        assert pet.bond_points > 0
        assert pet.energy < 100

    def test_play_tired(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.PLAYFUL)
        pet.energy = 5
        msg = pet.play()
        assert "too tired" in msg

    def test_playful_bonus(self):
        random.seed(42)
        playful = Pet("A", Species.DOG, PetPersonality.PLAYFUL)
        playful.play()
        lazy = Pet("B", Species.DOG, PetPersonality.LAZY)
        lazy.play()
        # Playful pets earn more bond points from play
        assert playful.bond_points >= lazy.bond_points

    def test_forage_returns_item_or_none(self):
        random.seed(42)
        pet = Pet("Bramble", Species.HEDGEHOG, PetPersonality.GENTLE)
        results = [pet.forage(Season.SPRING) for _ in range(20)]
        # At least one should find something
        found = [r for r in results if r is not None]
        assert len(found) > 0
        assert all(isinstance(i, FoundItem) for i in found)

    def test_forage_costs_energy(self):
        pet = Pet("Bramble", Species.HEDGEHOG, PetPersonality.GENTLE)
        starting_energy = pet.energy
        pet.forage(Season.SPRING)
        assert pet.energy < starting_energy

    def test_forage_fails_when_exhausted(self):
        pet = Pet("Bramble", Species.HEDGEHOG, PetPersonality.GENTLE)
        pet.energy = 5
        assert pet.forage(Season.SPRING) is None

    def test_weather_reaction_favourite(self):
        pet = Pet("Whiskers", Species.CAT, PetPersonality.LAZY)
        # Cat's favourite weather is sunny
        msg = pet.react_to_weather("sunny")
        assert isinstance(msg, str)
        assert pet.activity is PetActivity.PLAYING

    def test_weather_reaction_disliked(self):
        pet = Pet("Whiskers", Species.CAT, PetPersonality.LAZY)
        # Cat dislikes rain
        msg = pet.react_to_weather("rainy")
        assert isinstance(msg, str)
        assert pet.activity is PetActivity.SHELTERING

    def test_greet_villager(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        desc, bonus = pet.greet_villager("Lily")
        assert "Lily" in desc
        assert bonus >= 1  # dogs always give at least 1

    def test_dog_friendship_bonus_higher(self):
        dog = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        cat = Pet("Whiskers", Species.CAT, PetPersonality.LAZY)
        random.seed(42)
        _, dog_bonus = dog.greet_villager("Lily")
        random.seed(42)
        _, cat_bonus = cat.greet_villager("Lily")
        assert dog_bonus >= cat_bonus

    def test_favourite_villager_bonus(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        pet.favourite_villager = "Hazel"
        _, bonus_fav = pet.greet_villager("Hazel")
        _, bonus_other = pet.greet_villager("Ridge")
        assert bonus_fav > bonus_other

    def test_start_new_day(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        pet.pet()
        pet.feed()
        pet.energy = 50
        pet.start_new_day()
        assert pet.times_pet_today == 0
        assert not pet.fed_today
        assert pet.energy == 90  # 50 + 40
        assert pet.days_owned == 1

    def test_status_display(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        status = pet.status()
        assert "Biscuit" in status
        assert "dog" in status
        assert "loyal" in status

    def test_bond_tier_property(self):
        pet = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        assert pet.bond_tier is BondTier.STRANGER
        pet.bond_points = 50
        assert pet.bond_tier is BondTier.COMPANION


class TestPetManager:
    def test_adopt(self):
        manager = PetManager()
        pet = manager.adopt("Biscuit", Species.DOG, PetPersonality.LOYAL)
        assert pet.name == "Biscuit"
        assert "Biscuit" in manager.pets
        assert len(manager.adoption_log) == 1

    def test_adopt_duplicate_name(self):
        manager = PetManager()
        manager.adopt("Biscuit", Species.DOG, PetPersonality.LOYAL)
        with pytest.raises(ValueError, match="already exists"):
            manager.adopt("Biscuit", Species.CAT, PetPersonality.LAZY)

    def test_get_pet(self):
        manager = PetManager()
        manager.adopt("Biscuit", Species.DOG, PetPersonality.LOYAL)
        assert manager.get_pet("Biscuit") is not None
        assert manager.get_pet("Ghost") is None

    def test_advance_day(self):
        random.seed(42)
        manager = PetManager()
        manager.adopt("Biscuit", Species.DOG, PetPersonality.LOYAL)
        events = manager.advance_day(
            Season.SPRING, "sunny", ["Lily", "Gruff"],
        )
        assert isinstance(events, list)
        assert manager.day == 1

    def test_advance_day_multiple_pets(self):
        random.seed(42)
        manager = PetManager()
        manager.adopt("Biscuit", Species.DOG, PetPersonality.LOYAL)
        manager.adopt("Whiskers", Species.CAT, PetPersonality.LAZY)
        events = manager.advance_day(
            Season.SPRING, "sunny", ["Lily", "Gruff", "Fern"],
        )
        assert isinstance(events, list)

    def test_all_found_items(self):
        random.seed(42)
        manager = PetManager()
        manager.adopt("Biscuit", Species.DOG, PetPersonality.LOYAL)
        # Run several days to accumulate items
        for _ in range(20):
            manager.advance_day(Season.SPRING, "sunny", ["Lily"])
        items = manager.all_found_items()
        # Should have found at least something in 20 days
        assert len(items) > 0
        for pet_name, item in items:
            assert pet_name == "Biscuit"
            assert isinstance(item, FoundItem)

    def test_status_report_empty(self):
        manager = PetManager()
        report = manager.status_report()
        assert "No pets" in report

    def test_status_report_with_pets(self):
        manager = PetManager()
        manager.adopt("Biscuit", Species.DOG, PetPersonality.LOYAL)
        report = manager.status_report()
        assert "Biscuit" in report
        assert "Pet Companions" in report


class TestFoundItem:
    def test_value_by_rarity(self):
        common = FoundItem("Stick", "stick", "common", "A stick.")
        uncommon = FoundItem("Branch", "stick", "uncommon", "A branch.")
        rare = FoundItem("Fossil", "stick", "rare", "A fossil.")
        assert common.value < uncommon.value < rare.value


class TestAdoptablePets:
    def test_catalogue_not_empty(self):
        catalogue = create_adoptable_pets()
        assert len(catalogue) >= 6

    def test_catalogue_has_all_species(self):
        catalogue = create_adoptable_pets()
        species_set = {entry["species"] for entry in catalogue}
        assert Species.CAT in species_set
        assert Species.DOG in species_set
        assert Species.RABBIT in species_set
        assert Species.OWL in species_set
        assert Species.FOX in species_set
        assert Species.HEDGEHOG in species_set

    def test_catalogue_entries_complete(self):
        for entry in create_adoptable_pets():
            assert "name" in entry
            assert "species" in entry
            assert "personality" in entry
            assert "bio" in entry


class TestMultiDaySimulation:
    def test_bond_grows_over_time(self):
        random.seed(42)
        pet = Pet("Biscuit", Species.DOG, PetPersonality.LOYAL)
        for _ in range(30):
            pet.start_new_day()
            pet.pet()
            pet.pet()
            pet.feed()
            pet.play()
        # After 30 days of full interaction, should be past Stranger
        assert pet.bond_tier is not BondTier.STRANGER
        assert pet.days_owned == 30

    def test_foraging_accumulates_items(self):
        random.seed(42)
        pet = Pet("Bramble", Species.HEDGEHOG, PetPersonality.GENTLE)
        for _ in range(50):
            pet.start_new_day()
            pet.forage(Season.SPRING)
        assert len(pet.found_items) > 0
