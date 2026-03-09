"""
cozy_session.py — Cozy Break Utility

A wellness-focused module that manages relaxation timers and provides
comforting, supportive messages. Take a moment, breathe, and be kind
to yourself.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Comfort messages
# ---------------------------------------------------------------------------

COMFORT_MESSAGES: tuple[str, ...] = (
    "Time for a warm tea.",
    "You are doing a great job.",
    "Take a deep breath.",
    "Stretch your shoulders — you deserve a moment of ease.",
    "Look away from the screen and notice something beautiful nearby.",
    "You have already accomplished so much today.",
    "Rest is productive too.",
    "Wrap yourself in something cozy and just breathe.",
    "A gentle walk can do wonders.",
    "Remember: progress, not perfection.",
    "You are enough, exactly as you are right now.",
    "Close your eyes for a moment and listen to the quiet.",
)


# ---------------------------------------------------------------------------
# CozySession
# ---------------------------------------------------------------------------

class CozySession:
    """A cozy break session that tracks relaxation time and offers comfort."""

    def __init__(self) -> None:
        self._started_at: datetime | None = None
        self._duration_minutes: int | None = None

    def start_session(self, duration_minutes: int) -> str:
        """Start a cozy break session.

        Args:
            duration_minutes: How long the break should last, in minutes.
                Must be a positive integer.

        Returns:
            A timestamped message confirming the session has started.

        Raises:
            ValueError: If duration_minutes is not a positive integer.
        """
        if not isinstance(duration_minutes, int) or duration_minutes <= 0:
            raise ValueError(
                "duration_minutes must be a positive integer, "
                f"got {duration_minutes!r}"
            )

        self._started_at = datetime.now()
        self._duration_minutes = duration_minutes
        end_time = self._started_at + timedelta(minutes=duration_minutes)

        return (
            f"Cozy break started at {self._started_at.strftime('%H:%M:%S')}. "
            f"Take it easy for {duration_minutes} minute"
            f"{'s' if duration_minutes != 1 else ''} — "
            f"you'll be refreshed by {end_time.strftime('%H:%M:%S')}."
        )

    def get_comfort_message(self) -> str:
        """Return a random comforting message.

        Returns:
            A non-empty string with a warm, supportive prompt.
        """
        return random.choice(COMFORT_MESSAGES)
