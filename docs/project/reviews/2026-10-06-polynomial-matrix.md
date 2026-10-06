# Polynomial basis extraction exemplar

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
