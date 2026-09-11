# Gradient / contour primary review

Outcome: HUMAN_CHECKPOINT. The approved proposal remains the scope authority;
`run-contract.kp.gradient-contour-intuition-v1` owns live progress. This is a
review packet, not release certification or a second execution plan.

Review at http://localhost:8000/experiments/kinetic-figure/gradient-contour/.
The existing shared server was verified; no second server was started.

## Current revision: prepare, observe, hold the inference

The user accepted the motivation/mechanism direction but reported distraction
while learning this unfamiliar topic. They approved the recommended bounded
attention repair with “implement the rec”. This revision is ready for G3 review,
not approved for generalization. The exact scope remains in the delivery proposal.

At **6 / 8**, read the stationary comparison, then choose **Turn toward uphill**
or the next arrow. The cue identifies the across component before motion starts.
The same paragraph and cue stay in place during the turn. Geometry settles before
the interpretation appears at **7 / 8**, and the result remains inspectable.
The replay button replays this turn inside the comparison; elsewhere it retains
whole-explanation replay. Scrubbing, arrows, mouse dragging, wheel input and touch
still use the existing clock and native-input owner. There are still eight
conceptual stops, not a separate counter for presentation phases.

The comparison uses `gradient-contour-attention.ts` and the existing reader
attention projector. Only its action phase advances the comparison geometry;
orientation and final inspection are learner-paced checkpoints, not timers that
guess reading speed. A stationary reading projection sits over the native scroll
lane without taking over its input state. It uses the shared Focus Card narrative
and passage classes, not a separate typography definition. The short visual cue
uses DOM text so it stays readable on a phone rather than shrinking with SVG.
Its direction-neutral wording remains valid during backward inspection.

Semantic target names are constrained to the comparison's existing overlay IDs.
Pure projection and executable checks protect held geometry, stable action text,
reference closure, exact endpoints and reversal. These guarantees do not prove
comprehension or establish a universal four-phase authoring grammar.

### Bounded renderer repair uncovered by verification

Repeated comparison/replay checks exposed a stall that persisted in a clean run;
live reload was not its full explanation. A browser CPU profile implicated native
shader compilation. A real WebGL lifecycle regression then demonstrated **12 new
programs and 12 deletions across three unchanged frames**: counts changed from
8 created / 4 deleted to 20 / 16. The existing renderer disposed its old scene
before rendering the replacement, releasing the last references to reusable
shader programs.

`graph-webgl-three.ts` now renders the replacement before disposing the old scene.
New materials acquire program references first. Failure disposes the replacement
and leaves the old scene owned. The real-browser regression verifies zero program
creation/deletion across those warmed, unchanged samples after repair. Scene
geometry, camera, semantic sources and animation are unchanged. One old/new scene
overlaps during handoff; the old scene is still retired each successful frame.
This does not eliminate geometry allocation or certify every WebGL mechanism.
Preserve this separable shared repair when revising the attention treatment.

### Verification and review boundary

- 46 focused tests passed: attention holds and deterministic reverse/seek,
  mathematics, the existing stage, camera alignment and Graph3D contracts.
- `npm run typecheck` passes the app, node, tests, Svelte and domain checks.
- `npm run visual:gradient-contour` passes five scoped Chromium checks: ordinary
  controls, phone/reduced motion and touch in both directions, stationary prose,
  local replay/interruption, mouse/wheel reversal, actual shader-program reuse,
  and the original reference host. A complete post-repair run passed; the combined
  attention interaction case took 13.8 seconds, versus earlier runs near/over
  60 seconds. These are diagnostic observations, not a controlled performance
  benchmark or a claim about every browser/device.
- Discovery first caught a wrapper min-width regression; containment assertions
  now protect the stage and reading pane. Harness repairs refresh viewport-relative
  pointer coordinates after scrolling and keep full-page capture outside held
  contacts. The combined motion/capture case has the same bounded 60-second ceiling
  as the existing primary review case; it was not raised further to hide the stall.
- Scratch profiling code was removed; durable evidence is the committed tests and
  scoped npm command. Theseus records failures, reruns and the review stop.

