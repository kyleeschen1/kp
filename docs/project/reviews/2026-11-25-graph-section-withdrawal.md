# Staged saddle withdrawal: visual checkpoint

Date: 2026-11-25
Updated: 2026-11-26 — head-on presence clarification
Outcome: head-on mesh correction accepted on November 26. The user then approves
[geometric restriction](../2026-11-26-graph-section-clipping.md) as a separate
successor to the fade treatment. The original candidate evidence below remains
historical; the live demo will use the selected successor.
Authority: [approved refinement](../2026-11-25-graph-section-withdrawal.md).
The [accepted section/camera milestone](2026-11-25-graph-sections-planar.md) stays
closed. The reusable-player proposal remains separate.

## Inspect

Open <http://127.0.0.1:8000/experiments/direct-webgl-graph/?example=section>.
Rotate the starting view, then choose **Inspect in 2D**. Filled faces fade first;
the remaining wireframe fades second; the red section and its x/z coordinates
stay visible as the camera finishes settling. **Return to 3D** samples the same
sequence backward and restores the saved angle. Click again during either turn
to reverse, or use the **3D ↔ 2D** slider to inspect intermediate frames.

The provisional 1.6-second turn retains its existing camera easing. Fill withdraws
over progress 0–0.35, wire over 0.35–0.7, leaving the last 30% for clear planar
settling. At about 40% only the saddle's wire trace remains. Check whether this
order makes the curve easy to follow, and whether the foreground section/plane
feels clear in both themes. These timing numbers are local, unpromoted aesthetics.

The November 26 correction also covers manual rotation with inspection at zero.
Reload in Firefox, focus the canvas, press Right 14 times and Down 9 times from
the initial camera. This reaches azimuth 90°, elevation 1°: the saddle fill and
wireframe must be absent, while the section and coordinates remain. Toggling
**Surface grid** must change no pixels there. One Up press leaves the head-on
region and restores the mesh. **Inspect in 2D** still reaches the exact planar
endpoint with no surface submissions.

## November 26 clarification and owning boundary

The user clarified that the mesh should be completely absent when facing the
front. The earlier projection only withdrew it according to inspection progress;
a manually aligned camera at progress zero still drew the whole saddle. The new
regression reproduced that state before repair.

`resolveSectionFrame` now derives surface presence from the effective camera as
well as the existing withdrawal phases. Within a local 1° cone around either
normal to the section plane, fill and wire presence are both zero. The existing
entity-presence gate then skips every surface submission, including its depth
pass. This is hard omission, independent of opacity settings. Wrapped azimuths
and the opposite face agree; leaving that cone restores the staged state. The
tolerance accommodates the existing keyboard step without changing controls.

The section curve and grid still use the same WebGL canvas. The SVG is only the
existing unavailable-context fallback. No shader, renderer, geometry, saved
camera, source identity or shared Graph3D changes were needed for this correction.
The rollback unit is the experiment's camera-to-presence rule and its regression.

An earlier interpretation of “blank” prompted speculative draw-portability and
error-fallback work. Current test browsers already painted, and the user clarified
unwanted mesh visibility. That hypothesis and its injected diagnostic tests were
withdrawn together; their recorded failures are not evidence for this defect or a
claim of a Firefox driver repair. Firefox is now included in the existing scoped
visual command because it is the user's browser.

## Cause and responsible repair

The former surface mixed its RGB toward the background while keeping alpha at
one and writing depth. Later section/grid fragments still failed that depth test,
so an apparently vanished surface could hide them until its final removal.

The existing section projection now derives independent fill and wire presence
from the same inspection playhead. Presence is separate from contextual salience;
the source entity withdraws once both representations finish. Its mathematical
source, IDs, equation, camera projector and saved camera are unchanged. No second
clock, global store or universal rendering contract was introduced.

The experiment's surface shader emits actual premultiplied alpha for wire over
fill. During transparency, a depth-only color-masked submission resolves the
surface's own nearest fragments before its color pass, avoiding accumulation by
triangle submission order. Opaque endpoints retain one surface pass. The section
plane and lines deliberately paint as foreground with depth testing disabled;
they cannot inherit invisible surface occlusion. Every next frame re-establishes
the surface's depth state. This is an instructional foreground treatment, not
general order-independent transparency or physical clipping.

## Original candidate evidence

- `npm run test:direct-webgl-graph`: 10 passed. Canonical heights/gradients,
  section intersections, IDs, projection, saved-camera return and invalid inputs
  remain covered. Withdrawal is bounded, monotonic, ordered and independent of
  seek/reverse history; the section/basis remain present.
- `npm run typecheck:direct-webgl-graph`: passed, including the browser harness.
- `npm run visual:direct-webgl-graph`: 13 Chromium workflows passed. The new
  realized-pixel regression compares a zero-fill frame with actual surface
  submissions omitted: identical section/grid pixels in light and dark, across
  a return into fill and back. Restoring mesh lines changes those pixels before
  withdrawal completes and leaves them identical afterward. This distinguishes
  transparency from prematurely removing the whole surface.
