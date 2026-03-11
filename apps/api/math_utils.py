def clamp(value, lo, hi):
    """Clamp a value between lo and hi (inclusive)."""
    return max(lo, min(value, hi))
