# Cozy Break

A gentle wellness utility for developers. Cozy Break helps you step away from the screen with relaxation timers and warm, supportive messages — because you deserve a moment of calm.

## Overview

The `CozySession` class lives in `cozy_session.py` and provides two simple methods:

| Method | Description |
| --- | --- |
| `start_session(duration_minutes)` | Begins a timed relaxation break and returns a timestamped start message. |
| `get_comfort_message()` | Returns a random comforting prompt from a curated list. |

No external dependencies are required — Cozy Break uses only the Python standard library.

## Quick Start

```python
from cozy_session import CozySession

session = CozySession()

# Start a 10-minute cozy break
print(session.start_session(10))
# → "Cozy session started at 14:32 for 10 minutes. Relax and breathe."

# Get a comforting message anytime
print(session.get_comfort_message())
# → "Time for a warm tea ☕"
```

## API Reference

### `CozySession`

#### `start_session(duration_minutes: int) -> str`

Starts a relaxation session for the given number of minutes.

- **duration_minutes** — a positive integer representing how long the break should last.
- Returns a friendly, timestamped string confirming the session has started.
- Raises `ValueError` if `duration_minutes` is not a positive integer.

```python
session = CozySession()
message = session.start_session(5)
print(message)
```

#### `get_comfort_message() -> str`

Returns a random comforting message from a built-in collection. Each call may return a different message. The returned string is always non-empty.

```python
session = CozySession()
print(session.get_comfort_message())
# Examples of possible messages:
#   "Time for a warm tea"
#   "You are doing a great job"
#   "Take a deep breath"
```

## Design Notes

- **Lightweight.** Zero external dependencies — only the Python standard library is used.
- **Warm tone.** All user-facing strings are written in a supportive, minimalist voice.
- **Snake-case methods, PascalCase class.** Follows the project's Python naming conventions.

## Running Tests

```bash
python -m pytest test_cozy_session.py -v
```

See `test_cozy_session.py` for the full test suite covering input validation and message output.
