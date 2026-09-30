# One product, another explanation

Status: column-combination layout and in-place scalar treatment accepted by the
user (“beautiful! on to the next thing”). Identity/Gram transfer implemented
with the same choreography; earlier checkpoints below are historical evidence.
Authority: [approved experiment](../2026-09-30-matrix-interpretations.md).
Contract: `run-contract.kp.matrix-interpretations-v1`.

## Accepted-treatment transfer

- [Identity](http://localhost:8000/experiments/matrix-column-combinations/?example=identity&column=0#weights): one and zero select each original column. Both weights and all zero contributions remain inspectable.
- [Orthonormality](http://localhost:8000/experiments/matrix-column-combinations/?example=orthonormality&column=0#weights): Q has columns (0.6, 0.8) and (−0.8, 0.6). Animate either column of QᵀQ using the same scalar distribution; the four retained column dot products explain the diagonal ones and off-diagonal zeros below the animation.
- The page links to both result columns and the unchanged default example.

The local presentation now receives an example containing the existing product,
selected combination, labels and cues. No choreography, timing, CSS, shared
renderer or mathematical owner changed. Inputs, negative/zero contributions and
result destinations come from the original product references. Qᵀ retains Q's
scalar objects; the numerical orthonormality check and visual product use the
identical Gram object. The check is scoped to this numerical example with
1e-12 tolerance, not a symbolic theorem for arbitrary Q.

Authoring cost: two additional cases fit in the existing model plus parameterized
presentation and host. No new source files, clock or renderer abstraction.
Standalone build: 41 modules; JS 99.62 KB gzip (+1.66 KB), CSS 14.30 KB gzip
(unchanged), excluding fonts/transport. No budget amendments. This is bounded
finite 2×2 preview reuse, not catalogue promotion or arbitrary-matrix support.
The rollback unit is this transfer commit; accepted default motion is preserved.

Validation includes 18 semantic/preservation tests, full types, architecture,
standalone build and 18 browser checks across Chromium, Firefox and WebKit.
Both columns of each case exercise placement, replay, narrow layout, reduced
motion and forced colors; the existing default checks also cover dark mode.
The first expanded browser run could not launch Chromium inside the sandbox;
the direct approved scoped command passed. Desktop/phone captures were inspected.
The impact selector has no experiment-specific rule and proposed the generic
whole-product suite; the approved experiment contract instead supplies focused
checks, full types, architecture and its standalone build. No whole-repository
release or compositor certification claim follows from these checks.

## In-place scalar revision (accepted)

The user requested shrinking the outside coefficients and growing their copies
beside every entry, in place. Open [Weights](http://localhost:8000/experiments/matrix-column-combinations/#weights)
and press Next. Each scalar shrinks first; its occurrences then grow at their
native product slots. The vector brackets widen on the same line, the entry rows
stay fixed, and the product presentation replaces the weighted presentation.
The separate product row and downward fan-out described below are superseded.

Native KaTeX still owns endpoints; the local deterministic presentation owns
this provisional choreography. Coefficient copies retain the original scalar
IDs; mathematical objects and contribution pairs are unchanged. The rollback
unit is this local presentation, style and scoped browser-check revision.
There is no shared compositor certification or general API promotion claim.

Verification: 17 semantic tests, both Chromium checks, full typecheck and the
standalone build pass. Checks cover shrink-before-growth, destination-centered
copies, preserved entry rows, endpoint handoff, deterministic reversal, reduced
motion, controls and source identity. Shrink, growth and endpoint captures were
inspected. Build: JS 97.96 KB gzip (+0.35 KB), CSS 14.30 KB gzip (+0.03 KB),
excluding fonts/transport. Stage height returns from 470 to 370 px; no budget
changes. Timing remains provisional pending human review.

The user accepted this treatment and authorized the existing transfer continuation.

## Scalar-vector refinement (superseded motion, historical evidence)

The user accepted the original column layout and requested an animation of a
scalar applied to a vector. The existing host now adds **Distribute** between
Weights and Scaled. Open [Weights](http://localhost:8000/experiments/matrix-column-combinations/#weights)
and press Next to watch each coefficient copy travel beside every vector entry.
The explicit column of products precedes the evaluated column; the source
matrices and original weighted vectors stay visible. Existing milestone names
still restore their intended states. Total duration is now 12.6 seconds.

This is a local scalar-vector passage inside the existing presentation, not a
new standalone public animation API. It directly consumes the term's original
dot-product pairs: copied coefficients use `pair.right`, vector entries use
`pair.left`, and evaluated entries remain `pair.product`. No new arithmetic,
mathematical identities, or interpretation layer was introduced.

The first transit capture exposed overlapping copies of the coefficient. The
local copy owner now dispatches lower copies first so an upper copy is not
overtaken on the shared downward route. A browser regression checks separation
at the captured midpoint, shared source identity, one native owner per settled
occurrence, and deterministic reversal through this new passage. This is sampled
preservation evidence, not continuous collision certification.

Verification: 17 focused tests, both Chromium tests, full typecheck, and standalone
build pass. Seven milestones and the scalar fan-out transit were captured and
inspected. Final JS is 97.61 KB gzip (+0.23 KB from the accepted candidate), CSS
14.27 KB gzip (+0.01 KB), excluding fonts/transport. The extra intermediate row
adds 100 px to the local stage; narrow layouts retain horizontal scrolling.
No budget or semantic contract changed. Arithmetic evaluation still introduces
the derived numerical values at native checkpoints; a generic evaluation morph
has not been claimed or implemented.

HUMAN_CHECKPOINT: review the new scalar distribution before transfer to identity
and orthonormality. The earlier layout acceptance is retained; it is not being
requested again. The independently reversible unit is this passage refinement.

Open [the column-combination example](http://localhost:8000/experiments/matrix-column-combinations/).
Play or choose Columns, Weights, Scaled, Sum and Placed. The first result column
is built as 2[1,3] + 1[2,4] = [2,6] + [2,4] = [4,10]. The second result column
is intentionally not calculated in this bounded presentation. The
[accepted dot-product view](http://localhost:8000/experiments/matrix-column-product/)
is unchanged and linked from the new page.

Review whether copied columns remain recognizable, whether the weights clearly
come from B, and whether the three levels of the calculation are easy to read.
The evaluation steps introduce derived values at native reading checkpoints;
they are not an approved general-purpose arithmetic morph. Layout, timing and
the original numerical example are provisional. Narrow screens use horizontal
stage scrolling, not shrunken math.

## What the abstraction test establishes

`columnCombinations(product)` groups existing contributions. Every scaled-column
entry is the identical scalar product already referenced by a dot-product pair;
every coefficient and vector entry is the original input object. It performs
no new arithmetic and creates no substitute scalar IDs. This is direct evidence
that these two interpretations can share one mathematical relationship.

```ts
const columns = columnCombinations(product);
const term = columns.column(0).terms[1];
term.vector;       // A's second column
term.coefficient;  // B's entry at row 1, column 0 (zero-based)
term.pairs[0] === product.cell(0, 0).dot.pairs[1]; // true
term.entries[0] === term.pairs[0].product;         // true
```

Identity tests use the same combinations: zero contributions remain inspectable,
and a weight of one selects the original source column. The derived result has
its own identity even when its value equals the input.

`transposeKpTypedMatrix` changes positions while retaining original scalar
objects and literal transposed dimensions. `gramMatrix` builds Q-transpose times
Q through the existing product owner; its dot pairs therefore refer directly to
the original two columns. This is real Euclidean algebra, not a general
Hermitian or arbitrary-inner-product implementation.

`inspectOrthonormality` returns numerical evidence with a frozen binding scope,
explicit tolerance, per-cell expected/actual values and errors. It tests all
original source entries for finite evaluation before checking the Gram matrix.
Its result is within-tolerance or outside-tolerance, not a symbolic proof or
permission to call arbitrary columns a basis. Rectangular orthonormal columns,
nonorthogonal/unit-length failures, dimension limitations, missing bindings,
nonfinite values and tolerance sensitivity are exercised.

The semantic tests cover identity and orthonormality now. Their visual transfer
remains behind this exemplar checkpoint. No universal mathematical ontology,
new renderer framework, geometric map or public scene DSL follows from this test.

## Boundaries and verification

The new host consumes the existing checked matrix environment and the pure
interpretation adapter. Native KaTeX supplies static endpoints; the existing
computed-style clone, authority stripping and reader playback clock supply
material and time. Copied occurrences retain source IDs. New layout and
projection stay local to the removable experiment. There is no catalogue or
canonical-compositor promotion claim.

- `npm run test:matrix-interpretations`: 17 tests passed.
- `npm run test:matrix-column`: 20 existing semantic/presentation tests passed.
- `npm run visual:matrix-interpretations`: two Chromium tests passed. Covers
  six endpoint captures, three transit captures, source-reference metadata,
  native target values, clone marker stripping, direct seek/reversal, actual
  playback to a checkpoint, keyboard, URL restore and reduced-motion behavior.
  Phone/dark captures are discovery evidence, not a supported-browser matrix.
- Contact sheet, coefficient transit, result transit and phone capture inspected.
- `npm run typecheck`: passed with zero Svelte errors/warnings. The first run
  caught an index-signature access in a test; corrected and rerun in full.
- `npm run check:architecture`: passed, including eight conformance tests.
- `npm run build:matrix-interpretations`: passed; 41 modules, JS 97.38 KB gzip,
  CSS 14.26 KB gzip, HTML 0.49 KB gzip, excluding fonts and transport overhead.
  This is a separate preview entry, not an increase to the accepted page.
- Generated equation-reachability inventory refreshed for the new files; all
  three exact inventory/root tests pass. No root declarations or limits changed.

The discovery contract uses focused semantic and preservation checks. Full
repository tests, promotion/browser cohorts and learner-effectiveness claims
were not part of this checkpoint. The two packages remain reversible separately:
semantic adapters/tests, and the local preview/host/configs. No budget was raised.

After visual acceptance, resume the contract's transfer slice; do not ask for a
redundant resume. Pressure the selected treatment with identity and orthonormality
and extract only what those callers actually share. If this layout is rejected,
keep the semantic adapters and revise the local presentation.
