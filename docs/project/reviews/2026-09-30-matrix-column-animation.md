# Column-first matrix multiplication

Status: visual exemplar accepted by the user; shared promotion not established.
Acceptance: “this looks great,” followed by the request to prioritize semantic
subobjects and reusable dot-product/matrix operations. This records the visual
judgment; its contract was subsequently resolved when starting the separately
approved semantic-product migration.
Authority: [bounded work package](../2026-09-30-matrix-column-animation.md).
Contract: `run-contract.kp.matrix-column-animation-v1`.

Open [the animation](http://localhost:8000/experiments/matrix-column-product/).
Play the 24-second sequence or use the milestone menu. Previous/Next animate
to a milestone; the scrubber supports direct seeks, Home/End and arrow keys.
Reduced-motion mode steps directly. The final matrix is [[4,4],[10,8]].
The source operands remain visible while copies of a B column meet both A rows.
The workspace sits above the unchanged equation so pivoting does not pass
through the source. Results appear beside readable calculations and then move
to their exact measured native matrix slots. The second column repeats the flow.

The “chained transform score” disclosure displays the actual executable score
from `src/experiments/matrix-column-product/score.ts`. This is a narrow prototype
of named transforms with immutable env/scene snapshots. The full proposed
`M.env`, generic named layout bindings/lenses and replace/morph language are not
implemented. No claim of a general authoring API follows from this one example.

## Owners and preservation

Semantic values, selectors and intermediate dot-product objects come from the
existing generated 2x2 fixture. `createKpMatrixMatrixCompositionChoreography`
checks each cell against its authored intermediate/result. The new score changes
pedagogical traversal to column-first; it does not modify the legacy animation's
timeline or catalogue registration. It rejects unsupported order, foreign
environments, duplicate milestone names and incomplete playback sequences.

The candidate native-KaTeX adapter uses the existing renderer, computed-style
cloning/authority stripping and reader timeline clock. New layout, phase sampling
and result settlement are local to this exemplar. Every copied occurrence records
its source selector; equal numerical values are not used to infer identity.
Native target entries own paint after material settlement. Geometry is measured
from native endpoints only, and direct seeks project a complete frame.
This is not canonical compositor certification or promotion of a new shared motif.

The rollback unit is the candidate directory/host, its two configs, three npm
scripts and tests. Existing catalogue animations and the paused inspector remain
preserved. Previous uncommitted strategic notes and the earlier legacy browser
test-route correction were not included in the exemplar commit.

## Verification

- `npm run test:matrix-column`: 10 tests, including existing semantic/choreography
  checks, immutable identities, transform-order rejection and seek/reverse parity.
- `npm run visual:matrix-column`: Chromium milestone captures, exact result
  entries, real next-step playback, deterministic rewind, Home/End, native-marker
  exclusivity, collision-free sampled pivot, non-collapsing evaluation, phone
  containment, reduced motion and URL restoration.
- `npm run typecheck` and `npm run typecheck:tests`: clean.
- `npm run check:architecture`: clean, including conformance gateway tests.
- `npm run build:matrix-column`: builds the standalone HTML entry. Reported JS
  98.73 KB gzip; CSS 14.12 KB gzip; HTML 0.53 KB gzip. These exclude font payloads,
  HTTP overhead and runtime costs; the JS includes KaTeX and existing owners.
- `git diff --check`: clean.

The browser entrypoint produces eleven milestone captures, three transit captures,
a phone capture and a contact sheet under `tmp/codex/matrix-column-review/`.
The committed command/test is durable evidence; image files are disposable.
The contact sheet and pivot/evaluation transit were inspected during development.

Observed failures were repaired rather than waived: native markers initially
survived on material clones (moved under the existing stripped `data-kp-` namespace,
with regression assertion); the review packet exhausted its initial 30-second
capture timeout while compiler work was running (bounded capture allowance 60s,
behavior assertions remain 5s); a midpoint test supplied a value off the range
input's step grid (rounded to four decimal places). Visual inspection found a
pivot crossing and crowded evaluation; the layout and evaluation staging were
corrected and sampled regression assertions added.

## Human checkpoint and limits

Judge whether lifting/pivoting reads as one column, copying establishes its reuse
across both rows, and evaluation/placement clearly build the result's columns.
Review timing and the space between workspace and operands. This prototype has
not passed user judgment, a second caller or cross-browser promotion.

The phone version deliberately provides horizontal stage scrolling instead of
shrinking the mathematics; all matrices are not simultaneously visible at 390px.
The static dot-product disclosure and no-JS textual fallback preserve the numeric
explanation, but this is not a complete screen-reader or accessibility audit.
No performance, learning-value or arbitrary-input claim is made. A useful next
step after acceptance is deciding which scene-binding syntax this exemplar
actually justifies; do not silently turn its fixed milestone machine into a
general scene runtime.
