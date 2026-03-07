"""
errors.py — Centralized error hierarchy for the Cozy Village Simulator API.

All domain-specific exceptions live here so that endpoint code can raise
meaningful errors and the FastAPI exception handlers convert them to
proper HTTP responses automatically.
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class CozyVillageError(Exception):
    """Root exception for all Cozy Village Simulator errors."""

    status_code: int = 500

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


# ---------------------------------------------------------------------------
# Validation errors  (→ 400)
# ---------------------------------------------------------------------------

class ValidationError(CozyVillageError):
    """Raised when user input fails validation."""

    status_code = 400


class InvalidEnumError(ValidationError):
    """Raised when a string doesn't match any member of an expected enum."""

    def __init__(self, field: str, value: str, valid: list[str]) -> None:
        self.field = field
        self.value = value
        self.valid = valid
        super().__init__(
            f"Invalid {field}: {value!r}. Valid values: {valid}"
        )


class InsufficientFundsError(ValidationError):
    """Raised when a purchase exceeds the player's coin balance."""

    def __init__(self, needed: float, available: float) -> None:
        self.needed = needed
        self.available = available
        super().__init__(
            f"Not enough coins ({needed} needed, you have {available})"
        )


class InsufficientQuantityError(ValidationError):
    """Raised when selling/using more items than the player has."""

    def __init__(self, item: str, requested: int, available: int) -> None:
        self.item = item
        self.requested = requested
        self.available = available
        super().__init__(
            f"Not enough {item} in inventory (have {available})"
        )


class EmptyInputError(ValidationError):
    """Raised when a required text field is empty."""

    def __init__(self, field: str) -> None:
        self.field = field
        super().__init__(f"{field} cannot be empty")


class DuplicateNameError(ValidationError):
    """Raised when trying to create an entity with a name that already exists."""

    def __init__(self, entity_type: str, name: str) -> None:
        self.entity_type = entity_type
        self.name = name
        super().__init__(f"A {entity_type} named {name} already exists!")


# ---------------------------------------------------------------------------
# Not-found errors  (→ 404)
# ---------------------------------------------------------------------------

class NotFoundError(CozyVillageError):
    """Raised when a requested entity does not exist."""

    status_code = 404

    def __init__(self, entity_type: str, identifier: str | int | None = None) -> None:
        self.entity_type = entity_type
        self.identifier = identifier
        if identifier is not None:
            msg = f"{entity_type} not found: {identifier}"
        else:
            msg = f"{entity_type} not found"
        super().__init__(msg)


# ---------------------------------------------------------------------------
# Crafting errors  (→ 400)
# ---------------------------------------------------------------------------

class CraftingError(ValidationError):
    """Base exception for crafting-related errors."""


class InsufficientMaterialError(CraftingError):
    """Raised when a crafter lacks the materials needed."""

    def __init__(self, material: str, needed: int, have: int) -> None:
        self.material = material
        self.needed = needed
        self.have = have
        super().__init__(
            f"Not enough {material}: need {needed}, have {have}."
        )


class SeasonRestrictionError(CraftingError):
    """Raised when a material is unavailable in the current season."""

    def __init__(self, material: str, season) -> None:
        self.material = material
        self.season = season
        super().__init__(
            f"{material} cannot be gathered in {season.name}."
        )
