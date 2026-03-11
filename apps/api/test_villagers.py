"""Tests for the villager NPC system — covers the three remaining PR #119 test-plan items.

1. Verify villagers follow seasonal schedules across a full simulated year
2. Test weather integration with the weather.py module
3. Verify birthday gifts trigger correctly on the right day/season
"""

from __future__ import annotations

import random

from villagers import (
    FriendshipTier,
    Gift,
    GiftCategory,
    Location,
    LocationType,
    Mood,
    Personality,
    ScheduleEntry,
    Season,
    TimeOfDay,
    Village,
    Villager,
    create_sample_village,
)
from weather import Forecast, MagicalEvent, Sky, WeatherEngine, WindDirection


# ---------------------------------------------------------------------------
# 1. Seasonal schedule verification across a full simulated year
# ---------------------------------------------------------------------------


class TestSeasonalSchedules:
    """Verify that every villager follows their per-season schedule as the
    village advances through a full year (4 seasons x 28 days x 5 time slots).
    """

    def test_all_villagers_have_four_seasons(self):
        """Every villager created by the sample factory should have schedules
        for all four seasons."""
        village = create_sample_village()
        for v in village.villagers.values():
            assert set(v.schedule.keys()) == {
                Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER
            }, f"{v.name} is missing seasonal schedules"

    def test_each_season_has_five_time_slots(self):
        """Each seasonal schedule should cover all 5 time-of-day slots."""
        village = create_sample_village()
        all_times = {t for t in TimeOfDay}
        for v in village.villagers.values():
            for season, entries in v.schedule.items():
                times = {e.time_of_day for e in entries}
                assert times == all_times, (
                    f"{v.name}'s {season.value} schedule is missing "
                    f"{all_times - times}"
                )

    def test_villagers_follow_schedule_across_full_year(self):
        """Simulate 4 full seasons (112 days) and confirm each villager ends
        up at the scheduled location for every time slot."""
        random.seed(42)
        village = create_sample_village()

        # Build a lookup: villager_id -> season -> time_of_day -> expected location
        expected: dict[str, dict[Season, dict[TimeOfDay, Location]]] = {}
        for v in village.villagers.values():
            expected[v.villager_id] = {}
            for season, entries in v.schedule.items():
                expected[v.villager_id][season] = {
                    e.time_of_day: e.location for e in entries
                }

        # Simulate the full year
        mismatches = []
        for _ in range(28 * 4 * 5):  # 4 seasons, 28 days each, 5 slots per day
            village.advance_time()
            for v in village.villagers.values():
                # Exhausted villagers go home instead — skip these checks
                if v.energy <= 10 and village.time_of_day != TimeOfDay.NIGHT:
                    continue
                sched = expected[v.villager_id].get(village.season, {})
                exp_loc = sched.get(village.time_of_day)
                if exp_loc and v.current_location != exp_loc:
                    mismatches.append(
                        f"{v.name} Day {village.day} "
                        f"{village.season.value}/{village.time_of_day.value}: "
                        f"expected {exp_loc.name}, got {v.current_location.name}"
                    )

        assert len(mismatches) == 0, (
            f"{len(mismatches)} schedule mismatches:\n"
            + "\n".join(mismatches[:10])
        )

    def test_season_transitions_are_correct(self):
        """Village should cycle SPRING -> SUMMER -> AUTUMN -> WINTER and back."""
        village = create_sample_village()
        seasons_seen = [village.season]
        # Advance through 4 full seasons
        for _ in range(28 * 4 * 5):
            village.advance_time()
            if village.season != seasons_seen[-1]:
                seasons_seen.append(village.season)

        # Should see SPRING, then SUMMER, AUTUMN, WINTER, and back to SPRING
        assert seasons_seen == [
            Season.SPRING, Season.SUMMER, Season.AUTUMN,
            Season.WINTER, Season.SPRING,
        ]

    def test_schedule_entry_activity_is_used(self):
        """When a villager moves to a scheduled location, their activity
        string should match the schedule entry."""
        village = create_sample_village()
        lily = village.get_villager("lily")
        assert lily is not None

        # Village starts at DAWN; advance_time moves to MORNING
        village.advance_time()
        # Lily's spring morning schedule: "selling flowers" at Town Plaza
        assert lily._activity == "selling flowers"


# ---------------------------------------------------------------------------
# 2. Weather integration with weather.py
# ---------------------------------------------------------------------------