Please judge this one passage: before motion, is it obvious what to watch; during
motion, can you follow the comparison without chasing text; afterward, does the
held evidence make the maximizing inference easier to explain?

The reversible attention unit is the gradient-only score/host/style treatment.
No new dependency, clock, renderer or global attention store was added. Source-only
editing, independent explanations, broader browser/release checks and promotion
remain G4–G6 work after visual acceptance. No learner-efficacy claim is made.
Resume context: `theseus work context next-action.kp.gradient-contour-intuition --mode brief`.

## Previous revision: motivation and inspectable mechanism

The user accepted the motivation principle and requested implementation after
finding the first primary clear but insufficiently explanatory. Acceptance of
the principle is not visual acceptance of this repair. G3 remains the gate.
See `../decisions/2026-09-10-motivation-as-explanatory-context.md`.

The current card has **eight** stops: choose a direction; contour map; follow
the contour; tangent; local flat approximation; decompose a direction; turn
straight across; name the gradient and return to the motivating choice.

The opening compares equal horizontal distances, not physiological effort or
surface walking distance. The local-ramp view is explicitly a first-order
approximation, magnified through the canonical camera projection. It is not a
new exact contour. The original surface equation is hidden while that approximation
is foregrounded, and the accessible description identifies the active model.

The same directional differential supplies the plane, across/along components
and numerical evidence. The dashed along-contour part contributes zero rise;
the solid across part supplies all the local rise. A quarter-circle in horizontal
coordinates, projected onto the local plane, marks equal horizontal distance.
As the direction turns along that arc, the sideways part vanishes and the
across part reaches one. The final map view names the resulting uphill normal
as the gradient. Point/tangent/direction owners persist across the views.

An explicit lightweight editorial brief lives alongside the sequence, with
reader context, motivating gap, precise success criterion, bridge, evidence-beat
references, payoff and boundary. Tests check evidence references and mathematics,
not whether this framing actually teaches well. There is no universal schema
or catalogue enforcement; the accepted principle is discoverable from the active
thread and its decision record.

Current verification: 19 focused tests covering model, sequence, decomposition,
first-order error, stationary behavior, camera alignment and reference-stage
contracts; all three scoped Chromium browser checks including phone, reduced
motion, intermediate playback, bidirectional gestures and exact reverse seeks.
The first browser run caught signed roundoff displayed as negative zero; the
unit-vector component boundary now canonicalizes machine-scale zeros, with a
regression assertion. The rerun passed. Full typecheck and Theseus validation
are recorded with the repair's execution evidence. Browser captures of the
component and straight-across endpoints were inspected.

Please judge: does the opening make the question worth asking; does the ramp
explain why only the across part contributes; does the equal-distance arc make
the maximizing argument visible; and are the eight stops comfortably paced?

The new bounded overlay adapter is the reversible visual unit; it reuses the
existing stage's projection mathematics and shared clock/controls. No shared
renderer changes were needed in this revision. Source-only editing and the
independent sub-explanation remain gated. Broad release checks remain G6.

## Original six-stop checkpoint (historical evidence)

The following describes the first G2 candidate, not the current eight-stop
choreography. Preserve its shared-camera repair and verification as provenance;
the current revision above supersedes its pedagogical sequence.

## What to judge

Use the arrows for six stops, and scrub or swipe to inspect the motion between
them. Mouse dragging preserves text selection: drag blank passage space or the
figure; touch/trackpad passage travel remains native.

1. Can you track the same point and level set as the surface turns into a map?
2. Does following the contour communicate constant height, and does the tangent
   communicate zero **instantaneous** rise without implying a finite straight
   step stays level?
3. Does rotating the equal-length direction with its signed rate make the
   gradient's perpendicular, greatest-increase direction understandable?
4. Are the scale, pacing, text, numerical evidence and controls comfortable,
   including on a phone? These choices are provisional until accepted.

