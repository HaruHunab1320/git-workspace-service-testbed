"""Cozy Break utility — a wellness-focused module for relaxation timers and comforting messages."""

import random
from datetime import datetime

COMFORT_MESSAGES = [
    "Time for a warm tea.",
    "You are doing a great job.",
    "Take a deep breath.",
    "Wrap yourself in something cozy.",
    "Remember: rest is productive too.",
    "You deserve this break.",
    "Stretch gently and smile.",
]


class CozySession:
    """Manages a relaxation session with comforting messages."""

    def start_session(self, duration_minutes: int) -> str:
        """Start a cozy session for the given duration.

        Args:
            duration_minutes: A positive integer representing session length in minutes.

        Returns:
            A timestamped start message.

        Raises:
            TypeError: If duration_minutes is not an integer.
            ValueError: If duration_minutes is not positive.
        """
        if not isinstance(duration_minutes, int) or isinstance(duration_minutes, bool):
            raise TypeError("duration_minutes must be an integer")
        if duration_minutes <= 0:
            raise ValueError("duration_minutes must be a positive integer")
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"Cozy session started at {now} for {duration_minutes} minute(s). Relax and enjoy."

    def get_comfort_message(self) -> str:
        """Return a random comforting message."""
        return random.choice(COMFORT_MESSAGES)
