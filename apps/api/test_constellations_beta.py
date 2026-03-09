"""
Comprehensive unit tests for the Constellation Gazer feature (beta).

Covers: data model invariants, Star/ConstellationType/DiscoveredConstellation
dataclasses, ConstellationTracker edge cases, serialization edge cases,
multi-season constellations, discovery message content, note overwrite
behavior, catalog math, and API endpoint integration tests.
"""

import pytest
from dataclasses import FrozenInstanceError
from fastapi.testclient import TestClient

from constellations import (
    ConstellationTracker,
    ConstellationType,
    DiscoveredConstellation,
    Star,
    Season,
    CONSTELLATIONS,
    CONSTELLATION_BY_NAME,
    serialize_constellation,
)


# ---------------------------------------------------------------------------
# Data model tests — Star
# ---------------------------------------------------------------------------

class TestStar:
    def test_star_default_brightness(self):
        s = Star(0.5, 0.5)
        assert s.brightness == 1.0

    def test_star_custom_brightness(self):
        s = Star(0.1, 0.2, 0.3)
        assert s.x == 0.1
        assert s.y == 0.2
        assert s.brightness == 0.3

    def test_star_is_frozen(self):
        s = Star(0.5, 0.5)
        with pytest.raises(FrozenInstanceError):
            s.x = 0.9

    def test_star_equality(self):
        a = Star(0.5, 0.5, 0.8)
        b = Star(0.5, 0.5, 0.8)
        assert a == b

    def test_star_inequality(self):
        a = Star(0.5, 0.5, 0.8)
        b = Star(0.5, 0.5, 0.9)
        assert a != b


# ---------------------------------------------------------------------------
# Data model tests — ConstellationType
# ---------------------------------------------------------------------------

class TestConstellationType:
    def test_constellation_type_is_frozen(self):
        c = CONSTELLATIONS[0]
        with pytest.raises(FrozenInstanceError):
            c.name = "changed"

    def test_constellation_type_default_difficulty(self):
        ct = ConstellationType(
            name="Test",
            stars=(Star(0.1, 0.1), Star(0.2, 0.2), Star(0.3, 0.3)),
            lines=((0, 1), (1, 2)),
            seasons=(Season.SPRING,),
            lore="Test lore",
        )
        assert ct.difficulty == 1

    def test_all_constellation_names_unique(self):
        names = [c.name for c in CONSTELLATIONS]
        assert len(names) == len(set(names))

    def test_constellation_count_is_twelve(self):
        assert len(CONSTELLATIONS) == 12

    def test_constellation_by_name_matches_list(self):
        assert len(CONSTELLATION_BY_NAME) == len(CONSTELLATIONS)
        for c in CONSTELLATIONS:
            assert CONSTELLATION_BY_NAME[c.name] is c

    def test_no_self_referencing_lines(self):
        for c in CONSTELLATIONS:
            for a, b in c.lines:
                assert a != b, f"{c.name}: line ({a}, {b}) connects a star to itself"

    def test_no_duplicate_lines(self):
        for c in CONSTELLATIONS:
            normalized = set()
            for a, b in c.lines:
                edge = (min(a, b), max(a, b))
                assert edge not in normalized, f"{c.name}: duplicate line {edge}"
                normalized.add(edge)


# ---------------------------------------------------------------------------
# Data model tests — DiscoveredConstellation
# ---------------------------------------------------------------------------

class TestDiscoveredConstellation:
    def test_default_note_empty(self):
        d = DiscoveredConstellation(name="X", discovered_day=1, discovered_season="spring")
        assert d.player_note == ""

    def test_mutable_note(self):
        d = DiscoveredConstellation(name="X", discovered_day=1, discovered_season="spring")
        d.player_note = "updated"
        assert d.player_note == "updated"


# ---------------------------------------------------------------------------
# Season enum tests
# ---------------------------------------------------------------------------

class TestSeason:
    def test_season_values(self):
        assert Season.SPRING.value == "spring"
        assert Season.SUMMER.value == "summer"
        assert Season.AUTUMN.value == "autumn"
        assert Season.WINTER.value == "winter"

    def test_season_is_str(self):
        for s in Season:
            assert isinstance(s, str)
            assert s == s.value


# ---------------------------------------------------------------------------
# Catalog data integrity — deeper checks
# ---------------------------------------------------------------------------

