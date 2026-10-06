# Polynomial basis extraction exemplar

## Six design objections and approved repair (October 6)

The user requested durable recording and a repair for each objection below.
All six remain visual-review questions even after executable checks pass.

1. **The coefficient grid is recognized too late.** Align first, then hold the
   stable grid before extraction; brackets should confirm an established shape.
2. **Collection looks like deletion rather than shared structure.** Before
   extraction, emphasize both cubic terms and their coefficients together.
   Preserve their shared basis reference through collection and reverse expansion.
3. **The pivot changes translation, angle and spacing at once.** Keep header and
   vector spacing identical and rotate the arrangement around one fixed pivot;
   keep individual glyphs upright.
4. **Equality remains visible during invalid intermediate arrangements.**
   Withdraw equality before decomposition and restore only when the complete
   matrix equation is assembled. Reverse playback must obey the same condition.
5. **Explicit unit coefficients make the opening awkward.** Begin with ordinary
   polynomial notation, then reveal implicit ones and missing zeros deliberately.
6. **The endpoint gets less explanatory attention than the journey.** Hold the
   completed equation; show polynomial-to-row and basis-to-column correspondence,
   then return to an undimmed final hold.

Scope: the existing polynomial query, local model/view and focused tests. Preserve
the mathematical product, numeric/structural views and shared clock. The rollback
unit is this local choreography revision. No global salience/motif promotion.

All six repairs are implemented in the revised nine-milestone, 28-second
candidate. `align` holds the fixed grid; `notice` emphasizes both cubic terms;
`collect` begins only after equality has withdrawn; `pivot` retains 72px spacing
under one rigid quarter-turn; `matrix` restores equality after enclosure;
`rows` and `columns` inspect correspondences; `hold` restores full context.
The opening suppresses implicit positive ones and the magnitude of −1 while
retaining the negative sign and semantic coefficient identity. Zero terms and
unit coefficients emerge during alignment.

Executable checks cover hidden/revealed unit coefficients, fixed grid positions,
constant inter-basis distances throughout the turn, equality absence during
decomposition, row/column attention, restored final context, reverse-seek parity
and persistent paint. Four semantic tests, four browser cases and affected
application/test TypeScript checks pass. The first browser attempt exposed a
test range value not aligned to the slider's precision; normalizing sampled
positions to its four-decimal step repaired the harness. Visual effectiveness
of all six treatments remains for the user to assess.

## Initial implementation provenance

The following describes the original candidate. Its explicit-unit opening,
five-beat timing and changing pivot spacing are superseded by the revision above.

Approved by the user after the square-cell pouring review. Pause further pouring
refinement: the spaced pairing rows obscure the matrix gestalt. The next test
is reversible polynomial-to-matrix representation, preserving a coefficient grid
while extracting the explicitly declared ordered basis (t³, t², t, 1).

Canonical candidate: `/experiments/rectangular-product/?view=polynomials`.
Semantic authority: existing symbolic expressions, typed scalar/matrix objects
and `matrixProduct`. The fixture declares p(t)=2t³−t+4 and q(t)=t³+3t²−2.
All occurrences of each basis expression reference the same semantic scalar.
No general polynomial parser or automatic basis inference is claimed.

Renderer: local KaTeX token projection and SVG enclosures, using the existing
pouring player, timeline clock, theme and accessibility scaffold. This is a
bounded visual adapter experiment, not certification of a native KaTeX compositor
mechanism or a universal symbolic factoring API. Unsupported general input is
not exposed through this fixture. New local model/view/CSS plus the small player
dispatch extension form the reversible unit. Numeric/structural views and their
semantic contracts remain preserved.

Phrase: explicit-coefficient polynomial rows → align powers and reveal missing
zero terms → collect repeated basis expressions into a header → pivot the header
into a vector with upright glyphs → gradually enclose the coefficient grid and
output vector. Coefficients stay fixed after alignment. Collection retains one
paint occurrence per basis expression, with sibling occurrences converging before
withdrawal. Reverse seek distributes them into the original rows using retained
symbolic provenance; this does not invert numerical multiplication.

Acceptance: preserve coefficient identity, signs, basis order and row membership;
show the zero entries honestly; keep the two-row matrix shape recognizable;
avoid abrupt enclosure appearance; and support deterministic backward inspection.
One canonical visual checkpoint precedes any shared motif or second-caller
promotion. Existing matrix pouring is parked, not approved or deleted.

Verification: exact expression construction and basis reference tests; scoped
Chromium playback/seek, fixed-grid geometry, repeated-basis ownership, native
KaTeX parse, reverse controls, themes, accessibility and disposal; affected
TypeScript and shared-player preservation checks. These establish implementation
behavior, not learner comprehension. No catalogue migration or deployment.

Discovery findings: the first browser run rejected a noncanonical range value
(`.25`); the harness now uses `0.25`. Intermediate screenshots then exposed
missing persistent glyph paint despite correct geometry/visibility. Explicit
compositing hints on the bounded local token set restored that paint. The scoped
browser case now compares a persistent name's raster through seeks in addition
to DOM visibility and fixed coefficient geometry. This is local Chromium
evidence, not cross-browser compositor certification. Existing shared typography
is inherited; no local font-size override is retained.

Review URL: http://localhost:8000/experiments/rectangular-product/?view=polynomials#polynomials
Use Play, then Previous or scrub backward. Inspect `align`, `collect`, `pivot`,
and `matrix`. The notation initially exposes unit coefficients (1 and −1) rather
than animating their implicit introduction. Coefficients remain signed scalar
tokens while operation syntax withdraws during collection.

Verified: four semantic/sample tests, four matrix/polynomial Chromium cases,
two accepted rectangular-host cases, application/test TypeScript checks and
12 reachability checks. A focused rerun also verifies actual ink in the full-card
captures, not just token styles. The regenerated graph changes only scanned-file
count (4916 to 4918); no budget is raised. Visual acceptance remains pending.
