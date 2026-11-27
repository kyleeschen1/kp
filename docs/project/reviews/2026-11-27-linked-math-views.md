# Linked mathematical views

Date: 2026-11-27
Status: accepted by “good. resume”; default adoption completes the bounded milestone.
Plan: [approved continuation](2026-11-27-twelve-loop-horizon.md).
Execution: `run-contract.kp.linked-math-views-20261127`.

## What authors can do

The matrix notebook's **Explain** command now uses the accepted linked column
calculation and graph. The reference and notebook share a host-neutral mount in
the existing column-player boundary. One clock drives both renderers. A narrow
host stacks the graph beneath the equation using its actual container width.
Source edits, invalid-draft recovery, occurrence-local playback, folding, undo,
reload and reader/editor switching retain their previous meaning.

Quadratic graph occurrences now include expanded, vertex and real-factored readings
beside the existing curve. Parameters come from the same admitted coefficients;
the curve never evaluates a rounded alternate form. Zero, constant and linear
inputs are explicit. Negative discriminants, unusable floating-point parameters
and uncertain numeric rewrites produce an unavailable form, not invented roots.
The discriminant sign refers to represented binary inputs, not a decimal-rational
interpretation. Alternate parameters are numerical approximations, not a CAS
proof or symbolic radical engine.

## Reuse semantics and repaired invariants

- Notebook Graph/Explain create occurrences of the same source. Playback and
  extent belong to the occurrence. Ordinary copy creates independent mathematics.
- Reference cards are pinned snapshots. Re-import explicitly updates a selected
  card; equal source IDs do not imply live cross-host subscription. A separate
  reference card is not a new independent mathematical resource. Cross-notebook
  Derive/Transclude commands remain future work.
- Deleted matrix cells formerly consumed the eight-view quota indefinitely.
  Insertion now counts live cells and atomically reclaims unused records. Native
  clipboard HTML carries validated occurrence settings, allowing cut → reclaim →
  reload → paste to restore the same IDs and extent. It carries no mathematical
  source values and cannot import an absent resource. Native history restores
  records and cells together; transport metadata is stripped from saved data.
  Legacy clipboard without that payload still needs its retained source record.
- An editor's visibility owner must exist before child players subscribe. The
  pane now declares its initial hidden state before NodeViews mount, so delayed
  workspace setup cannot leave a player alive in the hidden editor.
- Startup CSS must contain resolved shared tokens. Inlining the legacy palette
  wrapper left an invalid relative import in delayed previews; the bootstrap now
  reads the canonical palette directly and invalidates when it changes.
- Persisted-page events must not permanently dispose a surviving iframe's
  message owner. The reader releases matrix playback while frozen, then remounts
  the latest admitted source on return. Regression checks dispatch persisted
  lifecycle events; they do not claim every browser navigation uses BFCache.
- A nonzero coefficient must not print as zero. The notebook opts into an
  additive full-precision expression-printer mode; other callers keep existing
  formatting. Scientific notation and its precedence remain native KaTeX.

## Review

1. Open `http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=matrix`.
   Choose **Explain** on a source. Seek, reverse, change a coefficient and switch
   to reading mode. The equation and graph should agree, retaining your place.
2. Open `http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=quadratic`.
   Set `a=1`, `b=-2`, `c=-3`: inspect `(x−1)²−4` and `(x+1)(x−3)` alongside
   the curve. Try `c=1` (repeated root), `c=2` (no real factors), and `a=0`
   (linear). All three readings follow the source, including on a phone.
   Select the source heading, run `math.discover` from M-x (or C-x C-x), then
   search `vertex`, `expanded` or `factored`. Graph creates another occurrence
   with those readings. The reader includes them too; no URL flag is needed.
3. The accepted reference remains at
   `http://127.0.0.1:8000/experiments/matrix-reference/?geometry=1`.

The first studio visuals were accepted by “looks great! go as long as possible.”
No actual Codex response trial was inferred from that acceptance. The earlier
revision outcome remains parked locally until real-response evidence exists.

## Verification and cost

Initial combined testing exposed the delayed-theme failure above and an old
Firefox fixture assumption: a synthetic clipboard event may own a different
transfer object from the constructor argument. The fixture now populates/reads
the event's actual transfer object, as the matrix tests already did. Production
clipboard behavior was not changed for this fixture repair. One intermediate
lifecycle run also suffered navigation interruption during development-server
updates; the settled-server rerun passed in both browsers.

Full type checking also caught an existing consumer passing `expressionToLatex`
directly to `Array.map`. The new optional formatting argument now retains a unary
overload; a regression exercises that existing callback contract. An initial
unused test import was removed. No type checking or consumer was excluded.

Measured against `05bb7622ecb6e053dddde722f84052a66a13352a`:

| Complete consumer | Before | After | Unit |
| --- | ---: | ---: | --- |
| Notebook initial JavaScript | 475,202 | 475,487 | gzip bytes |
| Notebook all reachable JS/CSS | 612,649 | 619,275 | gzip bytes |
| Native fraction reader all JS/CSS | 340,792 | 340,792 | gzip bytes |
| Reference all JS/CSS | 146,289 | 146,788 | gzip bytes |
| Notebook type-check files | 681 | 687 | files |
| Notebook type instantiations | 200,607 | 202,326 | instantiations |

