"""CozyCore — a warm, inviting greeting module."""

import random
from datetime import datetime, timezone


_GREETINGS: list[str] = [
    "Welcome back to your nook, {name}",
    "So glad you're here, {name}",
    "Pull up a blanket, {name} — make yourself at home",
    "Hey there, {name} — your favorite spot is waiting",
    "Good to see you, {name} — the fire's already crackling",
]

_SUGGESTIONS: list[str] = [
    "How about a cup of chamomile?",
    "Maybe light a candle and settle in?",
    "A warm blanket and a good book sounds perfect right now.",
    "Take a deep breath — you've earned a quiet moment.",
    "Some lo-fi tunes and hot cocoa might be just the thing.",
]


def get_cozy_status(user_name: str) -> dict:
    """Return a cozy status dictionary for the given user.

    Parameters
    ----------
    user_name:
        The name to greet. If empty, defaults to ``"Friend"``.

    Returns
    -------
    dict
        A dictionary with three keys:
        - ``greeting`` (str): A warm, personalised greeting.
        - ``suggestion`` (str): A cozy activity suggestion.
        - ``timestamp`` (str): ISO-8601 UTC timestamp of when the status was generated.
    """
    name = user_name.strip() if user_name else "Friend"
    if not name:
        name = "Friend"

    greeting = random.choice(_GREETINGS).format(name=name)
    suggestion = random.choice(_SUGGESTIONS)
    timestamp = datetime.now(timezone.utc).isoformat()

    return {
        "greeting": greeting,
        "suggestion": suggestion,
        "timestamp": timestamp,
    }