class TestCatalogIntegrity:
    def test_each_season_has_at_least_three_constellations(self):
        for season in Season:
            visible = [c for c in CONSTELLATIONS if season in c.seasons]
            assert len(visible) >= 3, f"{season.value} has only {len(visible)} constellations"

    def test_multi_season_constellations_exist(self):
        multi = [c for c in CONSTELLATIONS if len(c.seasons) > 1]
        assert len(multi) >= 1, "Expected at least one multi-season constellation"

    def test_all_difficulty_levels_represented(self):
        difficulties = {c.difficulty for c in CONSTELLATIONS}
        assert difficulties == {1, 2, 3}

    def test_every_constellation_has_lore(self):
        for c in CONSTELLATIONS:
            assert len(c.lore) >= 20, f"{c.name}: lore is too short"

    def test_brightness_values_are_nonzero(self):
        for c in CONSTELLATIONS:
            for s in c.stars:
                assert s.brightness > 0, f"{c.name}: star has zero brightness"


# ---------------------------------------------------------------------------
# ConstellationTracker — advanced scenarios
# ---------------------------------------------------------------------------

class TestTrackerAdvanced:
    def test_visible_returns_multi_season_constellations(self):
        tracker = ConstellationTracker()
        # The Blossom is in both spring and summer
        spring = tracker.visible_constellations(Season.SPRING)
        summer = tracker.visible_constellations(Season.SUMMER)
        spring_names = {c.name for c in spring}
        summer_names = {c.name for c in summer}
        assert "The Blossom" in spring_names
        assert "The Blossom" in summer_names

    def test_visible_each_season_returns_only_correct_constellations(self):
        tracker = ConstellationTracker()
        for season in Season:
            visible = tracker.visible_constellations(season)
            for c in visible:
                assert season in c.seasons, f"{c.name} should not be visible in {season.value}"

    def test_discover_returns_lore(self):
        tracker = ConstellationTracker()
        msg = tracker.discover("The Seedling", day=1, season=Season.SPRING)
        seedling = CONSTELLATION_BY_NAME["The Seedling"]
        assert seedling.lore in msg

    def test_discover_with_note(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=1, season=Season.SPRING, note="Beautiful!")
        assert tracker.discoveries["The Seedling"].player_note == "Beautiful!"

    def test_discover_records_day_and_season(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=7, season=Season.SPRING)
        d = tracker.discoveries["The Seedling"]
        assert d.discovered_day == 7
        assert d.discovered_season == "spring"

    def test_discover_wrong_season_suggests_correct_seasons(self):
        tracker = ConstellationTracker()
        msg = tracker.discover("The Snowflake", day=1, season=Season.SUMMER)
        assert "winter" in msg.lower()

    def test_discover_multi_season_in_any_valid_season(self):
        # The Blossom is visible in spring and summer
        tracker = ConstellationTracker()
        msg = tracker.discover("The Blossom", day=1, season=Season.SUMMER)
        assert "discovered" in msg.lower() or "Blossom" in msg
        assert tracker.is_discovered("The Blossom")

    def test_discover_multi_season_blocked_in_wrong_season(self):
        # The Blossom is spring+summer, not autumn
        tracker = ConstellationTracker()
        msg = tracker.discover("The Blossom", day=1, season=Season.AUTUMN)
        assert "not visible" in msg.lower()

    def test_add_note_overwrites_previous(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=1, season=Season.SPRING, note="first")
        tracker.add_note("The Seedling", "second")
        assert tracker.discoveries["The Seedling"].player_note == "second"

    def test_add_note_with_empty_string(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=1, season=Season.SPRING, note="something")
        tracker.add_note("The Seedling", "")
        assert tracker.discoveries["The Seedling"].player_note == ""

    def test_add_note_unknown_constellation(self):
        tracker = ConstellationTracker()
        msg = tracker.add_note("Nonexistent", "note")
        assert "haven't discovered" in msg.lower()

    def test_is_discovered_false_by_default(self):
        tracker = ConstellationTracker()
        for c in CONSTELLATIONS:
            assert not tracker.is_discovered(c.name)

    def test_total_discovered_increments_correctly(self):
        tracker = ConstellationTracker()
        assert tracker.total_discovered == 0
        tracker.discover("The Seedling", day=1, season=Season.SPRING)
        assert tracker.total_discovered == 1
        tracker.discover("The Robin", day=2, season=Season.SPRING)
        assert tracker.total_discovered == 2

    def test_total_constellations_matches_catalog(self):
        tracker = ConstellationTracker()
        assert tracker.total_constellations == 12

    def test_completion_fraction_partial(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=1, season=Season.SPRING)
        expected = 1 / len(CONSTELLATIONS)
        assert abs(tracker.completion_fraction - expected) < 1e-9

    def test_catalog_summary_completion_percentage(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=1, season=Season.SPRING)
        summary = tracker.catalog_summary()
        expected_pct = round((1 / 12) * 100, 1)
        assert summary["completion"] == expected_pct

    def test_catalog_summary_full_completion(self):
        tracker = ConstellationTracker()
        for c in CONSTELLATIONS:
            tracker.discover(c.name, day=1, season=c.seasons[0])
        summary = tracker.catalog_summary()
        assert summary["completion"] == 100.0
        assert summary["discovered"] == summary["total"]

    def test_discover_all_constellations_one_per_season(self):
        tracker = ConstellationTracker()
        for c in CONSTELLATIONS:
            tracker.discover(c.name, day=1, season=c.seasons[0])
        assert tracker.total_discovered == 12
        assert tracker.completion_fraction == 1.0

    def test_duplicate_discover_does_not_change_count(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=1, season=Season.SPRING)
        tracker.discover("The Seedling", day=2, season=Season.SPRING)
        assert tracker.total_discovered == 1