The notebook's complete emitted assets, including fonts, total 1,717,951 gzip
bytes; the reference totals 1,058,272. These are per-file gzip estimates, not
network transfers or runtime memory. Complete consumers include reachable lazy
chunks. The ordinary notebook still rejects eager mathematics/forms/renderer
imports; the reference retains no editor/chat/3D dependency. No ceilings changed.

Commands: `npm run measure:notebook-mathematics -- --baseline 05bb7622ecb6e053dddde722f84052a66a13352a`
and `npm run measure:matrix-reference`.

Final verification:

- `npm run visual:notebook-mathematics -- --project=firefox`: 30 passed,
  Chromium and Firefox. Includes actual clipboard HTML, source edits, copy
  isolation, restore, themes, narrow panes and simulated persisted-page events.
- `npm run visual:matrix-reference -- --project=firefox`: 16 passed after shared
  embed extraction. Later printer default output is preserved by unit tests.
- `npm run visual:fraction-notebook -- --grep 'saved theme|explicit saved dark|source typing' --project=firefox`:
  6 passed.
- `npm run test:notebook-mathematics`: 43 passed; expression/form cohort via
  `node --disable-warning=ExperimentalWarning --test tests/math-expression.test.ts tests/quadratic-forms.test.ts`:
  21 passed (overlaps the forms tests in the former command).
- `npm run test:matrix-reference`: 17; `npm run test:fraction-notebook`: 28;
  `npm run test:library-boundaries`: 8; `npm run test:project-vision`: 75 passed.
- Final `npm run typecheck`, scoped `typecheck:fraction-notebook`,
  `npm run check:architecture` and `git diff --check` passed. Full type checking
  includes application, node, tests, Svelte and domains. No exceptions added.

The final browser cohort records draft-to-next-frame p95 of 17.3/18 ms and tangent
frame p95 of 17.5/17.58 ms in Chromium/Firefox on an Apple M2. Firefox had an
83.34 ms maximum frame interval. Cold-browser loads against the warm Vite server
varied materially (5.45/0.76 seconds in this run); these measurements do not prove
production startup, phone performance or the linked matrix's frame cost. The
earlier navigation failures coincided with logged Vite restarts after shared
compiler changes. The final unchanged-source cohort passed without retries.

Browser captures are disposable; stable scoped commands own the evidence.
The user's “good. resume” accepts the form presentation and notebook composition.
This does not establish learner usefulness or a successful actual-model trial.

## Accepted default adoption

The shared mathematical NodeView now admits forms for source quadratic graphs
without query routing. Derivative/tangent graphs remain distinct. Existing Graph
metadata exposes the three form names through capability discovery, with no new
command, persistent schema or evaluator. Saved source coefficients still own both
KaTeX notation and Graph2D evaluation. The rollback unit is this admission and
metadata change; no mathematical data migration is involved.

Promotion verification first found two fixture issues. Expanded fuzzy metadata
allows secondary matches for `contact`; the intended Tangent still ranks first.
The test now asserts ranking and stale-selection rejection, not an exact result
count. Firefox also reported an aborted lazy import when the test navigated away
from the fraction preview before hydration completed. Waiting for the existing
preview readiness signal preserves the no-eager-forms assertion. No runtime error
was suppressed. Project-orientation checks caught overlong entrypoints; prose was
condensed within the existing budgets, preserving links and approval boundaries.

Measured against `1e6877328f3980ea7a5dfb26a58dc9790df632cf` with
`npm run measure:notebook-mathematics -- --baseline 1e6877328f3980ea7a5dfb26a58dc9790df632cf`:
initial notebook JavaScript is 475,511 gzip bytes (+24); all reachable JS/CSS is
619,318 (+43); all emitted assets total 1,717,994 (+43). The native fraction reader
is unchanged at 340,792. Notebook type files remain 687; instantiations increase
by eight to 202,334. These are complete-consumer build estimates, not network or
runtime memory measurements. No ceilings changed.

Final promotion checks:

- `npm run visual:notebook-mathematics -- --project=firefox`: 30 passed across
  Chromium and Firefox after the fixture repair, with no retries.
- `npm run test:studio-foundations`: 38 passed; `npm run test:notebook-mathematics`:
  43 passed; `npm run test:project-vision`: 75 passed after shortening the entrypoints.
- `npm run typecheck:fraction-notebook`, `npm run typecheck:tests`,
  `npm run check:architecture` and the complete-consumer measurement passed.
  The source promotion changes no rendering styles or mathematical evaluator.

The next recommendation is a separately scoped R2 inner-product/projection
exemplar: source vectors, signed projection, perpendicular residual and explicit
zero/orthogonal cases. It is not implementation authority for a new family.
The earlier studio actual-response trial remains pending, and reference cards
remain pinned snapshots. Inspect the closed record with
`theseus work context task.kp.linked-math-views-20261127 --mode brief`.
