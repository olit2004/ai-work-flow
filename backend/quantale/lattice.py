# -*- coding: utf-8 -*-
"""
STAGE 4 — Lattice

A lattice (Q, ≤): a poset where every pair has a join (⋁) and meet (⋀).
join(a, b) = least upper bound of {a, b}
meet(a, b) = greatest lower bound of {a, b}
"""

from __future__ import annotations
from typing import TypeVar, Generic, Optional
from .finite_set import FiniteSet
from .binary_relation import BinaryRelation
from .poset import Poset

T = TypeVar("T")


class Lattice(Poset[T]):
    """
    A lattice (Q, ≤): a poset where every pair has a join (⋁) and meet (⋀).

    join(a, b) = least upper bound of {a, b}
    meet(a, b) = greatest lower bound of {a, b}
    """

    def __init__(self, base: FiniteSet[T], leq: BinaryRelation[T]) -> None:
        super().__init__(base, leq)
        self._validate_lattice()

    def _validate_lattice(self) -> None:
        for a in self.base:
            for b in self.base:
                assert self._find_join(a, b) is not None, \
                    f"No join for ({a}, {b}) — not a lattice"
                assert self._find_meet(a, b) is not None, \
                    f"No meet for ({a}, {b}) — not a lattice"

    def _find_join(self, a: T, b: T) -> Optional[T]:
        """Least element c such that a ≤ c and b ≤ c."""
        ubs = self.upper_bounds([a, b])
        # least upper bound: no other upper bound is ≤ it
        candidates = [c for c in ubs if all(self.le(c, d) for d in ubs)]
        return candidates[0] if candidates else None

    def _find_meet(self, a: T, b: T) -> Optional[T]:
        """Greatest element c such that c ≤ a and c ≤ b."""
        lbs = self.lower_bounds([a, b])
        # greatest lower bound: no other lower bound is ≥ it
        candidates = [c for c in lbs if all(self.le(d, c) for d in lbs)]
        return candidates[0] if candidates else None

    # ── public interface ──────────────────────────────────────────────────────

    def join(self, a: T, b: T) -> T:
        """a ⋁ b — least upper bound of a and b."""
        result = self._find_join(a, b)
        assert result is not None
        return result

    def meet(self, a: T, b: T) -> T:
        """a ⋀ b — greatest lower bound of a and b."""
        result = self._find_meet(a, b)
        assert result is not None
        return result
