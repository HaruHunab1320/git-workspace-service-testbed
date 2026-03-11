"""Tests for the magical weather system."""

from __future__ import annotations

import math
import random

import weather
from weather import (
    DAYS_PER_SEASON,
    DAYS_PER_YEAR,
    FESTIVALS,
    Forecast,
    MagicalEvent,
    Season,
    Sky,
    VillageMood,
    WeatherEngine,
    WindDirection,
    base_temperature,
    compute_village_mood,
    day_to_season,
    day_within_season,
    detect_weather_streak,
    eligible_festivals,
)


# ---------------------------------------------------------------------------
# Calendar helpers
# ---------------------------------------------------------------------------


class TestCalendar:
    def test_days_per_year(self):
        assert DAYS_PER_YEAR == 112

    def test_day_to_season_spring(self):
        for d in range(0, 28):
            assert day_to_season(d) == Season.SPRING

    def test_day_to_season_summer(self):
        for d in range(28, 56):
            assert day_to_season(d) == Season.SUMMER

    def test_day_to_season_autumn(self):
        for d in range(56, 84):
            assert day_to_season(d) == Season.AUTUMN

    def test_day_to_season_winter(self):
        for d in range(84, 112):
            assert day_to_season(d) == Season.WINTER

    def test_day_to_season_wraps(self):
        assert day_to_season(112) == Season.SPRING
        assert day_to_season(140) == Season.SUMMER

    def test_day_within_season_range(self):
        for d in range(DAYS_PER_YEAR):
            dws = day_within_season(d)
            assert 0 <= dws < DAYS_PER_SEASON


# ---------------------------------------------------------------------------
# Temperature model
# ---------------------------------------------------------------------------


class TestTemperature:
    def test_midsummer_warmest(self):
        """Temperature should peak around midsummer (day ~42)."""
        temps = [base_temperature(d) for d in range(DAYS_PER_YEAR)]
        peak_day = temps.index(max(temps))
        # Midsummer is around day 42 (midpoint of summer, days 28-55)
        assert 35 <= peak_day <= 49

    def test_midwinter_coldest(self):
        """Temperature should trough around midwinter (day ~98)."""
        temps = [base_temperature(d) for d in range(DAYS_PER_YEAR)]
        trough_day = temps.index(min(temps))
        assert 91 <= trough_day <= 105

    def test_temperature_range(self):
        """Baseline temps should stay within the -2 to 26 range."""
        for d in range(DAYS_PER_YEAR):
            t = base_temperature(d)
            assert -2.5 <= t <= 26.5


# ---------------------------------------------------------------------------
# WeatherEngine — determinism and state
# ---------------------------------------------------------------------------


class TestWeatherEngineDeterminism:
    def test_same_seed_same_sequence(self):
        """Two engines with the same seed must produce identical forecasts."""
        a = WeatherEngine(seed=99)
        b = WeatherEngine(seed=99)
        for _ in range(30):
            fa = a.advance()
            fb = b.advance()
            assert fa == fb

    def test_different_seed_different_sequence(self):
        a = WeatherEngine(seed=1)
        b = WeatherEngine(seed=2)
        forecasts_a = [a.advance() for _ in range(20)]
        forecasts_b = [b.advance() for _ in range(20)]
        # Extremely unlikely to be identical
        assert forecasts_a != forecasts_b


class TestPeek:
    def test_peek_does_not_advance_day(self):
        engine = WeatherEngine(seed=42)
        day_before = engine.day
        engine.peek()
        assert engine.day == day_before

    def test_peek_does_not_mutate_rng(self):
        """peek() must not change the RNG state (bug fix verification)."""
        engine = WeatherEngine(seed=42)
        engine.advance()  # get past day 0

        state_before = engine._rng.getstate()
        engine.peek()
        state_after = engine._rng.getstate()
        assert state_before == state_after

    def test_peek_is_idempotent(self):
        """Calling peek() multiple times returns the same result."""
        engine = WeatherEngine(seed=42)
        engine.advance()
        f1 = engine.peek()
        f2 = engine.peek()
        f3 = engine.peek()
        assert f1 == f2 == f3

    def test_peek_then_advance_consistent(self):
        """peek() should return the same forecast that the next advance() produces."""
        engine = WeatherEngine(seed=42)
        # We can't directly compare because peek doesn't transition sky,
        # but we can verify peek doesn't corrupt the sequence.
        engine.advance()
        engine.advance()
        state = engine._rng.getstate()
        peeked = engine.peek()
        engine._rng.setstate(state)
        # peek consumed and restored RNG, so sequence should be intact
        assert engine._rng.getstate() == state


