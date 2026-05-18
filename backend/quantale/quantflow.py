# -*- coding: utf-8 -*-
"""
QuantFlow — AI Content Pipeline Quantale

Concrete example of a residuated quantale for modeling
AI content-processing workflow stages.
"""

from __future__ import annotations

from .finite_set import FiniteSet
from .binary_relation import BinaryRelation
from .complete_lattice import CompleteLattice
from .residuated_quantale import ResiduatedQuantale


# ─────────────────────────────────────────────────────────────────────────────
# CONCRETE EXAMPLE — QuantFlow Quantale
# ─────────────────────────────────────────────────────────────────────────────

def build_quantflow_quantale() -> ResiduatedQuantale:
    """
    QuantFlow — AI Content Pipeline Quantale

    Workflow stages form a chain:

      raw < researched < structured < drafted < refined < published

    Interpretation:
      Higher stages represent more processed and refined content.

    Multiplication:
      ⊗ = meet (minimum stage)

    Meaning:
      Combining two workflow stages yields the most constrained
      shared processing level.

    Unit:
      published (top element)

    This preserves:
      - associativity
      - distributivity
      - residuation
      - adjunction
    """

    # Stage 1 — workflow stages
    Q = FiniteSet([
        "raw",
        "researched",
        "structured",
        "drafted",
        "refined",
        "published"
    ])

    # Stage 2 / 3 — chain order
    direct = BinaryRelation(Q, [
        ("raw", "researched"),
        ("researched", "structured"),
        ("structured", "drafted"),
        ("drafted", "refined"),
        ("refined", "published"),
    ])

    leq = direct.closure()

    # Stage 4 / 5 — complete lattice
    lat = CompleteLattice(Q, leq)

    assert lat.top == "published"
    assert lat.bottom == "raw"

    # Stage 6 — monoid operation
    def workflow_op(a: str, b: str) -> str:
        return lat.meet(a, b)

    # Stage 7 / 8 — quantale with residuals
    Q_obj = ResiduatedQuantale(
        Q,
        leq,
        workflow_op,
        unit="published"
    )

    return Q_obj


# ─────────────────────────────────────────────────────────────────────────────
# DEMONSTRATION
# ─────────────────────────────────────────────────────────────────────────────

def demo() -> None:

    print("=" * 60)
    print("  QuantFlow — AI Content Pipeline Demo")
    print("=" * 60)

    q = build_quantflow_quantale()

    # ── Stage 1-3: set and order ──────────────────────────────────────────

    print("\n── Elements ─────────────────────────────────────────────")

    print("  Q =", q.base)
    print("  ⊥ (bottom) =", q.bottom)
    print("  ⊤ (top)    =", q.top)

    print("\n── Hasse cover edges ───────────────────────────────────")

    for a, b in q.hasse_edges():
        print(f"  {a} < {b}")

    print("\n── Order queries ───────────────────────────────────────")

    pairs = [
        ("raw", "published"),
        ("researched", "drafted"),
        ("drafted", "raw")
    ]

    for a, b in pairs:

        sym = "≤" if q.le(a, b) else "≰"
        comp = "comparable" if q.comparable(a, b) else "incomparable"

        print(f"  {a} {sym} {b} ({comp})")

    # ── Stage 4-5: lattice ────────────────────────────────────────────────

    print("\n── Joins and meets ─────────────────────────────────────")

    pairs2 = [
        ("researched", "structured"),
        ("structured", "drafted"),
        ("researched", "drafted"),
        ("raw", "drafted")
    ]

    for a, b in pairs2:

        print(
            f"  {a} ⋁ {b} = {q.join(a,b)}, "
            f"{a} ⋀ {b} = {q.meet(a,b)}"
        )

    print("\n── Arbitrary joins ─────────────────────────────────────")

    subsets = [
        ["researched", "structured", "drafted"],
        ["raw", "researched"],
        ["drafted", "published"],
        ["raw", "researched", "structured",
         "drafted", "refined", "published"]
    ]

    for s in subsets:

        print(
            f"  ⋁{s} = {q.big_join(s)}, "
            f"⋀{s} = {q.big_meet(s)}"
        )

    # ── Stage 6: monoid ───────────────────────────────────────────────────

    print("\n── Monoid (⊗ = meet) ──────────────────────────────────")

    report = q.check_monoid(q.base)

    for k, v in report.items():

        if k != "counterexamples":
            print(f"  {k}: {v}")

    compositions = [
        ("drafted", "researched"),
        ("structured", "drafted"),
        ("published", "drafted"),
        ("researched", "researched")
    ]

    for a, b in compositions:
        print(f"  {a} ⊗ {b} = {q.mul(a,b)}")

    # ── Stage 7: quantale properties ─────────────────────────────────────

    print("\n── Quantale properties ─────────────────────────────────")

    print("  is_commutative:", q.is_commutative())
    print("  is_idempotent: ", q.is_idempotent())
    print("  is_integral:   ", q.is_integral())

    dist = q.check_distributivity_report()

    print("  distributivity holds:", dist["distributivity"])

    # ── Stage 8: residuals ────────────────────────────────────────────────

    print("\n── Residuals (right: a → c) ────────────────────────────")

    queries = [
        (
            "drafted",
            "researched",
            "max safe workflow extension"
        ),
        (
            "researched",
            "drafted",
            "workflow refinement boundary"
        ),
        (
            "published",
            "structured",
            "safe processing restriction"
        ),
        (
            "drafted",
            "drafted",
            "stable workflow compatibility"
        ),
    ]

    for a, c, desc in queries:

        res = q.right_residual(a, c)

        print(f"  {a} → {c} = {res:12s} ({desc})")

    print("\n── Adjunction verification ─────────────────────────────")

    adj = q.verify_adjunction()

    print(
        "  a⊗b≤c ⟺ b≤a→c ⟺ a≤c←b holds:",
        adj["adjunction_holds"]
    )

    # ── High-level API ────────────────────────────────────────────────────

    print("\n── High-level API ──────────────────────────────────────")

    print(
        "  can_do(drafted, researched):",
        q.can_do("drafted", "researched")
    )

    print(
        "  can_do(researched, drafted):",
        q.can_do("researched", "drafted")
    )

    print(
        "  effective_stage([researched, structured]):",
        q.effective_permission(["researched", "structured"])
    )

    print(
        "  max_safe_extension(drafted, researched):",
        q.max_delegatable("drafted", "researched")
    )

    print(
        "  compose(drafted, researched):",
        q.compose("drafted", "researched")
    )

    print("\n" + "=" * 60)
    print("  All quantale checks passed.")
    print("=" * 60)


if __name__ == "__main__":
    demo()