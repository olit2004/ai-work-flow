# -*- coding: utf-8 -*-
"""
STAGE 3 — Poset

A partially ordered set (Q, ≤).
≤ must be reflexive, antisymmetric, and transitive.
Allows incomparable pairs: elements a, b where neither a≤b nor b≤a.
"""

from __future__ import annotations
from typing import TypeVar, Generic
from .finite_set import FiniteSet
from .binary_relation import BinaryRelation

T = TypeVar("T")


class Poset(Generic[T]):
    """
    A partially ordered set (Q, ≤).

    ≤ must be reflexive, antisymmetric, and transitive.
    Allows incomparable pairs: elements a, b where neither a≤b nor b≤a.
    """

    def __init__(self, base: FiniteSet[T], leq: BinaryRelation[T]) -> None:
        self.base = base
        self.leq = leq
        self._validate()

    def _validate(self) -> None:
        assert self.leq.is_reflexive(),    "≤ must be reflexive"
        assert self.leq.is_antisymmetric(),"≤ must be antisymmetric"
        assert self.leq.is_transitive(),   "≤ must be transitive"

    # ── order queries ─────────────────────────────────────────────────────────

    def le(self, a: T, b: T) -> bool:
        """a ≤ b"""
        return self.leq.holds(a, b)

    def lt(self, a: T, b: T) -> bool:
        """a < b  (strictly less)"""
        return self.le(a, b) and a != b

    def comparable(self, a: T, b: T) -> bool:
        """Are a and b comparable? (one must be ≤ the other)"""
        return self.le(a, b) or self.le(b, a)

    def upper_bounds(self, subset: list[T]) -> list[T]:
        """All c ∈ Q such that x ≤ c for every x in subset."""
        return [c for c in self.base if all(self.le(x, c) for x in subset)]

    def lower_bounds(self, subset: list[T]) -> list[T]:
        """All c ∈ Q such that c ≤ x for every x in subset."""
        return [c for c in self.base if all(self.le(c, x) for x in subset)]

    # ── Hasse diagram (as adjacency list) ────────────────────────────────────

    def hasse_edges(self) -> list[tuple[T, T]]:
        """
        Direct cover relations: a → b if a < b and there is no c with a < c < b.
        These are the edges drawn in a Hasse diagram.
        """
        edges = []
        for a in self.base:
            for b in self.base:
                if self.lt(a, b):
                    # check no element sits strictly between a and b
                    between = [c for c in self.base
                               if c != a and c != b
                               and self.lt(a, c) and self.lt(c, b)]
                    if not between:
                        edges.append((a, b))
        return edges

    def __repr__(self) -> str:
        edges = self.hasse_edges()
        return f"Poset({self.base}, covers={edges})"