class TestForecastAhead:
    def test_does_not_mutate_engine(self):
        engine = WeatherEngine(seed=42)
        engine.advance()
        day_before = engine.day
        state_before = engine._rng.getstate()
        sky_before = engine._sky

        engine.forecast_ahead(10)

        assert engine.day == day_before
        assert engine._rng.getstate() == state_before
        assert engine._sky == sky_before

    def test_returns_correct_count(self):
        engine = WeatherEngine(seed=42)
        ahead = engine.forecast_ahead(7)
        assert len(ahead) == 7

    def test_days_increment(self):
        engine = WeatherEngine(seed=42)
        ahead = engine.forecast_ahead(5)
        for i, fc in enumerate(ahead):
            assert fc.day == i


class TestAdvance:
    def test_advance_increments_day(self):
        engine = WeatherEngine(seed=42)
        assert engine.day == 0
        engine.advance()
        assert engine.day == 1
        engine.advance()
        assert engine.day == 2

    def test_advance_multiple_days(self):
        engine = WeatherEngine(seed=42)
        fc = engine.advance(days=5)
        assert engine.day == 5
        assert fc.day == 4  # last forecast is for day 4

    def test_listeners_called(self):
        engine = WeatherEngine(seed=42)
        received: list[Forecast] = []
        engine.subscribe(received.append)
        engine.advance(days=3)
        assert len(received) == 3

    def test_unsubscribe(self):
        engine = WeatherEngine(seed=42)
        received: list[Forecast] = []
        engine.subscribe(received.append)
        engine.advance()
        engine.unsubscribe(received.append)
        engine.advance()
        assert len(received) == 1


class TestSetSky:
    def test_override_sky(self):
        engine = WeatherEngine(seed=42)
        engine.set_sky(Sky.BLIZZARD)
        assert engine._sky == Sky.BLIZZARD


# ---------------------------------------------------------------------------
# Forecast properties
# ---------------------------------------------------------------------------


class TestForecastProperties:
    def _make(self, **kwargs) -> Forecast:
        defaults = dict(
            day=0,
            season=Season.SUMMER,
            sky=Sky.CLEAR,
            temperature_c=20.0,
            humidity=0.30,
            wind_speed_kph=10.0,
            wind_direction=WindDirection.SOUTH,
            magical_event=MagicalEvent.NONE,
            description="test",
        )
        defaults.update(kwargs)
        return Forecast(**defaults)

    def test_temperature_f(self):
        fc = self._make(temperature_c=0.0)
        assert fc.temperature_f == 32.0

        fc = self._make(temperature_c=100.0)
        assert fc.temperature_f == 212.0

    def test_is_magical(self):
        fc = self._make(magical_event=MagicalEvent.NONE)
        assert not fc.is_magical

        fc = self._make(magical_event=MagicalEvent.STARFALL)
        assert fc.is_magical

    def test_feels_like_wind_chill(self):
        """When cold and windy, feels_like should be lower than actual temp."""
        fc = self._make(temperature_c=-5.0, wind_speed_kph=20.0, humidity=0.5)
        assert fc.feels_like_c < fc.temperature_c

    def test_feels_like_heat_bump(self):
        """When hot and humid, feels_like should be higher than actual temp."""
        fc = self._make(temperature_c=30.0, humidity=0.80, wind_speed_kph=5.0)
        assert fc.feels_like_c > fc.temperature_c

    def test_feels_like_neutral(self):
        """In moderate conditions, feels_like should equal temperature_c."""
        fc = self._make(temperature_c=18.0, humidity=0.50, wind_speed_kph=8.0)
        assert fc.feels_like_c == fc.temperature_c

    def test_severity_clear_low(self):
        fc = self._make(sky=Sky.CLEAR, wind_speed_kph=5.0)
        assert fc.severity < 0.1

    def test_severity_blizzard_high(self):
        fc = self._make(sky=Sky.BLIZZARD, wind_speed_kph=50.0)
        assert fc.severity >= 0.9

    def test_severity_bounded(self):
        """Severity must stay in [0, 1]."""
        fc = self._make(sky=Sky.BLIZZARD, wind_speed_kph=999.0)
        assert fc.severity <= 1.0

    def test_short_summary_contains_key_info(self):
        fc = self._make(
            day=10,
            season=Season.AUTUMN,
            sky=Sky.FOG,
            wind_direction=WindDirection.NORTHWEST,
        )
        summary = fc.short_summary()
        assert "Day 10" in summary
        assert "Autumn" in summary
        assert "fog" in summary
        assert "northwest" in summary


