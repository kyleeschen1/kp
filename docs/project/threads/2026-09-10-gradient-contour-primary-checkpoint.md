# Gradient / contour primary review

Outcome: HUMAN_CHECKPOINT. The approved proposal remains the scope authority;
`run-contract.kp.gradient-contour-intuition-v1` owns live progress. This is a
review packet, not release certification or a second execution plan.

Review at http://localhost:8000/experiments/kinetic-figure/gradient-contour/.
The existing shared server was verified; no second server was started.

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
