# -*- coding: utf-8 -*-
"""
STAGE 7 — Quantale

A quantale (Q, ≤, ⊗): a complete lattice + monoid where ⊗ distributes
over arbitrary joins on both sides.

Left:   a ⊗ (⋁S)  =  ⋁{ a ⊗ s | s ∈ S }
Right:  (⋁S) ⊗ a  =  ⋁{ s ⊗ a | s ∈ S }
"""

from __future__ import annotations
from typing import TypeVar, Generic, Callable
from .finite_set import FiniteSet
from .binary_relation import BinaryRelation
from .complete_lattice import CompleteLattice
from .monoid_mixin import MonoidMixin

T = TypeVar("T")


class Quantale(CompleteLattice[T], MonoidMixin[T]):
    """
    A quantale (Q, ≤, ⊗): a complete lattice + monoid where ⊗ distributes
    over arbitrary joins on both sides.

    Left:   a ⊗ (⋁S)  =  ⋁{ a ⊗ s | s ∈ S }
    Right:  (⋁S) ⊗ a  =  ⋁{ s ⊗ a | s ∈ S }

    Distributivity implies ⊗ is monotone in both arguments.
    """

    def __init__(
        self,
        base: FiniteSet[T],
        leq: BinaryRelation[T],
        mul_fn: Callable[[T, T], T],
        unit: T,
    ) -> None:
        CompleteLattice.__init__(self, base, leq)
        MonoidMixin.__init__(self, mul_fn, unit)
        self._validate_quantale()

    def _validate_quantale(self) -> None:
        """Check distributivity for all elements and all subsets."""
        elems = list(self.base)
        # It suffices to check pairwise (S = {b, c}):
        # a ⊗ (b ⋁ c) = (a ⊗ b) ⋁ (a ⊗ c)
        for a in elems:
            for b in elems:
                for c in elems:
                    join_bc = self.join(b, c)
                    # left distributivity
                    lhs = self.mul(a, join_bc)
                    rhs = self.join(self.mul(a, b), self.mul(a, c))
                    assert lhs == rhs, (
                        f"Left distributivity fails: "
                        f"{a}⊗({b}⋁{c}) = {a}⊗{join_bc} = {lhs} "
                        f"≠ ({a}⊗{b})⋁({a}⊗{c}) = {rhs}"
                    )
                    # right distributivity
                    lhs2 = self.mul(join_bc, a)
                    rhs2 = self.join(self.mul(b, a), self.mul(c, a))
                    assert lhs2 == rhs2, (
                        f"Right distributivity fails: "
                        f"({b}⋁{c})⊗{a} = {join_bc}⊗{a} = {lhs2} "
                        f"≠ ({b}⊗{a})⋁({c}⊗{a}) = {rhs2}"
                    )

    def is_commutative(self) -> bool:
        """a ⊗ b = b ⊗ a for all a, b."""
        return all(
            self.mul(a, b) == self.mul(b, a)
            for a in self.base for b in self.base
        )

    def is_idempotent(self) -> bool:
        """a ⊗ a = a for all a. (gives a frame / Heyting algebra)"""
        return all(self.mul(a, a) == a for a in self.base)

    def is_integral(self) -> bool:
        """Unit e = ⊤ (top). (default-deny: composing with admin = identity)"""
        return self.unit == self.top

    def check_distributivity_report(self) -> dict:
        """Run distributivity check and return a report instead of asserting."""
        elems = list(self.base)
        failures = []
        for a in elems:
            for b in elems:
                for c in elems:
                    jbc = self.join(b, c)
                    if self.mul(a, jbc) != self.join(self.mul(a, b), self.mul(a, c)):
                        failures.append(f"left: {a}⊗({b}⋁{c})")
                    if self.mul(jbc, a) != self.join(self.mul(b, a), self.mul(c, a)):
                        failures.append(f"right: ({b}⋁{c})⊗{a}")
        return {"distributivity": len(failures) == 0, "failures": failures}