The primary is f(x,y)=x²+2y² at (1,½), height 1.5, gradient (2,2).
Stops are height, contour, contour-following, tangent, downhill and uphill.
The direction is normalized; the display arrow is a direction glyph, not an
assertion about a finite endpoint's height. A straight tangent step of length
0.2 rises by 0.06 despite its zero first-order term.

## Implementation and boundaries

The new bounded source/model uses the existing expression compiler for height,
notation and gradient. Regular and stationary points have distinct types;
direction comparisons require a checked normalized direction. The primary
sequence is a pure playhead projection with six semantic checkpoints.

The existing surface-contour stage, Graph3D/WebGL renderer, SVG contour owner,
Focus Deck scaffold, checkpoint playback, keyboard handler, native-input owner
and timeline clock are reused. A small question-specific overlay adds the point,
tangent and direction, projected through the stage's actual fitted camera.
No new renderer, clock, global salience state or reusable motif API was created.
The visual-salience skill kept identity and deterministic projection separate
from this provisional treatment; no catalogue-wide promotion occurred.

Source-only visual reuse is **not delivered yet**: the primary's prose/sequence
is fixed, and its existing stage still owns the fixed quadratic. G4 follows
acceptance, joining changed coefficients/point, derived evidence and real Apply.
G5 adds the independent tangent explanation, exact return and coherent readings/
self-check. G6 still requires release checks, including a clean full npm test.

## Shared defect found and repaired

Inspection reproduced a pre-existing mismatch in the original contour host:
the WebGL scene root used the destination camera's origin/scale while its camera
angles and SVG annotations used the sampled camera. The surface floated above
the intersection and could be clipped. `graph-webgl-three.ts` now uses the
sampled camera for the root transform too. No equation-specific offset was added.

`tests/graph-webgl-camera-origin.test.ts` failed at the source endpoint before
the repair and passes afterward. It compares actual Three.js camera/root matrix
projection against the SVG projection across five transition positions. Browser
captures of both hosts were inspected after repair. This necessarily corrects
the original host's faulty positioning while preserving its scene, motif,
level-set identity, level control and renderer ownership.

The reversible exemplar unit is its new route/model/sequence/entry/style and
scoped tests/config. The camera fix and its regression test are a separable
shared repair; do not remove that repair merely to revise the exemplar's look.

## Executed evidence

- `npm run typecheck`: clean final exit across app, node, tests, Svelte and
  domains. First attempt exposed a widened literal brand and insufficient union
  narrowing; both were repaired. A complete rerun passed after the camera fix.
- `node --disable-warning=ExperimentalWarning --test tests/graph-webgl-camera-origin.test.ts tests/graph-webgl.test.ts tests/graph-3d-runtime-protocol.test.ts tests/gradient-contour-model.test.ts tests/gradient-contour-sequence.test.ts tests/kinetic-figure-surface-contour.test.ts tests/stage-fit-contract.test.ts`:
  37 tests passed, covering mathematics, deterministic sampling, canonical camera
  alignment and existing Graph3D/stage contracts.
- `npm run visual:gradient-contour`: all three Chromium checks passed. Full-motion
  intermediate samples, reverse interruption, mouse gesture settlement in both
  directions, text/count coherence, direct seek reproducibility, phone layout,
  reduced motion, native canvas and the original host's level control were checked.
  Initial browser attempts exposed test assumptions: motion preference needed
  explicit full-motion selection, and mouse text selection is intentionally not
  a drag gesture. The tests now exercise those actual input contracts.
- `git diff --check`: clean. Theseus validation is recorded in the run evidence.

Impact selection has no focused rule for these paths and recommends its broad
default. The approved G2 discovery cadence uses the focused checks above; broad
production/build, browser-cohort and full-suite verification remain G6 gates.
No broad certification, measured performance improvement or learner-efficacy
claim is made. The new route is opt-in; the shared fix adds no dependency or clock.

## Resume

Do not execute G4 before explicit primary acceptance. Retrieve the bounded state
with `theseus work context next-action.kp.gradient-contour-intuition --mode brief`.
After acceptance, record G3 complete, start G4 through the delivery skill and
continue the already-approved remaining packages without routine reapproval.
