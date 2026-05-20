/**
 * quantaleEngine.js
 * 
 * Formal JavaScript implementation of a Residuated Quantale and Lattice structures.
 * This mirrors the python quantale modules, enabling zero-latency client-side
 * graph validation, Hasse covers, joins/meets, and Galois residuals.
 */

export class FiniteSet {
  constructor(elements) {
    // Unordered, distinct elements
    const seen = [];
    for (const e of elements) {
      if (e !== undefined && e !== null && !seen.includes(e)) {
        seen.push(e);
      }
    }
    this.elements = seen;
  }

  contains(x) {
    return this.elements.includes(x);
  }

  isSubsetOf(other) {
    return this.elements.every(e => other.contains(e));
  }

  getLength() {
    return this.elements.length;
  }
}

export class BinaryRelation {
  constructor(base, pairs) {
    this.base = base;
    // Store pairs as a Set of serialized "from,to" strings for O(1) checks
    this.pairs = new Set();
    for (const [a, b] of pairs) {
      if (base.contains(a) && base.contains(b)) {
        this.pairs.add(`${a},${b}`);
      }
    }
  }

  holds(a, b) {
    return this.pairs.has(`${a},${b}`);
  }

  isReflexive() {
    return this.base.elements.every(a => this.holds(a, a));
  }

  isSymmetric() {
    for (const pairStr of this.pairs) {
      const [a, b] = pairStr.split(',');
      if (!this.holds(b, a)) return false;
    }
    return true;
  }

  isAntisymmetric() {
    for (const pairStr of this.pairs) {
      const [a, b] = pairStr.split(',');
      if (a !== b && this.holds(b, a)) return false;
    }
    return true;
  }

