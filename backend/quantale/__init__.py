# -*- coding: utf-8 -*-
"""
Quantale — Step-by-step implementation of a Quantale in Python.

Hierarchy:
  Stage 1: FiniteSet        — a set with membership and cardinality
  Stage 2: BinaryRelation   — a subset of Q×Q
  Stage 3: Poset            — a set + reflexive, antisymmetric, transitive relation
  Stage 4: Lattice          — a poset where every pair has a join and meet
  Stage 5: CompleteLattice  — join/meet for arbitrary subsets; has ⊤ and ⊥
  Stage 6: Monoid           — a set + associative binary op + identity
  Stage 7: Quantale         — CompleteLattice + Monoid, glued by distributivity
  Stage 8: Residuated       — Quantale + left/right residuals (→ and ←)

Use-case thread: database access-control permissions throughout.
"""

from .finite_set import FiniteSet
from .binary_relation import BinaryRelation
from .poset import Poset
from .lattice import Lattice
from .complete_lattice import CompleteLattice
from .monoid_mixin import MonoidMixin
from .quantale import Quantale
from .residuated_quantale import ResiduatedQuantale
from .quantflow import build_quantflow_quantale, demo

__all__ = [
    "FiniteSet",
    "BinaryRelation",
    "Poset",
    "Lattice",
    "CompleteLattice",
    "MonoidMixin",
    "Quantale",
    "ResiduatedQuantale",
    "build_quantflow_quantale",
    "demo",
]