- The same browser run preserves exact before/after camera-return pixels,
  interruption, direct seek, old tabs, three retained uploads, context loss/retry,
  disposal, reduced motion, offscreen pause, static fallback and phone layout.
  Captures inspect 3D, partial fill, wire only, partial wire, clear turn and 2D.
- `npm run test:graph-3d-runtime`: 42 passed; the shared Graph3D/Three path remains
  unchanged. Three is still absent until explicitly requested for comparison.
- `npm run measure:direct-webgl-graph`: complete production closure measured.
  See cost details below.
- `npm run test:project-vision`: complete rerun 75 passed.
- `theseus workspace validate`: valid, 1,339 nodes / 34,930 events; the tracked
  context receipt is closed and the sole delivery slice is complete. Contract
  `run-contract.kp.graph-section-withdrawal-20261125` is deferred at this visual
  checkpoint, with no remaining implementation or unapproved successor selected.

The first project-vision run passed 74/75: the updated thread was 454 words against
its existing 450-word entrypoint budget. Existing prose was compressed without
removing links or raising the limit; the complete check was rerun.

## Original candidate costs and limits

Geometry remains 302,944 bytes, 9,409 vertices, 18,432 triangles and three uploads.
No framebuffer, texture, new GPU program or geometry buffer was added. Only
translucent surface frames add a depth submission; withdrawn surfaces are skipped.
The existing leases and cleanup own all resources.

In the final isolated Chromium 149 / ANGLE SwiftShader run at 1022×408, DPR 1:
ordinary saddle RAF p95 was 16.8 ms; section sweep median/p95/max was
16.7/17.1/17.5 ms. The new withdrawal interval had 53 samples with
median/p95/max 16.7/33.4/83.8 ms. Section JavaScript submission p95 was 0.20 ms.
Earlier sweep samples also showed 33.4 ms p95; removing an unnecessary opaque
prepass did not immediately eliminate that variability. Do not attribute all
variation to that change or claim a fixed 60 fps result. This is software-rendered
browser timing, not GPU completion, physical-device evidence or a comparison with
Three. The transparent interval adds work and still needs judgment on real devices.

Initial JavaScript is 94,862 raw / 30,254 gzip bytes: +931 / +316 versus the prior
accepted section. The lazy Three comparison is unchanged at 528,195 / 131,669;
CSS is unchanged at 4,685 / 1,695. Complete emitted HTML/JS/CSS/font closure is
672,367 / 208,087 bytes. Gzip sums are estimates, not measured network transfer;
the complete closure includes alternate font formats a browser may not request.

Canonical artifact remains `src/experiments/direct-webgl-graph/section.ts`, hosted
by the existing experiment and direct WebGL adapter. The saddle evaluator,
Graph3D projector, scene/salience plan and reader clock retain semantic authority.
No other shape, reusable stage, catalogue migration or shared motif is promoted.
The rollback unit is this experiment's withdrawal projection/paint and evidence.

## November 26 verification

- `npm run test:direct-webgl-graph`: 11 passed. The new head-on regression failed
  before the change, then passed for both plane normals, wrapped azimuths and
  nearby elevations. Leaving the cone restores the staged surface state.
- `npm run visual:direct-webgl-graph`: 28 passed, 14 each in Chromium and Firefox.
  The manual-rotation check counts zero actual indexed surface submissions,
  checks unchanged pixels when toggling the wireframe, verifies that the WebGL
  section remains visible with SVG hidden, then verifies resumed drawing after
  turning away. Existing reversal, seek, exact camera return, loss/retry,
  fallback, disposal, reduced-motion, phone and theme checks remain green.
  The Firefox head-on capture was inspected: only the section and coordinates
  remain. These are automated browser results, not a claim about every driver.
- The first run passed 26/28; both new tests reached their final return check
  after confirming absence, but compared `1.6` to its floating representation
  `1.5999999999999996` as text. The wait now compares numbers within precision;
  the complete browser command passed afterward without another runtime edit.
- `npm run typecheck:direct-webgl-graph`: passed on the final harness.
- `npm run test:graph-3d-runtime`: 42 passed.
- `npm run test:project-vision`: 75 passed; entrypoint budgets are unchanged.
- `theseus workspace validate`: valid, 1,339 nodes / 34,952 events. The resumed
  context receipt is closed; the single slice is complete and the contract is
  deferred at the existing visual checkpoint.
- `npm run measure:direct-webgl-graph`: initial JavaScript 95,009 raw / 30,307
  gzip bytes (+147 / +53 from the preceding candidate). Lazy comparison
  528,195 / 131,670; CSS 4,685 / 1,695; complete emitted closure
  672,514 / 208,140. The one-byte comparison gzip difference is build-output
  variation; its raw size and implementation are unchanged. Geometry remains
  302,944 bytes and three retained uploads; this correction adds no GPU resource.

The user responds “great” to the correction, then discusses and approves geometric
clipping toward y=c. That successor replaces the provisional fading treatment;
neither candidate promotes a shared motif or starts the reusable-player proposal.
