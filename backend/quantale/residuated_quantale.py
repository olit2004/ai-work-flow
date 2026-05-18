# -*- coding: utf-8 -*-
"""
STAGE 8 — ResiduatedQuantale

A quantale with explicit residuals.
right_residual(a, c)  =  a → c  =  ⋁{ b | a ⊗ b ≤ c }
left_residual(c, b)   =  c ← b  =  ⋁{ a | a ⊗ b ≤ c }
"""

from __future__ import annotations
from typing import TypeVar, Generic, Callable
from .finite_set import FiniteSet
from .binary_relation import BinaryRelation
from .quantale import Quantale

T = TypeVar("T")


class ResiduatedQuantale(Quantale[T]):
    """
    A quantale with explicit residuals.

    right_residual(a, c)  =  a → c  =  ⋁{ b | a ⊗ b ≤ c }
    left_residual(c, b)   =  c ← b  =  ⋁{ a | a ⊗ b ≤ c }

    Core adjunction (Galois connection):
      a ⊗ b ≤ c   ⟺   b ≤ (a → c)   ⟺   a ≤ (c ← b)

    Residuals are uniquely determined by ⊗ and ≤; we compute them on demand
    and cache the results.
    """

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._rr_cache: dict[tuple, T] = {}
        self._lr_cache: dict[tuple, T] = {}

    # ── residuals ─────────────────────────────────────────────────────────────

    def right_residual(self, a: T, c: T) -> T:
        """
        a → c = ⋁{ b ∈ Q | a ⊗ b ≤ c }

        "Given that the left factor is a and the result must be ≤ c,
         what is the maximum right factor?"

        Access-control reading: service with permission a wants to delegate;
        the composed permission must stay within c.  Returns max grantable.
        """
        key = (a, c)
        if key not in self._rr_cache:
            feasible = [b for b in self.base if self.le(self.mul(a, b), c)]
            self._rr_cache[key] = self.big_join(feasible) if feasible else self.bottom
        return self._rr_cache[key]

    def left_residual(self, c: T, b: T) -> T:
        """
        c ← b = ⋁{ a ∈ Q | a ⊗ b ≤ c }

        "Given that the right factor is b and the result must be ≤ c,
         what is the maximum left factor?"
        """
        key = (c, b)
        if key not in self._lr_cache:
            feasible = [a for a in self.base if self.le(self.mul(a, b), c)]
            self._lr_cache[key] = self.big_join(feasible) if feasible else self.bottom
        return self._lr_cache[key]

    # ── adjunction verification ───────────────────────────────────────────────

    def verify_adjunction(self) -> dict:
        """
        Verify the core law for all triples (a, b, c):
          a ⊗ b ≤ c  ⟺  b ≤ (a → c)  ⟺  a ≤ (c ← b)

        Returns a report with pass/fail and any counterexamples.
        """
        failures = []
        elems = list(self.base)
        for a in elems:
            for b in elems:
                for c in elems:
                    lhs  = self.le(self.mul(a, b), c)         # a ⊗ b ≤ c
                    mid  = self.le(b, self.right_residual(a, c))  # b ≤ a→c
                    rhs  = self.le(a, self.left_residual(c, b))   # a ≤ c←b
                    if not (lhs == mid == rhs):
                        failures.append(
                            f"({a},{b},{c}): "
                            f"a⊗b≤c={lhs}, b≤a→c={mid}, a≤c←b={rhs}"
                        )
        return {"adjunction_holds": len(failures) == 0, "failures": failures[:5]}

    # ── query interface (the "database" API) ──────────────────────────────────

    def can_do(self, role: T, required: T) -> bool:
        """Does role imply required?  (role ≤ required in the order)"""
        return self.le(role, required)

    def effective_permission(self, roles: list[T]) -> T:
        """Effective permission of a user holding multiple roles = ⋁ roles."""
        return self.big_join(roles)

    def max_delegatable(self, own_permission: T, cap: T) -> T:
        """
        Maximum permission this service can grant downstream so that the
        composed result stays within cap.

        = own_permission → cap  (right residual)
        """
        return self.right_residual(own_permission, cap)

    def compose(self, perm_a: T, perm_b: T) -> T:
        """Composed permission when perm_a delegates to perm_b."""
        return self.mul(perm_a, perm_b)
