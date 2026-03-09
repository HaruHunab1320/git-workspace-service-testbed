"""Comprehensive unit tests for the CozySession class."""

import sys
import os
import unittest
from datetime import datetime

# Add apps/api to the import path so we can import alpha's implementation.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))

from cozy_session import CozySession, COMFORT_MESSAGES


class TestStartSession(unittest.TestCase):
    """Tests for CozySession.start_session."""

    def setUp(self):
        self.session = CozySession()

    # --- Happy-path tests ---

    def test_returns_string(self):
        result = self.session.start_session(5)
        self.assertIsInstance(result, str)

    def test_contains_duration(self):
        result = self.session.start_session(10)
        self.assertIn("10", result)

    def test_contains_timestamp(self):
        now = datetime.now().strftime("%H:%M")
        result = self.session.start_session(1)
        self.assertIn(now, result)

    def test_single_minute_grammar(self):
        result = self.session.start_session(1)
        self.assertIn("1 minute", result)
        self.assertNotIn("1 minutes", result)

    def test_plural_minutes_grammar(self):
        result = self.session.start_session(5)
        self.assertIn("5 minutes", result)

    def test_large_duration(self):
        result = self.session.start_session(999)
        self.assertIn("999", result)

    # --- Validation: must accept only positive integers ---

    def test_rejects_zero(self):
        with self.assertRaises(ValueError):
            self.session.start_session(0)

    def test_rejects_negative(self):
        with self.assertRaises(ValueError):
            self.session.start_session(-5)

    def test_rejects_float(self):
        with self.assertRaises(ValueError):
            self.session.start_session(2.5)

    def test_rejects_string(self):
        with self.assertRaises(ValueError):
            self.session.start_session("10")

    def test_rejects_none(self):
        with self.assertRaises(ValueError):
            self.session.start_session(None)

    def test_rejects_bool_false(self):
        with self.assertRaises(ValueError):
            self.session.start_session(False)

    def test_rejects_list(self):
        with self.assertRaises(ValueError):
            self.session.start_session([5])


class TestGetComfortMessage(unittest.TestCase):
    """Tests for CozySession.get_comfort_message."""

    def setUp(self):
        self.session = CozySession()

    def test_returns_string(self):
        msg = self.session.get_comfort_message()
        self.assertIsInstance(msg, str)

    def test_returns_non_empty_string(self):
        msg = self.session.get_comfort_message()
        self.assertTrue(len(msg) > 0, "Comfort message must not be empty")

    def test_message_is_from_predefined_list(self):
        msg = self.session.get_comfort_message()
        self.assertIn(msg, COMFORT_MESSAGES)

    def test_multiple_calls_return_non_empty(self):
        for _ in range(50):
            msg = self.session.get_comfort_message()
            self.assertIsInstance(msg, str)
            self.assertTrue(len(msg) > 0)

    def test_randomness_produces_variety(self):
        """Over many calls we should see more than one unique message."""
        messages = {self.session.get_comfort_message() for _ in range(200)}
        self.assertGreater(len(messages), 1, "Expected variety in comfort messages")

    def test_all_predefined_messages_are_non_empty(self):
        for msg in COMFORT_MESSAGES:
            self.assertIsInstance(msg, str)
            self.assertTrue(len(msg) > 0)


class TestCozySessionInstantiation(unittest.TestCase):
    """Sanity checks for class instantiation."""

    def test_can_instantiate(self):
        session = CozySession()
        self.assertIsNotNone(session)

    def test_has_start_session_method(self):
        self.assertTrue(callable(getattr(CozySession, "start_session", None)))

    def test_has_get_comfort_message_method(self):
        self.assertTrue(callable(getattr(CozySession, "get_comfort_message", None)))


if __name__ == "__main__":
    unittest.main()
