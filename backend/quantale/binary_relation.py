# -*- coding: utf-8 -*-
"""
STAGE 2 — BinaryRelation

A binary relation R ⊆ Q×Q.
Stored as a set of (a, b) pairs. Can be tested for the four standard
properties: reflexive, symmetric, antisymmetric, transitive.
"""

from __future__ import annotations
from typing import TypeVar, Generic, FrozenSet
from .finite_set import FiniteSet

T = TypeVar("T")


class BinaryRelation(Generic[T]):
    """
    A binary relation R ⊆ Q×Q.

    Stored as a set of (a, b) pairs.  Can be tested for the four standard
    properties: reflexive, symmetric, antisymmetric, transitive.
    """

    def __init__(self, base: FiniteSet[T], pairs: list[tuple[T, T]]) -> None:
        self.base = base
        # validate: every pair must be from Q×Q
        for a, b in pairs:
            assert a in base and b in base, f"Pair ({a},{b}) outside base set"
        self._pairs: FrozenSet[tuple[T, T]] = frozenset(pairs)

    def __contains__(self, pair: tuple[T, T]) -> bool:
        return pair in self._pairs

    def holds(self, a: T, b: T) -> bool:
        """Does a R b hold?"""
        return (a, b) in self._pairs

    # ── four standard properties ──────────────────────────────────────────────

    def is_reflexive(self) -> bool:
        """∀ a ∈ Q: a R a"""
        return all(self.holds(a, a) for a in self.base)

    def is_symmetric(self) -> bool:
        """∀ a,b: a R b → b R a"""
        return all(self.holds(b, a) for (a, b) in self._pairs)

    def is_antisymmetric(self) -> bool:
        """∀ a,b: a R b ∧ b R a → a = b"""
        for (a, b) in self._pairs:
            if a != b and self.holds(b, a):
                return False
        return True

    def is_transitive(self) -> bool:
        """∀ a,b,c: a R b ∧ b R c → a R c"""
        for (a, b) in self._pairs:
            for c in self.base:
                if self.holds(b, c) and not self.holds(a, c):
                    return False
        return True

    # ── reflexive-transitive closure ─────────────────────────────────────────

    def closure(self) -> "BinaryRelation[T]":
        """
        Compute the reflexive-transitive closure.

        Uses Floyd-Warshall: O(n³).
        """
        elems = list(self.base)
        reach = {(a, b): self.holds(a, b) for a in elems for b in elems}
        for e in elems:
            reach[(e, e)] = True  # reflexivity
        for k in elems:
            for a in elems:
                for b in elems:
                    if reach[(a, k)] and reach[(k, b)]:
                        reach[(a, b)] = True
        pairs = [(a, b) for (a, b), v in reach.items() if v]
        return BinaryRelation(self.base, pairs)

    def __repr__(self) -> str:
        pairs = sorted(str(p) for p in self._pairs)
        return f"Relation({', '.join(pairs)})"