  isTransitive() {
    const el = this.base.elements;
    for (const a of el) {
      for (const b of el) {
        if (this.holds(a, b)) {
          for (const c of el) {
            if (this.holds(b, c) && !this.holds(a, c)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  /**
   * Floyd-Warshall reflexive-transitive closure computation: O(N^3)
   */
  closure() {
    const el = this.base.elements;
    const reach = {};

    // Initialize with direct relations and identity
    for (const a of el) {
      for (const b of el) {
        reach[`${a},${b}`] = this.holds(a, b);
      }
      reach[`${a},${a}`] = true;
    }

    // Floyd-Warshall relaxation
    for (const k of el) {
      for (const a of el) {
        for (const b of el) {
          if (reach[`${a},${k}`] && reach[`${k},${b}`]) {
            reach[`${a},${b}`] = true;
          }
        }
      }
    }

    const closedPairs = [];
    for (const key in reach) {
      if (reach[key]) {
        closedPairs.push(key.split(','));
      }
    }

    return new BinaryRelation(this.base, closedPairs);
  }
}

export class Poset {
  constructor(base, leq) {
    this.base = base;
    this.leq = leq;
  }

  le(a, b) {
    return this.leq.holds(a, b);
  }

  lt(a, b) {
    return this.le(a, b) && a !== b;
  }

  comparable(a, b) {
    return this.le(a, b) || this.le(b, a);
  }

  upperBounds(subset) {
    if (subset.length === 0) return this.base.elements;
    return this.base.elements.filter(c => subset.every(x => this.le(x, c)));
  }

  lowerBounds(subset) {
    if (subset.length === 0) return this.base.elements;
    return this.base.elements.filter(c => subset.every(x => this.le(c, x)));
  }

  /**
   * Computes cover relations: a -> b if a < b and there exists no c such that a < c < b
   */
  hasseEdges() {
    const edges = [];
    const el = this.base.elements;
    for (const a of el) {
      for (const b of el) {
        if (this.lt(a, b)) {
          const between = el.filter(c => c !== a && c !== b && this.lt(a, c) && this.lt(c, b));
          if (between.length === 0) {
            edges.push([a, b]);
          }
        }
      }
    }
    return edges;
  }
}

export class Lattice extends Poset {
  join(a, b) {
    const ubs = this.upperBounds([a, b]);
    // Join (least upper bound): element c in upperBounds such that c <= d for all d in upperBounds
    const candidates = ubs.filter(c => ubs.every(d => this.le(c, d)));
    return candidates.length > 0 ? candidates[0] : null;
  }

  meet(a, b) {
    const lbs = this.lowerBounds([a, b]);
    // Meet (greatest lower bound): element c in lowerBounds such that d <= c for all d in lowerBounds
    const candidates = lbs.filter(c => lbs.every(d => this.le(d, c)));
    return candidates.length > 0 ? candidates[0] : null;
  }

  isLattice() {
    const el = this.base.elements;
    for (const a of el) {
      for (const b of el) {
        if (this.join(a, b) === null || this.meet(a, b) === null) {
          return false;
        }
      }
    }
    return true;
  }
}

export class CompleteLattice extends Lattice {
  get top() {
    return this.bigJoin(this.base.elements);
  }

  get bottom() {
    return this.bigMeet(this.base.elements);
  }

  bigJoin(subset) {
    if (subset.length === 0) return this.bottom;
    let result = subset[0];
    for (let i = 1; i < subset.length; i++) {
      result = this.join(result, subset[i]);
      if (result === null) return null;
    }
    return result;
  }

  bigMeet(subset) {
    if (subset.length === 0) return this.top;
    let result = subset[0];
    for (let i = 1; i < subset.length; i++) {
      result = this.meet(result, subset[i]);
      if (result === null) return null;
    }
    return result;
  }
}

export class ResiduatedQuantale extends CompleteLattice {
  constructor(base, leq, mulFn = null, unit = null) {
    super(base, leq);
    // ⊗ defaults to meet (minimum stage), which guarantees a residuated frame
    this.mulFn = mulFn || ((a, b) => this.meet(a, b));
    this._unitValue = unit; // Cache unit, set to top dynamically if null
    this.rrCache = {};
    this.lrCache = {};
  }

  get unit() {
    return this._unitValue !== null ? this._unitValue : this.top;
  }

  mul(a, b) {
    return this.mulFn(a, b);
  }

  /**
   * Right Residual: a -> c = V { b | a ⊗ b <= c }
   */
  rightResidual(a, c) {
    const key = `${a},${c}`;
    if (this.rrCache[key] !== undefined) return this.rrCache[key];

    const feasible = this.base.elements.filter(b => this.le(this.mul(a, b), c));
    const result = feasible.length > 0 ? this.bigJoin(feasible) : this.bottom;
    this.rrCache[key] = result;
    return result;
  }

  /**
   * Left Residual: c <- b = V { a | a ⊗ b <= c }
   */
  leftResidual(c, b) {
    const key = `${c},${b}`;
    if (this.lrCache[key] !== undefined) return this.lrCache[key];

    const feasible = this.base.elements.filter(a => this.le(this.mul(a, b), c));
    const result = feasible.length > 0 ? this.bigJoin(feasible) : this.bottom;
    this.lrCache[key] = result;
    return result;
  }

  // Axiomatic Diagnostics
  isCommutative() {
    const el = this.base.elements;
    for (const a of el) {
      for (const b of el) {
        if (this.mul(a, b) !== this.mul(b, a)) return false;
      }
    }
    return true;
  }

  isIdempotent() {
    return this.base.elements.every(a => this.mul(a, a) === a);
  }

  isIntegral() {
    return this.unit === this.top;
  }

  verifyDistributivity() {
    const el = this.base.elements;
    for (const a of el) {
      for (const b of el) {
        for (const c of el) {
          const join_bc = this.join(b, c);
          if (join_bc === null) return false;

          // Left distributivity: a ⊗ (b \/ c) = (a ⊗ b) \/ (a ⊗ c)
          const lhs1 = this.mul(a, join_bc);
          const rhs1 = this.join(this.mul(a, b), this.mul(a, c));
          if (lhs1 !== rhs1) return false;

          // Right distributivity: (b \/ c) ⊗ a = (b ⊗ a) \/ (c ⊗ a)
          const lhs2 = this.mul(join_bc, a);
          const rhs2 = this.join(this.mul(b, a), this.mul(c, a));
          if (lhs2 !== rhs2) return false;
        }
      }
    }
    return true;
  }

  verifyAdjunction() {
    const el = this.base.elements;
    for (const a of el) {
      for (const b of el) {
        for (const c of el) {
          const lhs = this.le(this.mul(a, b), c);
          const mid = this.le(b, this.rightResidual(a, c));
          const rhs = this.le(a, this.leftResidual(c, b));
          if (lhs !== mid || mid !== rhs) return false;
        }
      }
    }
    return true;
  }
}

/**
 * Factory helper to construct a ResiduatedQuantale from a list of nodes and raw directed edges.
 * Handles reflexive-transitive closure building automatically.
 */
export function buildQuantale(nodes, directedEdges) {
  const fSet = new FiniteSet(nodes);
  const rawRelation = new BinaryRelation(fSet, directedEdges);
  const closureRelation = rawRelation.closure();
  return new ResiduatedQuantale(fSet, closureRelation);
}

/**
 * Default Content Pipeline preset helper
 */
export function buildDefaultQuantale() {
  const nodes = ["raw", "researched", "structured", "drafted", "refined", "published"];
  const edges = [
    ["raw", "researched"],
    ["researched", "structured"],
    ["structured", "drafted"],
    ["drafted", "refined"],
    ["refined", "published"]
  ];
  return buildQuantale(nodes, edges);
}
