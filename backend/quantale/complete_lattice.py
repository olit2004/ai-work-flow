# -*- coding: utf-8 -*-
"""
STAGE 5 — CompleteLattice

A complete lattice: join and meet defined for ANY subset of Q.
⋁∅ = ⊥ (bottom — identity for join)
⋀∅ = ⊤ (top — identity for meet)
"""

from __future__ import annotations
from typing import TypeVar, Generic
from .finite_set import FiniteSet
from .binary_relation import BinaryRelation
from .lattice import Lattice

T = TypeVar("T")


class CompleteLattice(Lattice[T]):
    """
    A complete lattice: join and meet defined for ANY subset of Q.

    ⋁∅ = ⊥  (bottom — identity for join)
    ⋀∅ = ⊤  (top — identity for meet)

    For a finite lattice, completeness follows from the pairwise lattice
    property.  We expose the general interface here explicitly.
    """

    @property
    def top(self) -> T:
        """⊤ — greatest element; join of the whole set."""
        return self.big_join(list(self.base))

    @property
    def bottom(self) -> T:
        """⊥ — least element; meet of the whole set."""
        return self.big_meet(list(self.base))

    def big_join(self, subset: list[T]) -> T:
        """
        ⋁ subset — least upper bound of any subset.

        ⋁∅ = ⊥ (bottom); computed iteratively for non-empty subsets.
        """
        if not subset:
            return self.big_meet(list(self.base))  # ⊥ = ⋀Q
        result = subset[0]
        for x in subset[1:]:
            result = self.join(result, x)
        return result

    def big_meet(self, subset: list[T]) -> T:
        """
        ⋀ subset — greatest lower bound of any subset.

        ⋀∅ = ⊤ (top); computed iteratively for non-empty subsets.
        """
        if not subset:
            # ⊤ = element ≥ everything
            candidates = [c for c in self.base
                          if all(self.le(x, c) for x in self.base)]
            assert candidates, "No top element — set is empty?"
            return candidates[0]
        result = subset[0]
        for x in subset[1:]:
            result = self.meet(result, x)
        return result

    def is_top(self, a: T) -> bool:
        return a == self.top

    def is_bottom(self, a: T) -> bool:
        return a == self.bottom
