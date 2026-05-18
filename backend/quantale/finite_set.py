# -*- coding: utf-8 -*-
"""
STAGE 1 — FiniteSet

A finite set: unordered, no duplicates, supports membership and subsets.
No ordering, no operations — just ∈, ⊆, and cardinality.
"""

from __future__ import annotations
from typing import TypeVar, Generic, FrozenSet
from itertools import product as cartesian

T = TypeVar("T")


class FiniteSet(Generic[T]):
    """
    A finite set: unordered, no duplicates, supports membership and subsets.

    No ordering, no operations — just ∈, ⊆, and cardinality.
    """

    def __init__(self, elements: list[T]) -> None:
        seen = []
        for e in elements:
            if e not in seen:
                seen.append(e)
        self._elements: list[T] = seen

    # ── core interface ────────────────────────────────────────────────────────

    def __contains__(self, x: object) -> bool:
        return x in self._elements

    def __iter__(self):
        return iter(self._elements)

    def __len__(self) -> int:
        return len(self._elements)

    def __repr__(self) -> str:
        return "{" + ", ".join(str(e) for e in self._elements) + "}"

    # ── set operations ────────────────────────────────────────────────────────

    def is_subset_of(self, other: "FiniteSet[T]") -> bool:
        """A ⊆ B: every element of self is in other."""
        return all(e in other for e in self)

    def power_set(self) -> list[FrozenSet[T]]:
        """𝒫(Q): all subsets, represented as frozensets."""
        elems = list(self._elements)
        result = []
        for mask in range(1 << len(elems)):
            result.append(frozenset(elems[i] for i in range(len(elems)) if mask & (1 << i)))
        return result

    def cartesian_product(self) -> list[tuple[T, T]]:
        """Q × Q: all ordered pairs."""
        return list(cartesian(self._elements, repeat=2))

    # ── invariant ─────────────────────────────────────────────────────────────

    def check_no_duplicates(self) -> bool:
        """All elements must be distinct."""
        return len(self._elements) == len(set(str(e) for e in self._elements))
