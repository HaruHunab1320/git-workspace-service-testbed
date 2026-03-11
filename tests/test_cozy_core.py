"""Tests for the CozyCore module's get_cozy_status function."""

import pytest
from datetime import datetime

from src.features.cozy_core import get_cozy_status


class TestGetCozyStatusValidInput:
    """Tests for get_cozy_status with valid string input."""

    def test_returns_dict(self):
        result = get_cozy_status("Alice")
        assert isinstance(result, dict)

    def test_greeting_contains_user_name(self):
        result = get_cozy_status("Alice")
        assert "Alice" in result["greeting"]

    def test_greeting_is_string(self):
        result = get_cozy_status("Bob")
        assert isinstance(result["greeting"], str)

    def test_suggestion_is_string(self):
        result = get_cozy_status("Bob")
        assert isinstance(result["suggestion"], str)

    def test_timestamp_is_string(self):
        result = get_cozy_status("Charlie")
        assert isinstance(result["timestamp"], str)

    def test_timestamp_is_valid_iso_format(self):
        result = get_cozy_status("Charlie")
        # Should not raise ValueError if timestamp is valid ISO format
        datetime.fromisoformat(result["timestamp"])

    def test_greeting_has_cozy_tone(self):
        result = get_cozy_status("Dana")
        greeting = result["greeting"].lower()
        cozy_words = ["welcome", "nook", "cozy", "warm", "hello", "back"]
        assert any(word in greeting for word in cozy_words), (
            f"Greeting '{result['greeting']}' does not have a cozy tone"
        )

    def test_suggestion_is_non_empty(self):
        result = get_cozy_status("Eve")
        assert len(result["suggestion"]) > 0


class TestGetCozyStatusEmptyString:
    """Tests for get_cozy_status with empty string input (should default to 'Friend')."""

    def test_empty_string_defaults_to_friend_in_greeting(self):
        result = get_cozy_status("")
        assert "Friend" in result["greeting"]

    def test_empty_string_returns_all_keys(self):
        result = get_cozy_status("")
        assert "greeting" in result
        assert "suggestion" in result
        assert "timestamp" in result

    def test_empty_string_returns_dict(self):
        result = get_cozy_status("")
        assert isinstance(result, dict)

    def test_empty_string_greeting_has_cozy_tone(self):
        result = get_cozy_status("")
        greeting = result["greeting"].lower()
        cozy_words = ["welcome", "nook", "cozy", "warm", "hello", "back"]
        assert any(word in greeting for word in cozy_words), (
            f"Greeting '{result['greeting']}' does not have a cozy tone"
        )


class TestGetCozyStatusReturnedKeys:
    """Tests that the returned dictionary contains all three required keys."""

    def test_has_greeting_key(self):
        result = get_cozy_status("Test")
        assert "greeting" in result

    def test_has_suggestion_key(self):
        result = get_cozy_status("Test")
        assert "suggestion" in result

    def test_has_timestamp_key(self):
        result = get_cozy_status("Test")
        assert "timestamp" in result

    def test_has_exactly_three_keys(self):
        result = get_cozy_status("Test")
        assert set(result.keys()) == {"greeting", "suggestion", "timestamp"}

    def test_no_extra_keys(self):
        result = get_cozy_status("Test")
        assert len(result) == 3


class TestGetCozyStatusEdgeCases:
    """Edge case tests for robustness."""

    def test_whitespace_only_name_defaults_to_friend(self):
        result = get_cozy_status("   ")
        assert "Friend" in result["greeting"]

    def test_single_character_name(self):
        result = get_cozy_status("A")
        assert "A" in result["greeting"]

    def test_long_name(self):
        long_name = "Bartholomew" * 10
        result = get_cozy_status(long_name)
        assert long_name in result["greeting"]

    def test_name_with_special_characters(self):
        result = get_cozy_status("O'Brien")
        assert "O'Brien" in result["greeting"]

    def test_multiple_calls_return_consistent_structure(self):
        for name in ["Alice", "Bob", "", "Charlie"]:
            result = get_cozy_status(name)
            assert isinstance(result, dict)
            assert set(result.keys()) == {"greeting", "suggestion", "timestamp"}
