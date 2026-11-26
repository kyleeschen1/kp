# Staged saddle withdrawal: visual checkpoint

Date: 2026-11-25
Outcome: HUMAN_CHECKPOINT — implemented and checked; timing and foreground
treatment await user judgment.
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

## Evidence

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

## Costs and limits

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
