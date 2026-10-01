# Basis-aware composition and bracket fade

Approved by the user's request to proceed with composition, first making bracket
withdrawal gradual. Execution: `run-contract.kp.basis-composition-v1`.

First change the three-term dot passage at `/experiments/dot-product-passage/`:
its native KaTeX bracket owners should remain during lift and fade continuously
during pivot. Preserve token trajectories, arithmetic, typography and focus.
Its presentation and focused browser check are an independent rollback unit.

Then build one numerical 2D composition example using the existing algebra
space/basis/map/representation owners and matrix-product contribution graph.
Show why compatible dimensions do not establish compatible coordinate bases;
retain the maps and bases alongside the product rather than building a universal
object model. Reuse the existing column-combination renderer and clock in the
matrix examples host, with source-derived values and explicit context. Reject
mismatched bases at the example's composition boundary. No new motion motif,
generic basis-conversion solver, textbook import or old rectangular rollout.

The new example is the second independently reversible unit. Review both visual
changes together before any promotion. Local semantic tests, one scoped browser
canary, existing affected preservation tests and production payload checks are
the acceptance gates. Timing and explanatory clarity require human judgment.
Use the existing feature branch; no merge or deployment. Stop at the review
packet with a working shared-server URL, or at a genuine unrepairable blocker.
The old rectangular-authoring checkpoint remains unchanged.

## Candidate and review

- Fade: http://localhost:8000/experiments/dot-product-passage/ — play the first
  transition. The brackets remain during lift, fade with the pivot, and are gone
  at the paired endpoint. Reverse and seeking sample the same partial opacity.
- Composition: http://localhost:8000/experiments/matrix-column-combinations/?example=composition
  — switch between the two intermediate bases, select either result column, then
  play. Also available as **Composition and bases** in `/experiments/matrix-examples/`.
  Open the mismatch and vector-context details to inspect the distinction.

Human judgment: is the bracket withdrawal gradual enough, and does changing the
intermediate basis make the distinction between the map and its matrix clear?
The visual skill requires: “Ask for visual review of choreography, emphasis,
color, typography, and timing before generalizing.” See
[SKILL.md](../../../.agents/skills/kp-visual-salience/SKILL.md). No generalization
or further domain is included in this candidate.

## Mathematical result and authoring cost

T(x,y)=(2x,y); S(x,y)=(x+y,y). E is the standard basis and β=((1,1),(0,1)).
With β at the join, B=[[2,0],[-2,1]] and A=[[2,1],[1,1]]. With E at the join,
B=[[2,0],[0,1]] and A=[[1,1],[0,1]]. Both products are [[2,1],[0,1]].
Both basis choices retain the actual maps and endpoint bases, rather than treating
equal dimensions or equal numeric values as evidence of compatible coordinates.

The local `composeRepresentations` adapter requires the same middle basis object,
composes the existing maps, constructs their existing typed matrix representations,
and checks the arithmetic product against the composed map on the endpoint basis.
It retains both representations and the product graph together. It does not make
the generic matrix product itself basis-aware. Numerical tests exercise basis
round-trips, map linearity samples, composed action and original contribution
identity. These finite samples are not general symbolic proofs.

The caller supplies a different product to the existing column renderer. New
example-specific code comprises the basis/map source, compatibility adapter and
explanatory markup. The host needed a lazy input-selection branch, and the scene
title type needed widening from three preset titles to authored text. No casts,
clock, geometry, timeline or new motion renderer were needed. The composition
adapter remains local; it is not a universal basis-conversion system.

## Delivery cost and checks

Production JS gzip estimates before → after: dot 91,031 → 91,188 bytes;
row–column 100,608 → 100,886; ordinary columns 100,336 → 101,674.
The full activated composition closure is 105,864 bytes: 4,190 additional bytes
after the current ordinary column page, including both lazy modules and their
dependencies. CSS is unchanged. Default menu plus child is 102,325 bytes JS and
28,439 bytes CSS. These are compressed build estimates; fonts are separate.

`matrix-composition` is an explicit activation cohort in the cost checker and
inherits the existing column ceiling of 111,000 JS / 16,000 CSS bytes, leaving
about 4.9% JS headroom. No existing ceiling was raised. The inventory guard covers
the activated modules too. Research graph, editor and Three.js remain absent.
The scoped production browser check covers its cold/warm path and the menu's
new option. [Build evidence](basis-composition-cost.json) records attribution.

Passed:
- `npm run test:basis-composition` (11 tests).
- `npm run visual:dot-passage` (6 tests).
- `npm run visual:basis-composition` (both bases and columns, seek/reverse,
  shared menu/layout and unsupported query handling).
- `npm run visual:matrix-interpretations` (8 preservation tests).
- `npm run build:semantic-cost`, `npm run measure:semantic-cost`.
- `npm run visual:semantic-cost -- --grep canonical` (production paths only;
  instance performance cohorts were not rerun or claimed as new measurements).
- `npm run typecheck`.

Initial verification found an obsolete abrupt-bracket expectation, a browser
fixture range value missing its leading zero, and the preset-only scene title
type. Each was repaired and its required command rerun cleanly. The impact selector
had no focused rule for this experiment; scoped exemplar and owning semantic
checks were used rather than treating discovery as catalogue promotion.
