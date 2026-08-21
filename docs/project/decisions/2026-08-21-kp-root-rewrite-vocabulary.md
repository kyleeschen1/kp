# Root Rewrite Vocabulary

Status: accepted for bounded implementation and pressure testing
Accepted: 2026-08-21
Applies to: the active Calculus BC symbolic-foundation run

## Decision

Root animation is not one operation. KP will distinguish a small verified
family of root rewrites and preserve the largest meaningful semantic subtree
shared by the source and target.

> The atomic unit is a semantic subtree, not a glyph. Collapse only material
> that the verified operation actually evaluates away.

The compiler, not the author or LLM, assigns the disposition of each semantic
node. Presentation consumes those proved dispositions; it does not infer them
from spelling, paint equality, or geometry.

## Vocabulary

| Operation class | Representative | Required semantic behavior |
| --- | --- | --- |
| Closed evaluation | `sqrt(144) -> 12` | Consume the closed radicand and radical as one evaluation cohort; introduce the result. |
| Inverse normalization | `sqrt(x^2) -> abs(x)` | Require a real-valued carrier; persist `x`; consume only the radical and inverse exponent; introduce absolute-value structure. |
| Compound-carrier normalization | `sqrt((x+1)^2) -> abs(x+1)` | Require a real-valued carrier; persist the complete `x+1` subtree and its internal identities; never collapse it into an anonymous result. |
| Assumption-qualified cancellation | `sqrt(x^2) -> x`, given `x >= 0` | Require explicit domain evidence before omitting absolute-value structure. |
| Exponent/index composition | `cuberoot(x^2) -> x^(2/3)` | Persist `x`; transfer exponent and root-index roles into one rational exponent with exact lineage. |
| Mixed evaluation | `sqrt(4x^2) -> 2 abs(x)` | Evaluate the closed coefficient cohort while independently preserving the symbolic carrier. |
| Partial extraction | `sqrt(x^2 y) -> abs(x) sqrt(y)` | Extract the proved perfect-power subtree and retain the residual radical enclosure around `y`. |
| Nested-root composition | `sqrt(sqrt(x)) -> fourthroot(x)` | Persist `x`; compose the two root operators and retain exact index provenance. |
| Blocked rewrite | `sqrt(x^2 + y^2)` | Refuse cancellation or distribution when no verified law justifies it. |
| Composed derivation | `sqrt(x^2 + 2x + 1) -> abs(x+1)` | Require the factoring state before inverse-root normalization; do not hide the missing semantic operation inside motion. |

## Typed Boundary

Use a nominal discriminated `RootRewritePlan` family whose variants carry the
operation-specific evidence they require. Each verified plan derives recursive
node dispositions such as:

- `persist` for a semantic carrier that survives;
- `consume` for syntax or material eliminated by the operation;
- `introduce` for target structure such as absolute-value bars;
- `fuse` or `split` for explicitly proved many-to-one or one-to-many lineage;
- `retain-enclosure` for a residual radical that remains meaningful.

These dispositions are compiler output, not free authoring fields. Prefer
small nominal plans and runtime validators over a combinatorial generic type
that attempts to encode every expression shape in TypeScript.

Root-rewrite authority remains distinct from equation solving. The existing
inverse-power operation owns parity, branch multiplicity, domains, and rejected
solutions for equations such as `x^2 = 9`. Root normalization owns verified
rewrites of radical expressions. A composed lesson may sequence both without
merging their authority.

## Presentation Mapping

- Closed numerical material may use the approved ink-knot contributor-fusion
  evaluation.
- Persistent carriers use carrier-preserving motion and native endpoint
  settlement.
- Introduced enclosures receive persistent content at their measured target
  geometry; they are not treated as continuants merely because their glyphs
  resemble source syntax.
- Mixed and partial rewrites may compose several cohorts on one clock, but no
  cohort may borrow another cohort's semantic identity.
- Every target ends in native KaTeX paint. No opaque collision backing plate,
  caller-authored timing table, or synthetic terminal correction is permitted.

## Pressure And Promotion Gate

Before narrow family promotion, pressure at least:

1. `sqrt(144) -> 12`;
2. `sqrt((x+1)^2) -> abs(x+1)` as the compound-carrier visual exemplar;
3. `cuberoot(x^2) -> x^(2/3)`;
4. `sqrt(4x^2) -> 2 abs(x)`;
5. `sqrt(x^2 y) -> abs(x) sqrt(y)`; and
6. the blocked case `sqrt(x^2 + y^2)`.

Also retain fixtures for assumption-qualified cancellation, nested-root
composition, and the factoring-first derivation. The first human checkpoint is
the compound-carrier exemplar. Only after approval may the remaining pressure
callers justify a narrow shared realization.

The existing even-root equation exemplar, approved logarithm and exponential
callers, compositor, clock, catalogue, and governed authoring contracts are the
preservation boundary. The smallest rollback unit is one semantic slice or the
single compound-carrier visual exemplar; promotion remains a later unit.