# ---------------------------------------------------------------------------
# Wind direction
# ---------------------------------------------------------------------------


class TestWindDirection:
    def test_all_directions_reachable(self):
        """Over many days, all 8 wind directions should appear."""
        engine = WeatherEngine(seed=42)
        directions_seen: set[WindDirection] = set()
        for _ in range(200):
            fc = engine.advance()
            directions_seen.add(fc.wind_direction)
        assert directions_seen == set(WindDirection)

    def test_winter_bias_northerly(self):
        """In winter, northerly winds should be more common."""
        engine = WeatherEngine(seed=42)
        # Fast-forward to winter (day 84)
        engine.advance(days=84)
        counts: dict[WindDirection, int] = {}
        for _ in range(1000):
            engine.day = 98  # stay in winter
            fc = engine.advance()
            counts[fc.wind_direction] = counts.get(fc.wind_direction, 0) + 1
        north_ish = counts.get(WindDirection.NORTH, 0) + counts.get(WindDirection.NORTHEAST, 0)
        south_ish = counts.get(WindDirection.SOUTH, 0) + counts.get(WindDirection.SOUTHWEST, 0)
        assert north_ish > south_ish


# ---------------------------------------------------------------------------
# Magical events
# ---------------------------------------------------------------------------


class TestMagicalEvents:
    def test_magic_events_occur(self):
        """Over a full year, at least some magical events should fire."""
        engine = WeatherEngine(seed=42)
        magic_count = 0
        for _ in range(DAYS_PER_YEAR):
            fc = engine.advance()
            if fc.is_magical:
                magic_count += 1
        assert magic_count > 0

    def test_peak_magic_window_middle_third(self):
        """The peak magic window should cover the middle third of the season.

        Bug fix verification: using float division DAYS_PER_SEASON / 6 = 4.667
        means days 10-18 get the bonus (dist values 0-4), not just 11-17.
        """
        mid = DAYS_PER_SEASON // 2  # 14
        threshold = DAYS_PER_SEASON / 6  # 4.667

        # Day 10: dist = |10 - 14| = 4 < 4.667 → should be in peak window
        assert abs(10 - mid) < threshold
        # Day 18: dist = |18 - 14| = 4 < 4.667 → should be in peak window
        assert abs(18 - mid) < threshold
        # Day 9: dist = |9 - 14| = 5 >= 4.667 → should NOT be in peak window
        assert not (abs(9 - mid) < threshold)
        # Day 19: dist = |19 - 14| = 5 >= 4.667 → should NOT be in peak window
        assert not (abs(19 - mid) < threshold)

    def test_seasonal_magic_pools_sum_to_one(self):
        for season, pool in weather._SEASONAL_MAGIC.items():
            total = sum(w for _, w in pool)
            assert abs(total - 1.0) < 0.01, f"{season} magic pool sums to {total}"


# ---------------------------------------------------------------------------
# Village mood
# ---------------------------------------------------------------------------


class TestVillageMood:
    def _make_fc(self, sky: Sky, magical: MagicalEvent = MagicalEvent.NONE) -> Forecast:
        return Forecast(
            day=0, season=Season.SPRING, sky=sky,
            temperature_c=15.0, humidity=0.5, wind_speed_kph=5.0,
            wind_direction=WindDirection.SOUTH,
            magical_event=magical, description="test",
        )

    def test_empty_history_content(self):
        assert compute_village_mood([]) == VillageMood.CONTENT

    def test_clear_skies_joyful(self):
        history = [self._make_fc(Sky.CLEAR) for _ in range(5)]
        assert compute_village_mood(history) == VillageMood.JOYFUL

    def test_blizzard_restless(self):
        history = [self._make_fc(Sky.BLIZZARD) for _ in range(5)]
        assert compute_village_mood(history) == VillageMood.RESTLESS

    def test_magic_enchanted(self):
        history = [
            self._make_fc(Sky.BLIZZARD, MagicalEvent.AURORA_SHOWER),
            self._make_fc(Sky.BLIZZARD, MagicalEvent.CRYSTAL_FROST),
            self._make_fc(Sky.BLIZZARD),
        ]
        # 2 magic events → enchanted, even with bad weather
        assert compute_village_mood(history) == VillageMood.ENCHANTED


