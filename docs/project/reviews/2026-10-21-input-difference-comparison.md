# Input difference comparison: review candidate

The user accepted this exemplar and requested continued work. The bounded
[transfer and integration](../2026-10-22-comparison-transfer.md) now tests a
noncancelling difference through the same presentation. This acceptance is a
visual/editorial judgment, not evidence of learner outcomes.

Plan: [relationship-first comparison](../2026-10-21-input-difference-comparison.md).
Canonical host: `http://localhost:8000/experiments/matrix-column-combinations/?compare=1`.

## What this tests

The earlier walk demonstrated sequencing but did not make a convincing case for
explanatory value. The user questioned its point and approved showing the actual
relationship instead. Its unstarted transfer package is superseded, not accepted
or completed. Do not generalize the walk based on technical success alone.

This candidate keeps A, both inputs and both equal outputs visible throughout.
Copies of the inputs form their difference. The difference's two entries then
move into their roles as weights while the original columns supply the vectors.
The resulting contributions are opposite and evaluate to zero. A single work
area replaces the initial two-row draft, which was busier and put retained
notation in the paths of incoming columns. There is no forced rewind.

The connecting reason remains on the main path: A(v−u)=Av−Au. A nonzero input
difference that maps to zero explains equal outputs. The reader need not know
the word kernel first; the definition and a transfer question follow the card.
Complete native mathematical notation remains available in a static disclosure.

## What to look for

Use Next through all six steps, then scrub backward:

1. Both original mappings should remain available for direct comparison.
2. At **difference**, identify (2,−1) as a change in inputs, not either input.
3. At **contributions**, follow those same two entries into their roles as
   coefficients of A's original columns. The original matrices do not change.
4. At **opposites**, predict zero before advancing. Does the cancellation make
   the equal outputs above feel explained rather than merely asserted?
5. At **zero**, connect the output change to Av−Au. Try the question about
   (7,−3) without replaying; justify the prediction by the same column relation.

The important human judgment is whether this adds something useful to the
complete static calculation. Visual appeal or passing tests do not establish
comprehension. Pacing, aggregate vector evaluation and attention remain
provisional. At 390px both complete input/output mappings fit; smaller screens
and enlarged text retain a scrollable math region rather than shrinking type.

## Reuse and actual new implementation

`compareInputs(product)` in `src/math/matrix-input-comparison.ts` supplies the
missing mathematical relation: original input/output lenses, derived input and
output differences, A applied to the actual one-column difference, and its
column contributions. Provenance names original operands. Exact safe-integer
checks distinguish lost differences, identical inputs and distinguishable inputs;
they do not issue a symbolic theorem or use an approximate zero test.

The author source is `content/authoring/linear-algebra/dependent-columns-comparison.ts`.
Its cues target semantic objects and groups. The local adapter expands those
targets into scalar occurrences for shared focus coloring. One existing clock
and checkpoint helper drive native KaTeX, accepted copy/reception policy and
the existing contributor-fusion sampler. No new runtime dependency, generic
fallback, global store or fabricated second difference column was introduced.

This was **not source-only authoring**. A new comparison adapter and host were
needed to hold context and bind the relationship to motion. They remain local
discovery code; the reusable mathematical relation is more general than this
presentation. Shared motion reuse does not certify a new native compositor
mechanism or prove a general explanation authoring API. The next decision is
whether the explanation warrants a second caller, not automatic promotion.

Runtime cost is one prepared native stage, fourteen inert material copies, one
clock and one resize observer. Geometry is measured during preparation, not each
frame. The optional host is lazily selected. Complete production payload,
multi-instance performance and supported-browser promotion costs have not been
measured for this candidate; do not claim those gates pass.

## Verification

- `npm run test:matrix-comparison`: four tests pass, covering reference identity,
  derived provenance, zero/nonzero/identical cases, 41 signed integer maps and
  exact-arithmetic rejection. Reversing input selection negates the difference.
- `npm run visual:matrix-comparison`: four Chromium tests pass, covering retained
  mappings, all six endpoints, semantic copy identity, native geometry, repeated
  seek/reverse, interrupted checkpoint playback, resize, keyboard, reduced motion,
  URL restoration and disposal. The cold italic-font case cannot install a late
  player after page disposal. This stable command produces disposable captures.
- `npm run typecheck`: full application, node, test, Svelte and domain checks.
- `npm run check:architecture`: existing dependency, reader/animation, evaluation,
  compiler/governance and cross-domain gates pass.
- `npm run generate:equation-reachability`: retains 68 roots and existing edges;
  the source inventory changes from 5,100 to 5,104 files.

Initial browser checks exposed copied native occurrence attributes; inert clones
now strip those local selectors as well as shared material authority. The first
stationarity assertion also confused browser scrolling to controls with layout
movement; the check now compares document coordinates.

The measured 1.328px handoff drift survived delimiter/layout-order adjustments.
Instrumentation showed that the target moved after preparation: the new italic
u/v/A font arrived late. The numeric reader's font set was insufficient for this
new notation. The comparison explicitly requests `KaTeX_Math` italic before
measurement. The final cold-load and subpixel handoff checks pass without a
glyph-specific offset. Preparation still establishes native box participation
before measurements, and clones retain exclusive occurrence ownership.

The impact planner defaults these unmatched paths to broad checks. Under the
approved visual-discovery cadence, the focused semantic/browser checks plus
architecture/types precede the human gate. Full repository tests, production
build and complete cost/browser certification were not run for this unpromoted
candidate. The checked result is review readiness, not pedagogical approval.