# ---------------------------------------------------------------------------
# Serialization — advanced / edge cases
# ---------------------------------------------------------------------------

class TestSerializationAdvanced:
    def test_serialize_discovered_without_discovery_obj(self):
        c = CONSTELLATION_BY_NAME["The Seedling"]
        data = serialize_constellation(c, discovered=True, discovery=None)
        assert data["discovered"] is True
        assert "stars" in data
        assert "lines" in data
        assert data["lore"] == c.lore
        assert "discovered_day" not in data
        assert "player_note" not in data

    def test_serialize_discovered_star_count_matches(self):
        c = CONSTELLATION_BY_NAME["The Seedling"]
        data = serialize_constellation(c, discovered=True)
        assert len(data["stars"]) == len(c.stars)

    def test_serialize_discovered_lines_are_lists(self):
        c = CONSTELLATION_BY_NAME["The Seedling"]
        data = serialize_constellation(c, discovered=True)
        for line in data["lines"]:
            assert isinstance(line, list)
            assert len(line) == 2

    def test_serialize_undiscovered_has_correct_hint_star_data(self):
        c = CONSTELLATION_BY_NAME["The Seedling"]
        data = serialize_constellation(c, discovered=False)
        for star in data["hint_stars"]:
            assert "x" in star
            assert "y" in star
            assert "brightness" in star

    def test_serialize_includes_seasons(self):
        c = CONSTELLATION_BY_NAME["The Blossom"]
        data = serialize_constellation(c, discovered=False)
        assert "spring" in data["seasons"]
        assert "summer" in data["seasons"]

    def test_serialize_includes_difficulty(self):
        c = CONSTELLATION_BY_NAME["The Fox"]
        data = serialize_constellation(c, discovered=False)
        assert data["difficulty"] == 3

    def test_serialize_star_count_field(self):
        for c in CONSTELLATIONS:
            data = serialize_constellation(c, discovered=False)
            assert data["star_count"] == len(c.stars)

    def test_serialize_discovered_season_string(self):
        tracker = ConstellationTracker()
        tracker.discover("The Seedling", day=3, season=Season.SPRING)
        d = tracker.discoveries["The Seedling"]
        c = CONSTELLATION_BY_NAME["The Seedling"]
        data = serialize_constellation(c, discovered=True, discovery=d)
        assert data["discovered_season"] == "spring"

    def test_serialize_all_constellations_undiscovered(self):
        for c in CONSTELLATIONS:
            data = serialize_constellation(c, discovered=False)
            assert data["discovered"] is False
            assert data["lore"] is None
            assert "hint_stars" in data
            assert "stars" not in data

    def test_serialize_all_constellations_discovered(self):
        tracker = ConstellationTracker()
        for c in CONSTELLATIONS:
            tracker.discover(c.name, day=1, season=c.seasons[0])
        for c in CONSTELLATIONS:
            d = tracker.discoveries[c.name]
            data = serialize_constellation(c, discovered=True, discovery=d)
            assert data["discovered"] is True
            assert len(data["stars"]) == len(c.stars)
            assert len(data["lines"]) == len(c.lines)
            assert data["lore"] == c.lore


# ---------------------------------------------------------------------------
# API endpoint integration tests
# ---------------------------------------------------------------------------

from server import app


@pytest.fixture
def client():
    c = TestClient(app)
    c.post("/api/new-game?seed=42")
    return c


