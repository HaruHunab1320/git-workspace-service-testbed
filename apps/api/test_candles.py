"""Tests for the Candle Workshop module."""

import pytest
from candles import CandleWorkshop, ALL_SCENTS, SCENT_MAP, Scent


class TestCandleWorkshop:
    def setup_method(self):
        self.workshop = CandleWorkshop(seed=42)

    def test_craft_candle(self):
        candle, msg = self.workshop.craft("lavender", day=1)
        assert candle.scent.scent == Scent.LAVENDER
        assert candle.burn_remaining == 5
        assert candle.status == "unlit"
        assert "Lavender Dream" in msg

    def test_craft_invalid_scent(self):
        with pytest.raises(ValueError, match="Unknown scent"):
            self.workshop.craft("bubblegum")

    def test_light_and_extinguish(self):
        candle, _ = self.workshop.craft("vanilla")
        assert candle.status == "unlit"

        msg = self.workshop.light(candle.id)
        assert "light" in msg.lower()
        assert candle.status == "lit"

        msg = self.workshop.extinguish(candle.id)
        assert "blow out" in msg.lower() or "extinguish" in msg.lower() or "gently" in msg.lower()
        assert candle.status == "unlit"

    def test_light_already_lit(self):
        candle, _ = self.workshop.craft("pine")
        self.workshop.light(candle.id)
        msg = self.workshop.light(candle.id)
        assert "already" in msg.lower()

    def test_advance_day_burns_candle(self):
        candle, _ = self.workshop.craft("rose")  # 3-day burn
        self.workshop.light(candle.id)
        assert candle.burn_remaining == 3

        events = self.workshop.advance_day()
        assert candle.burn_remaining == 2
        assert len(events) == 1

    def test_candle_burns_out(self):
        candle, _ = self.workshop.craft("rose")  # 3-day burn
        self.workshop.light(candle.id)

        for _ in range(3):
            self.workshop.advance_day()

        assert candle.is_spent
        assert candle.status == "spent"
        assert self.workshop.total_burned == 1

    def test_remove_candle(self):
        candle, _ = self.workshop.craft("cedar")
        assert len(self.workshop.candles) == 1
        self.workshop.remove(candle.id)
        assert len(self.workshop.candles) == 0

    def test_mood_effects(self):
        c1, _ = self.workshop.craft("lavender")
        c2, _ = self.workshop.craft("cinnamon")
        self.workshop.light(c1.id)
        self.workshop.light(c2.id)

        effects = self.workshop.mood_effects("spring")
        assert len(effects) == 2
        # Lavender has spring bonus
        assert any("bonus" in e for e in effects)

    def test_unlit_candles_no_mood(self):
        self.workshop.craft("vanilla")
        effects = self.workshop.mood_effects()
        assert len(effects) == 0

    def test_summary(self):
        self.workshop.craft("honey")
        self.workshop.craft("ocean breeze")
        summary = self.workshop.summary()
        assert summary["total_candles"] == 2
        assert summary["total_crafted"] == 2
        assert summary["lit_candles"] == 0

    def test_all_scents_available(self):
        assert len(ALL_SCENTS) == 8
        for scent in ALL_SCENTS:
            assert scent.scent.value in SCENT_MAP

    def test_burn_fraction(self):
        candle, _ = self.workshop.craft("cedar")  # 8-day burn
        assert candle.burn_fraction == 1.0
        self.workshop.light(candle.id)
        self.workshop.advance_day()
        assert candle.burn_fraction == 7 / 8
