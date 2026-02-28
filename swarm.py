"""
swarm.py — Cozy Village Simulator: Firefly Swarm Utility

Simulates a swarm of fireflies drifting through the village at night.
Each firefly has a position, glow intensity, and drift direction that
update each tick.  The swarm can be queried for a snapshot of all
firefly positions — perfect for rendering a peaceful nighttime scene.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field


@dataclass
class Firefly:
    """A single firefly in the swarm."""
    x: float
    y: float
    glow: float  # 0.0 – 1.0 brightness
    drift_angle: float  # radians
    speed: float  # units per tick


@dataclass
class FireflySwarm:
    """Manages a collection of fireflies within a bounded area."""
    width: float = 100.0
    height: float = 100.0
    fireflies: list[Firefly] = field(default_factory=list)

    # -- creation ---------------------------------------------------------------

    @classmethod
    def spawn(cls, count: int = 20, width: float = 100.0, height: float = 100.0,
              seed: int | None = None) -> FireflySwarm:
        """Create a new swarm with *count* randomly placed fireflies."""
        rng = random.Random(seed)
        swarm = cls(width=width, height=height)
        for _ in range(count):
            swarm.fireflies.append(Firefly(
                x=rng.uniform(0, width),
                y=rng.uniform(0, height),
                glow=rng.uniform(0.2, 1.0),
                drift_angle=rng.uniform(0, 2 * math.pi),
                speed=rng.uniform(0.3, 1.5),
            ))
        return swarm

    # -- simulation -------------------------------------------------------------

    def tick(self) -> None:
        """Advance the swarm by one time-step."""
        for f in self.fireflies:
            # Move
            f.x += math.cos(f.drift_angle) * f.speed
            f.y += math.sin(f.drift_angle) * f.speed

            # Wrap around boundaries
            f.x %= self.width
            f.y %= self.height

            # Slightly randomise drift for organic movement
            f.drift_angle += random.uniform(-0.3, 0.3)

            # Pulse the glow
            f.glow = max(0.1, min(1.0, f.glow + random.uniform(-0.15, 0.15)))

    # -- queries ----------------------------------------------------------------

    def snapshot(self) -> list[dict]:
        """Return the current state of every firefly as a list of dicts."""
        return [
            {
                "x": round(f.x, 2),
                "y": round(f.y, 2),
                "glow": round(f.glow, 2),
            }
            for f in self.fireflies
        ]

    def brightest(self) -> dict | None:
        """Return the firefly with the highest glow, or None if empty."""
        if not self.fireflies:
            return None
        best = max(self.fireflies, key=lambda f: f.glow)
        return {"x": round(best.x, 2), "y": round(best.y, 2), "glow": round(best.glow, 2)}

    @property
    def count(self) -> int:
        return len(self.fireflies)

    @property
    def average_glow(self) -> float:
        if not self.fireflies:
            return 0.0
        return round(sum(f.glow for f in self.fireflies) / len(self.fireflies), 2)


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

def _demo() -> None:  # pragma: no cover
    swarm = FireflySwarm.spawn(count=12, seed=7)
    print(f"Spawned {swarm.count} fireflies  (avg glow: {swarm.average_glow})")
    for step in range(5):
        swarm.tick()
        brightest = swarm.brightest()
        print(f"  tick {step + 1}: brightest @ ({brightest['x']}, {brightest['y']}) glow={brightest['glow']}")
    print(f"Final avg glow: {swarm.average_glow}")


if __name__ == "__main__":
    _demo()