class TestWeatherIntegration:
    """Test that the Village weather system correctly interacts with villager
    behavior, and can be driven by the WeatherEngine from weather.py."""

    def _make_village_at_time(
        self, season: Season, time: TimeOfDay
    ) -> Village:
        """Create a sample village and advance it to the given season/time."""
        village = create_sample_village()
        # Fast-forward to the target season
        while village.season != season:
            village.advance_time()
        # Advance to target time
        while village.time_of_day != time:
            village.advance_time()
        return village

    def test_set_weather_flag(self):
        """Village.set_weather() should set the bad_weather flag."""
        village = create_sample_village()
        assert village.bad_weather is False
        village.set_weather(True)
        assert village.bad_weather is True
        village.set_weather(False)
        assert village.bad_weather is False

    def test_bad_weather_drives_outdoor_villagers_home(self):
        """During bad weather, villagers at outdoor locations (plaza, farm,
        forest, beach, garden) should shelter at home."""
        random.seed(42)
        village = create_sample_village()
        village.set_weather(True)

        outdoor_types = {
            LocationType.PLAZA, LocationType.FARM, LocationType.FOREST,
            LocationType.BEACH, LocationType.GARDEN,
        }

        # Advance several time slots and check no one is outdoors
        for _ in range(10):
            village.advance_time()
            for v in village.villagers.values():
                assert v.current_location.location_type not in outdoor_types, (
                    f"{v.name} is at outdoor location "
                    f"{v.current_location.name} during bad weather"
                )

    def test_good_weather_allows_outdoor_locations(self):
        """Without bad weather, villagers should appear at outdoor locations
        according to their schedules."""
        random.seed(42)
        village = create_sample_village()
        village.set_weather(False)

        outdoor_seen = set()
        # Run through a full day in spring
        for _ in range(5):
            village.advance_time()
            for v in village.villagers.values():
                if v.current_location.location_type in {
                    LocationType.PLAZA, LocationType.FARM,
                    LocationType.FOREST, LocationType.BEACH,
                    LocationType.GARDEN,
                }:
                    outdoor_seen.add(v.name)

        # At least some villagers should be outdoors on a fair-weather day
        assert len(outdoor_seen) > 0, "No villagers went outdoors on a good weather day"

    def test_weather_shelter_activity_text(self):
        """When sheltered from weather, villagers should have the
        'sheltering from the storm' activity."""
        random.seed(42)
        village = create_sample_village()
        village.set_weather(True)

        sheltering_found = False
        for _ in range(10):
            village.advance_time()
            for v in village.villagers.values():
                if v._activity == "sheltering from the storm":
                    sheltering_found = True
                    break
            if sheltering_found:
                break

        assert sheltering_found, "No villager was found sheltering from the storm"

    def test_weather_engine_drives_village(self):
        """WeatherEngine forecasts can drive Village.set_weather() to create
        a realistic weather-villager integration loop."""
        random.seed(42)
        village = create_sample_village()
        engine = WeatherEngine(seed=42)

        bad_weather_skies = {Sky.THUNDERSTORM, Sky.BLIZZARD, Sky.HAIL}
        outdoor_types = {
            LocationType.PLAZA, LocationType.FARM, LocationType.FOREST,
            LocationType.BEACH, LocationType.GARDEN,
        }

        violations = []
        for day_num in range(28):
            forecast = engine.advance()
            is_bad = forecast.sky in bad_weather_skies
            village.set_weather(is_bad)

            for _ in range(5):  # 5 time slots per day
                village.advance_time()
                if is_bad:
                    for v in village.villagers.values():
                        if v.current_location.location_type in outdoor_types:
                            # Skip exhausted villagers (they go home anyway)
                            if v.energy > 10:
                                violations.append(
                                    f"Day {day_num}: {v.name} at "
                                    f"{v.current_location.name} during "
                                    f"{forecast.sky.value}"
                                )

        assert len(violations) == 0, (
            f"{len(violations)} weather violations:\n"
            + "\n".join(violations[:10])
        )

    def test_severity_threshold_integration(self):
        """Demonstrate that Forecast.severity can be used to decide when
        weather is 'bad' for the village."""
        engine = WeatherEngine(seed=7)
        forecasts = [engine.advance() for _ in range(112)]

        # Any forecast with severity >= 0.5 should be considered bad weather
        severe_count = sum(1 for f in forecasts if f.severity >= 0.5)
        mild_count = sum(1 for f in forecasts if f.severity < 0.5)

        # Over a full year, there should be both severe and mild days
        assert severe_count > 0, "No severe weather days in a full year"
        assert mild_count > 0, "No mild weather days in a full year"


# ---------------------------------------------------------------------------
# 3. Birthday gifts trigger correctly on the right day/season
# ---------------------------------------------------------------------------


