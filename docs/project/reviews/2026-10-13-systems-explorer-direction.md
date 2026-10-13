# Systems explorer direction and approved continuation

## Implementation authorization and execution boundary

The subsequent user instruction, "This seems excellent. implement for as long
as possible", approves implementing the discussed bounded explorer as well as
the enabling sequence. The older proposed-status wording below describes the
discussion at that time. Execution now uses
`run-contract.kp.systems-explorer-v1`: composition, zero rows, fractions,
source-only authoring, bounded generation/trace, and square-system explorer.
No arbitrary solver, free-form answer authority or catalogue-wide rollout.

First package: connect up to eight named checked operations using the existing
composition host and row renderer. Validate all intermediate states, preserve
single-step sources, and expose a short swap/scale/add exemplar. The observable
checkpoint is continuous operation-to-operation paint and readable mathematical
progress, with natural equations at both ends. Human review precedes generalizing
new compact-layout choreography. Subsequent packages preserve that treatment.

Checks: scoped semantic/source tests, affected types, existing-host Chromium
continuity/seek/reversal checks, production consumer costs at integration, and
Theseus validation. Each coherent checked package is committed and backed up.
Use standard verification for semantic work and focused checks during visual
discovery; broad promotion checks follow accepted exemplars. Reserve closeout
time before each stop. End at the bounded explorer outcome or a named visual,
external, scope or resource stop; duration is uncertain, not a minimum quota.

The user accepted the recommended sequence from
[the ten-loop review](2026-10-13-next-ten-loops.md): 1 → 2 → 3 → 5,
and authorized sustained execution. Approval persists; it does not require
another routine permission request. The same message explicitly requests
discussion of a short-term systems-problem generator and intuitive Gaussian
elimination explorer. This turn records and discusses that product direction
before implementation. The other six candidate loops are not an approved queue.

## Accepted continuation

Compose short checked elimination arguments; support whole-zero rows and their
meaning; carry exact fractions through the composed presentation; then measure
source-only authoring on unseen bounded examples. Existing exemplar-first visual
gates remain. Use one outcome-sized Theseus execution record when implementation
starts, linked to this review and the original proposal. No active run is created
merely to record the discussion. Continue across routine checks within approved
scope; do not silently promote a new aesthetic or expand to arbitrary dimensions.

Canonical starting artifact: typed RowCompositionSource and its compiled model.
Host: /experiments/rectangular-product/?view=row-composition. Renderer: existing
collection native KaTeX layout, row-operation view and shared playhead. Semantic
authority: linear-system model and exact checked row operations. Preserve natural
resting notation, native handoffs, standalone workbench, provenance and reversal.
Each checked composition or support extension is a separate reversible package.

## Product goal

A bounded interface generates systems with specified structural properties,
animates a checked elimination trace, and answers local questions about pivots,
free variables, dependence, consistency and the solution set through inspectable
illustrations. The purpose is explanatory exploration, not a large exercise bank.

Proposed first complete product envelope: two- and three-variable real systems,
initially square 2×2 and 3×3. The current two-equation/three-unknown renderer cannot
demonstrate unique solutions in its present shape, so square-shape support is a
real additional presentation milestone. Do not imply the approved first three
loops alone deliver the entire product. Rectangular systems follow if justified.

## Mathematical distinctions the interface must preserve

- Echelon/upper-triangular form is a representation milestone, not a solution
  classification. A square upper-triangular matrix can be singular.
- With n unknowns and r = rank(A), consistency is rank(A) = rank([A|b]).
  Consistent r = n means a unique solution; consistent r < n means an affine
  solution family of dimension n-r. Unequal ranks mean no solution.
- Column independence means rank(A) equals the number of columns; row
  independence means rank(A) equals the number of rows. Neither alone is a
  context-free synonym for unique solution. Dependence does not imply
  inconsistency. A homogeneous system is always consistent.
- Nonzero row scaling, row swaps and row addition preserve the solution set.
  Row operations preserve column-dependence relations, but generally change the
  column space as a subset of the codomain. A geometric view must name its
  representation and invariants rather than treating every picture as fixed.
- A pivot-free column is not necessarily a zero column; a free variable must
  appear in an actual parameterization, not just a label.

## Proposed construction and explanation design

Generate from a known rank/consistency structure with bounded exact entries,
then scramble through invertible elementary row operations. Independently check
rank, consistency and the actual elimination trace of the displayed system.
Reject/regenerate out-of-envelope candidates. A seed supports exact replay.
Do not animate only the generator's inverse scramble and call it Gaussian
elimination: the displayed path should follow an explicit pivot policy.

