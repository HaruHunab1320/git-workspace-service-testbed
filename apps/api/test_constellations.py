"""Tests for the constellation discovery system."""

import pytest
from constellations import (
    ConstellationTracker, ConstellationType, Star, Season,
    CONSTELLATIONS, CONSTELLATION_BY_NAME, serialize_constellation,
)


class TestConstellationData:
    def test_all_constellations_have_valid_data(self):
        for c in CONSTELLATIONS:
            assert c.name
            assert len(c.stars) >= 3
            assert len(c.lines) >= 1
            assert len(c.seasons) >= 1
            assert 1 <= c.difficulty <= 3
            assert c.lore

    def test_all_line_indices_valid(self):
        for c in CONSTELLATIONS:
            for a, b in c.lines:
                assert 0 <= a < len(c.stars), f"{c.name}: line index {a} out of range"
                assert 0 <= b < len(c.stars), f"{c.name}: line index {b} out of range"

    def test_star_positions_in_range(self):
        for c in CONSTELLATIONS:
            for s in c.stars:
                assert 0.0 <= s.x <= 1.0, f"{c.name}: star x={s.x} out of range"
                assert 0.0 <= s.y <= 1.0, f"{c.name}: star y={s.y} out of range"
                assert 0.0 <= s.brightness <= 1.0

    def test_every_season_has_constellations(self):
        for season in Season:
            visible = [c for c in CONSTELLATIONS if season in c.seasons]
            assert len(visible) >= 2, f"Season {season.value} has too few constellations"

    def test_name_lookup(self):
        assert "The Seedling" in CONSTELLATION_BY_NAME
        assert CONSTELLATION_BY_NAME["The Seedling"].difficulty == 1


class TestConstellationTracker:
    def test_visible_by_season(self):
        tracker = ConstellationTracker()
        spring = tracker.visible_constellations(Season.SPRING)
        names = [c.name for c in spring]
        assert "The Seedling" in names
        assert "The Snowflake" not in names

    def test_discover(self):
        tracker = ConstellationTracker()
        msg = tracker.discover("The Seedling", day=5, season=Season.SPRING)
        assert "discovered" in msg.lower() or "Seedling" in msg
        assert tracker.is_discovered("The Seedling")
        assert tracker.total_discovered == 1

    def test_discover_wrong_season(self):
        tracker = ConstellationTracker()
        msg = tracker.discover("The Seedling", day=5, season=Season.WINTER)
        assert "not visible" in msg.lower()
        assert not tracker.is_discovered("The Seedling")

    def test_discover_duplicate(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=5, season=Season.SPRING)
        msg = tracker.discover("The Seedling", day=6, season=Season.SPRING)
        assert "already" in msg.lower()

    def test_discover_unknown(self):
        tracker = ConstellationTracker()
        msg = tracker.discover("Fake Name", day=1, season=Season.SPRING)
        assert "unknown" in msg.lower()

    def test_add_note(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=5, season=Season.SPRING)
        msg = tracker.add_note("The Seedling", "My favorite!")
        assert "saved" in msg.lower()
        assert tracker.discoveries["The Seedling"].player_note == "My favorite!"

    def test_add_note_undiscovered(self):
        tracker = ConstellationTracker()
        msg = tracker.add_note("The Seedling", "note")
        assert "haven't discovered" in msg.lower()

    def test_catalog_summary(self):
        tracker = ConstellationTracker()
        summary = tracker.catalog_summary()
        assert summary["discovered"] == 0
        assert summary["total"] == len(CONSTELLATIONS)
        assert summary["completion"] == 0.0

        tracker.discover("The Seedling", day=1, season=Season.SPRING)
        summary = tracker.catalog_summary()
        assert summary["discovered"] == 1

    def test_completion_fraction(self):
        tracker = ConstellationTracker()
        assert tracker.completion_fraction == 0.0
        for c in CONSTELLATIONS:
            season = c.seasons[0]
            tracker.discover(c.name, day=1, season=season)
        assert tracker.completion_fraction == 1.0


class TestSerialization:
    def test_serialize_discovered(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=3, season=Season.SPRING, note="nice")
        c = CONSTELLATION_BY_NAME["The Seedling"]
        d = tracker.discoveries["The Seedling"]
        data = serialize_constellation(c, discovered=True, discovery=d)
        assert data["discovered"] is True
        assert "stars" in data
        assert "lines" in data
        assert data["lore"]
        assert data["discovered_day"] == 3
        assert data["player_note"] == "nice"

    def test_serialize_undiscovered(self):
        c = CONSTELLATION_BY_NAME["The Seedling"]
        data = serialize_constellation(c, discovered=False)
        assert data["discovered"] is False
        assert "stars" not in data
        assert "hint_stars" in data
        assert len(data["hint_stars"]) == 2
        assert data["lore"] is None