class TestConstellationEndpoints:
    def test_get_constellations_returns_seasonal(self, client):
        r = client.get("/api/constellations")
        assert r.status_code == 200
        data = r.json()
        assert "season" in data
        assert "catalog" in data
        assert "constellations" in data
        assert len(data["constellations"]) >= 3

    def test_get_constellations_all(self, client):
        r = client.get("/api/constellations/all")
        assert r.status_code == 200
        data = r.json()
        assert len(data["constellations"]) == 12
        assert data["catalog"]["total"] == 12

    def test_discover_constellation_success(self, client):
        r = client.post("/api/constellations/discover", json={
            "name": "The Seedling",
            "note": "Found it!",
        })
        assert r.status_code == 200
        data = r.json()
        assert "discovered" in data["message"].lower() or "Seedling" in data["message"]
        assert data["constellation"]["discovered"] is True
        assert data["catalog"]["discovered"] == 1

    def test_discover_constellation_unknown(self, client):
        r = client.post("/api/constellations/discover", json={
            "name": "Totally Fake",
        })
        assert r.status_code == 404

    def test_discover_wrong_season_returns_message(self, client):
        # Default game starts in spring; The Snowflake is winter-only
        r = client.post("/api/constellations/discover", json={
            "name": "The Snowflake",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["constellation"]["discovered"] is False

    def test_discover_duplicate(self, client):
        client.post("/api/constellations/discover", json={"name": "The Seedling"})
        r = client.post("/api/constellations/discover", json={"name": "The Seedling"})
        assert r.status_code == 200
        data = r.json()
        assert "already" in data["message"].lower()

    def test_constellation_note_success(self, client):
        client.post("/api/constellations/discover", json={"name": "The Seedling"})
        r = client.post("/api/constellations/note", json={
            "name": "The Seedling",
            "note": "My personal note",
        })
        assert r.status_code == 200
        assert "saved" in r.json()["message"].lower()

    def test_constellation_note_unknown(self, client):
        r = client.post("/api/constellations/note", json={
            "name": "Does Not Exist",
            "note": "whatever",
        })
        assert r.status_code == 404

    def test_constellation_note_undiscovered(self, client):
        r = client.post("/api/constellations/note", json={
            "name": "The Seedling",
            "note": "note before discovery",
        })
        assert r.status_code == 200
        assert "haven't discovered" in r.json()["message"].lower()

    def test_new_game_resets_constellations(self, client):
        client.post("/api/constellations/discover", json={"name": "The Seedling"})
        r = client.get("/api/constellations/all")
        assert r.json()["catalog"]["discovered"] == 1

        client.post("/api/new-game?seed=99")
        r = client.get("/api/constellations/all")
        assert r.json()["catalog"]["discovered"] == 0

    def test_get_constellations_after_discover_shows_stars(self, client):
        client.post("/api/constellations/discover", json={"name": "The Seedling"})
        r = client.get("/api/constellations")
        data = r.json()
        seedling = next(c for c in data["constellations"] if c["name"] == "The Seedling")
        assert seedling["discovered"] is True
        assert "stars" in seedling
        assert "lines" in seedling
        assert seedling["lore"] is not None

    def test_undiscovered_constellation_shows_hints(self, client):
        r = client.get("/api/constellations")
        data = r.json()
        undiscovered = [c for c in data["constellations"] if not c["discovered"]]
        assert len(undiscovered) > 0
        for c in undiscovered:
            assert "hint_stars" in c
            assert c["lore"] is None

    def test_discover_with_empty_name_rejected(self, client):
        r = client.post("/api/constellations/discover", json={"name": ""})
        assert r.status_code == 422

    def test_discover_with_long_name_rejected(self, client):
        r = client.post("/api/constellations/discover", json={"name": "x" * 101})
        assert r.status_code == 422

    def test_note_with_empty_note_rejected(self, client):
        r = client.post("/api/constellations/note", json={
            "name": "The Seedling",
            "note": "",
        })
        assert r.status_code == 422

    def test_note_with_long_note_rejected(self, client):
        r = client.post("/api/constellations/note", json={
            "name": "The Seedling",
            "note": "x" * 501,
        })
        assert r.status_code == 422

    def test_catalog_summary_updates_after_multiple_discoveries(self, client):
        # Discover multiple spring constellations
        client.post("/api/constellations/discover", json={"name": "The Seedling"})
        client.post("/api/constellations/discover", json={"name": "The Robin"})
        client.post("/api/constellations/discover", json={"name": "The Blossom"})
        r = client.get("/api/constellations")
        data = r.json()
        assert data["catalog"]["discovered"] == 3

    def test_season_field_matches_game_season(self, client):
        r = client.get("/api/constellations")
        data = r.json()
        # Default game starts in spring
        assert data["season"] == "spring"

    def test_discover_whitespace_name_stripped(self, client):
        r = client.post("/api/constellations/discover", json={
            "name": "  The Seedling  ",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["constellation"]["name"] == "The Seedling"
