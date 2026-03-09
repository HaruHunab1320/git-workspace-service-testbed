# CozyCore — Cozy Greeting Feature

## Vibe Overview

Sometimes software can feel cold and transactional. CozyCore is a small antidote to that. It wraps your users in a warm, gentle greeting every time they check in — like a favorite blanket and a hot drink on a rainy afternoon.

The `get_cozy_status` function generates a personalized, low-stress welcome message paired with a cozy activity suggestion. No pressure, no urgency — just a soft nudge to slow down and enjoy the moment. If a user doesn't provide their name, CozyCore simply calls them "Friend," because everyone deserves a warm welcome.

## Quick Start

Import and call `get_cozy_status` with a user's name to receive a cozy status dictionary:

```python
from src.features.cozy_core import get_cozy_status

status = get_cozy_status("Maple")
print(status)
```

Example output:

```python
{
    "greeting": "Welcome back to your nook, Maple",
    "suggestion": "How about a cup of chamomile?",
    "timestamp": "2026-03-09T09:37:00"
}
```

If the name is omitted or empty, the greeting defaults to "Friend":

```python
status = get_cozy_status("")
# status["greeting"] -> "Welcome back to your nook, Friend"
```

## Return Schema

`get_cozy_status(user_name: str) -> dict` returns a dictionary with the following keys:

| Key          | Type   | Description                                                                 |
|--------------|--------|-----------------------------------------------------------------------------|
| `greeting`   | `str`  | A warm, personalized welcome message (e.g., `"Welcome back to your nook, Maple"`). Defaults to `"Friend"` when `user_name` is empty. |
| `suggestion` | `str`  | A gentle, cozy activity suggestion (e.g., `"How about a cup of chamomile?"`). |
| `timestamp`  | `str`  | An ISO 8601 timestamp indicating when the status was generated.             |

## Module Reference

- **Module path:** `src/features/cozy_core.py`
- **Primary function:** `get_cozy_status(user_name: str) -> dict`
- **Python version:** 3.10+
