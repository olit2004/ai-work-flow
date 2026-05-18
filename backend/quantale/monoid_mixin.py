# -*- coding: utf-8 -*-
"""
STAGE 6 — Monoid mixin

Mixin that adds a monoid operation ⊗ to any set.
Provides:
  mul(a, b)       — a ⊗ b
  unit            — the identity element e
  check_monoid()  — verify all three axioms
"""

from __future__ import annotations
from typing import TypeVar, Generic, Callable
from .finite_set import FiniteSet

T = TypeVar("T")


class MonoidMixin(Generic[T]):
    """
    Mixin that adds a monoid operation ⊗ to any set.

    Provides:
      mul(a, b)       — a ⊗ b
      unit            — the identity element e
      check_monoid()  — verify all three axioms
    """

    def __init__(self, mul_fn: Callable[[T, T], T], unit: T) -> None:
        self._mul_fn = mul_fn
        self._unit = unit

    def mul(self, a: T, b: T) -> T:
        """a ⊗ b"""
        return self._mul_fn(a, b)

    @property
    def unit(self) -> T:
        """The identity element e."""
        return self._unit

    def check_monoid(self, base: FiniteSet[T]) -> dict:
        """
        Verify all three monoid axioms.

        Returns a dict with keys 'closure', 'associativity', 'identity',
        each True/False, plus 'counterexamples' for failures.
        """
        elems = list(base)
        result = {"closure": True, "associativity": True, "identity": True,
                  "counterexamples": []}

        # Closure: a ⊗ b ∈ Q for all a, b
        for a in elems:
            for b in elems:
                if self.mul(a, b) not in base:
                    result["closure"] = False
                    result["counterexamples"].append(
                        f"closure: {a}⊗{b}={self.mul(a,b)} ∉ Q")

        # Associativity: (a⊗b)⊗c = a⊗(b⊗c)
        for a in elems:
            for b in elems:
                for c in elems:
                    lhs = self.mul(self.mul(a, b), c)
                    rhs = self.mul(a, self.mul(b, c))
                    if lhs != rhs:
                        result["associativity"] = False
                        result["counterexamples"].append(
                            f"assoc: ({a}⊗{b})⊗{c}={lhs} ≠ {a}⊗({b}⊗{c})={rhs}")

        # Identity: e⊗a = a⊗e = a
        for a in elems:
            if self.mul(self._unit, a) != a or self.mul(a, self._unit) != a:
                result["identity"] = False
                result["counterexamples"].append(
                    f"identity: unit⊗{a}={self.mul(self._unit, a)}")

        return result
