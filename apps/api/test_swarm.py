"""
Tests for swarm.py — Firefly Swarm Utility
"""

import math
import random

import pytest

from swarm import Firefly, FireflySwarm


class TestFirefly:
    def test_firefly_creation(self):
        f = Firefly(x=10.0, y=20.0, glow=0.5, drift_angle=1.0, speed=0.8)
        assert f.x == 10.0
        assert f.y == 20.0
        assert f.glow == 0.5
        assert f.drift_angle == 1.0
        assert f.speed == 0.8

    def test_firefly_mutable(self):
        f = Firefly(x=0, y=0, glow=0.5, drift_angle=0, speed=1.0)
        f.x = 50.0
        assert f.x == 50.0


class TestFireflySwarmCreation:
    def test_spawn_default(self):
        swarm = FireflySwarm.spawn()
        assert swarm.count == 20
        assert swarm.width == 100.0
        assert swarm.height == 100.0

    def test_spawn_custom_count(self):
        swarm = FireflySwarm.spawn(count=5)
        assert swarm.count == 5

    def test_spawn_custom_dimensions(self):
        swarm = FireflySwarm.spawn(count=3, width=50.0, height=200.0)
        assert swarm.width == 50.0
        assert swarm.height == 200.0

    def test_spawn_zero_fireflies(self):
        swarm = FireflySwarm.spawn(count=0)
        assert swarm.count == 0
        assert swarm.fireflies == []

    def test_spawn_with_seed_reproducible(self):
        s1 = FireflySwarm.spawn(count=10, seed=42)
        s2 = FireflySwarm.spawn(count=10, seed=42)
        snap1 = s1.snapshot()
        snap2 = s2.snapshot()
        assert snap1 == snap2

    def test_spawn_different_seeds_differ(self):
        s1 = FireflySwarm.spawn(count=10, seed=1)
        s2 = FireflySwarm.spawn(count=10, seed=2)
        snap1 = s1.snapshot()
        snap2 = s2.snapshot()
        assert snap1 != snap2

    def test_spawn_positions_within_bounds(self):
        swarm = FireflySwarm.spawn(count=50, width=80.0, height=60.0, seed=7)
        for f in swarm.fireflies:
            assert 0 <= f.x <= 80.0
            assert 0 <= f.y <= 60.0

    def test_spawn_glow_in_range(self):
        swarm = FireflySwarm.spawn(count=50, seed=7)
        for f in swarm.fireflies:
            assert 0.2 <= f.glow <= 1.0

    def test_spawn_speed_in_range(self):
        swarm = FireflySwarm.spawn(count=50, seed=7)
        for f in swarm.fireflies:
            assert 0.3 <= f.speed <= 1.5

    def test_spawn_drift_angle_in_range(self):
        swarm = FireflySwarm.spawn(count=50, seed=7)
        for f in swarm.fireflies:
            assert 0 <= f.drift_angle <= 2 * math.pi


class TestFireflySwarmTick:
    def test_tick_changes_positions(self):
        swarm = FireflySwarm.spawn(count=5, seed=42)
        snap_before = swarm.snapshot()
        random.seed(99)
        swarm.tick()
        snap_after = swarm.snapshot()
        assert snap_before != snap_after

    def test_tick_wraps_around_boundaries(self):
        swarm = FireflySwarm(width=10.0, height=10.0)
        swarm.fireflies.append(
            Firefly(x=9.5, y=9.5, glow=0.5, drift_angle=0.0, speed=2.0)
        )
        random.seed(42)
        swarm.tick()
        f = swarm.fireflies[0]
        assert 0 <= f.x <= 10.0
        assert 0 <= f.y <= 10.0

    def test_tick_glow_stays_bounded(self):
        swarm = FireflySwarm.spawn(count=20, seed=42)
        for _ in range(100):
            random.seed(_)
            swarm.tick()
        for f in swarm.fireflies:
            assert 0.1 <= f.glow <= 1.0

    def test_multiple_ticks(self):
        swarm = FireflySwarm.spawn(count=5, seed=42)
        for _ in range(50):
            swarm.tick()
        # Should still be valid after many ticks
        assert swarm.count == 5
        for f in swarm.fireflies:
            assert 0 <= f.x <= swarm.width
            assert 0 <= f.y <= swarm.height


class TestFireflySwarmQueries:
    def test_snapshot_format(self):
        swarm = FireflySwarm.spawn(count=3, seed=42)
        snap = swarm.snapshot()
        assert len(snap) == 3
        for entry in snap:
            assert "x" in entry
            assert "y" in entry
            assert "glow" in entry
            assert isinstance(entry["x"], float)
            assert isinstance(entry["y"], float)
            assert isinstance(entry["glow"], float)

    def test_snapshot_values_rounded(self):
        swarm = FireflySwarm.spawn(count=1, seed=42)
        snap = swarm.snapshot()
        x_str = str(snap[0]["x"])
        # Should have at most 2 decimal places
        if "." in x_str:
            assert len(x_str.split(".")[1]) <= 2

    def test_brightest_returns_dict(self):
        swarm = FireflySwarm.spawn(count=10, seed=42)
        brightest = swarm.brightest()
        assert brightest is not None
        assert "x" in brightest
        assert "y" in brightest
        assert "glow" in brightest

    def test_brightest_is_max_glow(self):
        swarm = FireflySwarm.spawn(count=10, seed=42)
        brightest = swarm.brightest()
        max_glow = max(f.glow for f in swarm.fireflies)
        assert brightest["glow"] == round(max_glow, 2)

    def test_brightest_empty_swarm(self):
        swarm = FireflySwarm.spawn(count=0)
        assert swarm.brightest() is None

    def test_count_property(self):
        swarm = FireflySwarm.spawn(count=7)
        assert swarm.count == 7

    def test_average_glow(self):
        swarm = FireflySwarm.spawn(count=10, seed=42)
        expected = round(
            sum(f.glow for f in swarm.fireflies) / len(swarm.fireflies), 2
        )
        assert swarm.average_glow == expected

    def test_average_glow_empty(self):
        swarm = FireflySwarm.spawn(count=0)
        assert swarm.average_glow == 0.0

    def test_snapshot_empty(self):
        swarm = FireflySwarm.spawn(count=0)
        assert swarm.snapshot() == []
