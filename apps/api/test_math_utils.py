"""
Tests for math_utils.py — Clamp Utility
"""

import pytest

from math_utils import clamp


class TestClamp:
    def test_value_within_range(self):
        assert clamp(5, 0, 10) == 5

    def test_value_below_range(self):
        assert clamp(-5, 0, 10) == 0

    def test_value_above_range(self):
        assert clamp(15, 0, 10) == 10

    def test_value_equals_lo(self):
        assert clamp(0, 0, 10) == 0

    def test_value_equals_hi(self):
        assert clamp(10, 0, 10) == 10

    def test_negative_range(self):
        assert clamp(-3, -10, -1) == -3

    def test_below_negative_range(self):
        assert clamp(-15, -10, -1) == -10

    def test_above_negative_range(self):
        assert clamp(5, -10, -1) == -1

    def test_float_values(self):
        assert clamp(0.5, 0.0, 1.0) == 0.5

    def test_float_below(self):
        assert clamp(-0.1, 0.0, 1.0) == 0.0

    def test_float_above(self):
        assert clamp(1.5, 0.0, 1.0) == 1.0

    def test_zero_width_range(self):
        assert clamp(5, 3, 3) == 3

    def test_zero_width_range_value_equals(self):
        assert clamp(3, 3, 3) == 3