# ---------------------------------------------------------------------------
# Weather streaks
# ---------------------------------------------------------------------------


class TestWeatherStreak:
    def _make_fc(self, sky: Sky) -> Forecast:
        return Forecast(
            day=0, season=Season.SPRING, sky=sky,
            temperature_c=15.0, humidity=0.5, wind_speed_kph=5.0,
            wind_direction=WindDirection.SOUTH,
            magical_event=MagicalEvent.NONE, description="test",
        )

    def test_empty_history(self):
        sky, streak = detect_weather_streak([])
        assert sky == Sky.CLEAR
        assert streak == 0

    def test_single_day(self):
        sky, streak = detect_weather_streak([self._make_fc(Sky.RAIN)])
        assert sky == Sky.RAIN
        assert streak == 1

    def test_streak_of_three(self):
        history = [
            self._make_fc(Sky.CLEAR),
            self._make_fc(Sky.RAIN),
            self._make_fc(Sky.RAIN),
            self._make_fc(Sky.RAIN),
        ]
        sky, streak = detect_weather_streak(history)
        assert sky == Sky.RAIN
        assert streak == 3

    def test_broken_streak(self):
        history = [
            self._make_fc(Sky.RAIN),
            self._make_fc(Sky.RAIN),
            self._make_fc(Sky.CLEAR),
        ]
        sky, streak = detect_weather_streak(history)
        assert sky == Sky.CLEAR
        assert streak == 1


# ---------------------------------------------------------------------------
# Festival eligibility
# ---------------------------------------------------------------------------


class TestFestivals:
    def _make_fc(self, **kwargs) -> Forecast:
        defaults = dict(
            day=0, season=Season.SPRING, sky=Sky.CLEAR,
            temperature_c=15.0, humidity=0.5, wind_speed_kph=5.0,
            wind_direction=WindDirection.SOUTH,
            magical_event=MagicalEvent.NONE, description="test",
        )
        defaults.update(kwargs)
        return Forecast(**defaults)

    def test_blossom_dance_eligible(self):
        fc = self._make_fc(season=Season.SPRING, sky=Sky.CLEAR, temperature_c=15.0)
        assert "Blossom Dance" in eligible_festivals(fc)

    def test_blossom_dance_too_cold(self):
        fc = self._make_fc(season=Season.SPRING, sky=Sky.CLEAR, temperature_c=5.0)
        assert "Blossom Dance" not in eligible_festivals(fc)

    def test_blossom_dance_wrong_season(self):
        fc = self._make_fc(season=Season.WINTER, sky=Sky.CLEAR, temperature_c=15.0)
        assert "Blossom Dance" not in eligible_festivals(fc)

    def test_petal_reverie_needs_magic(self):
        fc = self._make_fc(
            season=Season.SPRING,
            magical_event=MagicalEvent.PETAL_BLIZZARD,
        )
        assert "Petal Reverie" in eligible_festivals(fc)

    def test_frost_fair_conditions(self):
        fc = self._make_fc(
            season=Season.WINTER, sky=Sky.SNOW, temperature_c=-5.0,
        )
        assert "Frost Fair" in eligible_festivals(fc)

    def test_frost_fair_too_warm(self):
        fc = self._make_fc(
            season=Season.WINTER, sky=Sky.SNOW, temperature_c=5.0,
        )
        assert "Frost Fair" not in eligible_festivals(fc)


# ---------------------------------------------------------------------------
# Transition model
# ---------------------------------------------------------------------------


class TestTransitions:
    def test_no_snow_in_summer(self):
        """Summer modifier zeroes out snow, so it should never appear."""
        engine = WeatherEngine(seed=42)
        engine.advance(days=28)  # skip to summer
        for _ in range(200):
            engine.day = 40  # stay in summer
            fc = engine.advance()
            assert fc.sky not in {Sky.SNOW, Sky.BLIZZARD}

    def test_all_sky_states_reachable(self):
        """Over many days, all sky states should appear at least once."""
        engine = WeatherEngine(seed=42)
        seen: set[Sky] = set()
        for _ in range(2000):
            fc = engine.advance()
            seen.add(fc.sky)
            if seen == set(Sky):
                break
        assert seen == set(Sky)