Separate system generation, exact elimination trace, checked structural facts,
and their renderer-owned explanations. Reuse responsible existing owners; these
are responsibilities, not a mandate for four new frameworks. Back substitution
and optional reduced-row-echelon continuation are distinct from forward
elimination. Parameters and inconsistency witnesses are outcomes too.

Use bounded semantic questions first: Why this pivot? Why is this variable free?
What does this zero row mean? Why does this operation preserve solutions?
What changes if the right-hand side changes? Answers should select actual
referents and checked facts. Free-form language can later select supported
questions; it must not become mathematical authority or fabricate a visual.

Prefer controlled contrasts with the same coefficient matrix and a changed RHS
to show consistency, and separately changed rank to show loss of independence.
Do not promise all permutations; cover dimensions, rank, consistency, pivot
placement, row order and signed/rational values as meaningful case dimensions.
Use deliberate representative cases plus generated validation, not a new page
or authored animation for each combination.

## Recommended relationship to the accepted sequence

Keep 1 → 2 → 3 as the immediate enabling work. Use the authoring exercise (5)
to establish the trace-to-presentation boundary. Then propose the bounded
generator, square-shape presentation and solution interpretation milestone with
evidence from that work. Larger geometry, arbitrary question answering and a
general solver are not silently included in the current implementation scope.
Earlier parked pouring/linked-panel work and deferred reader testing stay parked.

## First composition review

Canonical URL: <http://127.0.0.1:8000/experiments/rectangular-product/?view=row-composition&example=elimination>.
The existing host menu also exposes **Three-step elimination**. Use Play or the
milestones: equations → matrix → swap → normalize → eliminate → expanded.

Inspect whether swapping into echelon form, normalizing the second pivot, then
eliminating above it reads as one argument. Check arithmetic spacing, preserved
equality and RHS, and whether the final free-variable explanation is clear.
The first swap exposes echelon form in a rectangular matrix; this is not yet
the proposed square upper-triangular example or a generated-problem interface.

The typed `RowSequenceCompositionSource` supplies an existing collection, named
checked operations and during/after annotations. Its compiler retains actual
matrix/scalar referents through every step and validates all intermediate
collection endpoints before mounting. Existing single-step sources retain their
API, checked IDs, URLs and timings. Workbench step compilation is shared rather
than reconstructed in the composition adapter.

One premeasured operation surface per step avoids DOM rebuilding or measuring
during scrubbing. Only the active surface paints and samples, using the existing
host clock. The local bound is eight steps; no arbitrary-length runtime claim.
No universal source schema or compositor certification is introduced.

Observed bug: fixed factor/operand offsets overflowed compact arithmetic cells.
The owning row renderer now centers each complete product using measured token
widths. Browser regression checks require clearance between factor/operator/
operand and neighboring cells, alongside the pixel-level endpoint handoff checks.
The new negative addition also honors the layout's existing outward-copy
clearance. These checks cover the exemplar, not every fraction or font/shape
combination. Human judgment still owns cadence and legibility.

Verification: `npm run test:row-operation` passes 20 tests;
`npm run visual:row-operation` passes all 15 Chromium checks;
`npm run typecheck` passes the full application/node/tests/Svelte/domain chain;
`npm run build:matrix-interpretations` passes (140 modules);
`npm run measure:semantic-cost` passes after the explicit
[cost amendment](../decisions/2026-10-13-row-sequence-cost-boundary.md).
The new browser check covers every operation seam, direct seek/reversal,
arithmetic spacing, URL restoration and light mode; existing tests retain
reduced-motion, cancellation, history and disposal coverage. The two initial
new unit failures were test assumptions (checker snapshot wrappers versus
referent identity, and an accidentally duplicated fixture ID), corrected to
assert actual math identity and the intended intermediate-value repair.

No full repository test suite, cross-browser release cohort, new multi-instance
runtime benchmark or learning-effectiveness claim. The impact selector had no
focused rule for this local module; the package used the explicit scoped checks
above rather than claiming the generic full-suite recommendation was executed.

Next after acceptance: source-only second sequence, then zero-row presentation
and fractional collection. Keep the new explorer goal and bounded generation
scope; do not return to unrelated parked work. This candidate's rollback unit
is the checked multi-operation composition package, not semantic history.