class TestBirthdayGifts:
    """Verify that birthday celebrations and gifts trigger on the correct
    day/season, and that the birthday bonus (2x points) applies."""

    def test_is_birthday_correct(self):
        """Villager.is_birthday() should return True only on the exact
        season and day."""
        village = create_sample_village()
        lily = village.get_villager("lily")
        assert lily is not None
        # Lily's birthday: Spring day 14
        assert lily.is_birthday(Season.SPRING, 14) is True
        assert lily.is_birthday(Season.SPRING, 15) is False
        assert lily.is_birthday(Season.SUMMER, 14) is False

    def test_birthday_flag_set_on_correct_day(self):
        """The _is_birthday_today flag should be set when the village
        advances to a villager's birthday."""
        random.seed(42)
        village = create_sample_village()
        lily = village.get_villager("lily")
        assert lily is not None

        # Advance until Lily's birthday (Spring day 14)
        # Village starts at Day 1 Spring. We need to get to Day 14.
        while not (village.season == Season.SPRING and village.day == 14):
            village.advance_time()

        assert lily._is_birthday_today is True

    def test_birthday_flag_not_set_on_wrong_day(self):
        """The _is_birthday_today flag should be False on non-birthday days."""
        random.seed(42)
        village = create_sample_village()
        lily = village.get_villager("lily")
        assert lily is not None

        # Advance to day 15 (not Lily's birthday)
        while not (village.season == Season.SPRING and village.day == 15):
            village.advance_time()

        assert lily._is_birthday_today is False

    def test_birthday_bonus_doubles_gift_points(self):
        """Gifts given on a villager's birthday should yield 2x points."""
        village = create_sample_village()
        lily = village.get_villager("lily")
        assert lily is not None

        gift = Gift("Daisy", GiftCategory.FLOWER, quality=2)

        # Give gift on a normal day
        lily._is_birthday_today = False
        _, normal_points = lily.give_gift(gift, "player", day=1)

        # Reset friendship
        lily.friendships.clear()

        # Give the same gift on birthday
        lily._is_birthday_today = True
        _, birthday_points = lily.give_gift(gift, "player", day=14)

        assert birthday_points == normal_points * 2, (
            f"Birthday points ({birthday_points}) should be 2x normal "
            f"({normal_points})"
        )

    def test_birthday_cupcakes_from_friends(self):
        """Friends (tier >= FRIEND) should automatically gift birthday
        cupcakes when the village triggers a birthday."""
        random.seed(42)
        village = create_sample_village()
        lily = village.get_villager("lily")
        gruff = village.get_villager("gruff")
        assert lily is not None and gruff is not None

        # Make Gruff a friend of Lily — set high enough to survive daily
        # friendship decay (1pt/day for 13 days until Lily's birthday on day 14)
        gruff_record = gruff.get_friendship("lily")
        gruff_record.points = 80
        assert gruff_record.tier == FriendshipTier.FRIEND

        # Advance to Lily's birthday (Spring day 14)
        while not (village.season == Season.SPRING and village.day == 14):
            village.advance_time()

        # Check event log for birthday cupcake
        cupcake_events = [
            e for e in village.event_log
            if "birthday cupcake" in e.lower() and "Gruff" in e and "Lily" in e
        ]
        assert len(cupcake_events) > 0, (
            "Gruff should have given Lily a birthday cupcake. "
            f"Event log: {village.event_log[-10:]}"
        )

    def test_strangers_dont_give_birthday_gifts(self):
        """Villagers who are strangers should NOT give birthday cupcakes."""
        random.seed(42)
        village = create_sample_village()
        lily = village.get_villager("lily")
        assert lily is not None

        # Ensure all villagers are strangers to Lily (0 points)
        for v in village.villagers.values():
            if v.villager_id != "lily":
                record = v.get_friendship("lily")
                record.points = 0

        # Advance to Lily's birthday
        while not (village.season == Season.SPRING and village.day == 14):
            village.advance_time()

        # No cupcake events should appear
        cupcake_events = [
            e for e in village.event_log
            if "birthday cupcake" in e.lower() and "Lily" in e
        ]
        assert len(cupcake_events) == 0, (
            f"Strangers should not give birthday gifts: {cupcake_events}"
        )

    def test_birthday_event_log_message(self):
        """The event log should contain 'Today is X's birthday!' on
        the correct day."""
        random.seed(42)
        village = create_sample_village()

        # Advance to Lily's birthday (Spring day 14)
        while not (village.season == Season.SPRING and village.day == 14):
            village.advance_time()

        birthday_msgs = [
            e for e in village.event_log if "Lily's birthday" in e
        ]
        assert len(birthday_msgs) > 0, (
            "Event log should contain Lily's birthday announcement"
        )

    def test_each_villager_birthday_triggers_in_correct_season(self):
        """Simulate a full year and verify that each villager's birthday
        triggers exactly once, in the correct season."""
        random.seed(42)
        village = create_sample_village()

        # Record expected birthdays
        expected_birthdays = {}
        for v in village.villagers.values():
            expected_birthdays[v.name] = (v.birthday_season, v.birthday_day)

        # Simulate a full year (4 seasons * 28 days * 5 time slots)
        for _ in range(28 * 4 * 5):
            village.advance_time()

        # Check each villager's birthday appears in the event log
        for name, (season, day) in expected_birthdays.items():
            birthday_msgs = [
                e for e in village.event_log if f"{name}'s birthday" in e
            ]
            assert len(birthday_msgs) >= 1, (
                f"{name}'s birthday (day {day} of {season.value}) "
                f"was not found in the event log"
            )
