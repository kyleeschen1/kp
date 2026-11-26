# Saddle section and planar return: visual checkpoint

Date: 2026-11-25
Outcome: HUMAN_CHECKPOINT — the bounded implementation and checks are complete;
the plane treatment and camera choreography await the user's judgment.
Authority: [approved section exemplar](../2026-11-25-graph-sections-planar-pilot.md).
Preserve the [accepted grid/saddle](2026-11-25-direct-webgl-graph.md), including
plain axis labels. This does not replace Three.js or promote a shared renderer.

## Inspect

Open <http://127.0.0.1:8000/experiments/direct-webgl-graph/?example=section> on the
managed product service. Rotate in 3D first. Move **Plane y=c** or choose **Sweep
slice**; the red section and its equation follow the same fixed-coordinate rule.
Choose **Inspect in 2D**, then **Return to 3D**. The parabola uses the plane's x/z
coordinates and the return restores the saved angle. The **3D ↔ 2D** slider can
seek directly or interrupt a turn. A second button press reverses an active turn.
Change c or d in the planar view, then return to see that section in its surface.

Judge whether the plane is clear without competing with the curve, whether the
surface withdrawal preserves context during the turn, and whether the same curve
is easy to follow. Check light/dark themes and narrow layout. Camera dragging is
locked during planar inspection; Home/Reset explicitly restores the initial 3D
camera. Grid and Saddle tabs retain their original controls and explicit Three
comparison. Entering the section closes or cancels that comparison.

## Authority and implementation boundary

Canonical source: `src/experiments/direct-webgl-graph/section.ts`. Its y=c
specialization uses the existing saddle evaluator; numeric tests compare retained
curve points with `createSaddleSurfaceExpression(d)` across c and d. The fixed
source, intersection, equation and coordinate basis have stable semantic identities
and source relations through the existing semantic-scene and salience-plan owners.

The existing Graph3D projector supplies the camera. Azimuth 90°, elevation 0°
faces the x/z plane exactly. Inspection derives that camera from one semantic
playhead without modifying the saved camera or surface. The existing XY-flattening
descriptor is not appropriate here: this is an XZ section, not a dimensional
reduction of the saddle. Source, view and paint remain separate.

The direct GPU adapter keeps one curve throughout; it never swaps to a cloned 2D
curve. Scene projection resolves target/context presence together. Curve and plane
segments share the retained line buffer; c, d and camera changes update uniforms.
One extra shader program paints the plane without another geometry buffer. A small
depth bias resolves coincident section/surface ink; ordinary depth occlusion remains.
The surface withdraws toward the theme background and is absent at the planar
endpoint. Native labels remain independent of geometry scale and have no backing.

Two local existing reader timeline clocks own scan and camera inspection. Starting
one stops the other; mode changes, offscreen/hidden state, context loss and disposal
pause or dispose all owned clocks. Reduced motion seeks exact endpoints. Unavailable
graphics exposes a static section using the same retained basis/projector and a
clear omission of surface shading; equation, c/d and inspection controls remain
usable, autoplay is disabled, and retry preserves the current source and camera.

This adds experiment-specific rendering and controls, not source-only notebook
authoring. Generic clipping, capping solids, arbitrary implicit intersections,
other shapes, persistence integration and a shared adapter remain outside scope.
No general performance superiority over Three is established.

## Evidence and costs

- `npm run test:direct-webgl-graph`: 9 checks, including canonical intersection
  values, retained topology, camera projection, exact endpoints/return, unchanged
  source, semantic identities and invalid numeric boundaries.
- `npm run typecheck:direct-webgl-graph`: passed for the whole experiment,
  reference adapter, measurement and both test entrypoints.
- `npm run visual:direct-webgl-graph`: all 12 Chromium workflows passed. Includes
  actual GPU paint, linked equation updates, a pixel-identical saved-camera return,
  mid-turn reversal/direct seek, c/d updates in 2D, unchanged buffer uploads,
  mode switching, loss/retry/disposal, reduced motion, offscreen pause, unavailable
  graphics, and closing or switching modes during a delayed comparison import.
  Captures cover 3D, midpoint, planar, dark and 390px layout. They are disposable
  evidence, not approved visual goldens or phone hardware certification.
- `npm run test:graph-3d-runtime`: 42 existing owner/preservation checks passed.
- `npm run test:project-vision`: 75 checks passed after reconciling the approved
  successor. The final checkpoint record is rechecked with that same command.
- `npm run check:playwright-configs` and `npm run check:typescript-configs`: passed;
  the same scoped browser command and configuration are retained.
- `npm run measure:direct-webgl-graph`: complete production import closure remains
  Three-free until explicit comparison. Includes HTML, JS, CSS and emitted fonts;
  gzip is a per-file estimate, not measured HTTP traffic.

| Payload | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Initial JavaScript | 93,931 | 29,938 |
| Additional comparison JavaScript | 528,195 | 131,669 |
| CSS | 4,685 | 1,695 |
| Complete emitted HTML/JS/CSS/fonts | 671,436 | 207,770 |

Initial JavaScript grows by 17,479 raw / 4,890 gzip bytes versus the prior pilot.
Geometry grows by 3,080 bytes to 302,944 bytes, retaining three GPU uploads,
9,409 surface vertices and 18,432 triangles. Shader/framebuffer/driver allocations
are not included in geometry bytes. The flat endpoint omits the surface draw.

In the final isolated Chromium 149 / ANGLE SwiftShader suite, the section sweep
sample (59 RAF intervals) measured median 16.7 ms, p95 16.8 ms, maximum 17.1 ms;
p95 JavaScript/WebGL submission was 0.20 ms. The original saddle measured p95
16.9 ms between frames and 0.10 ms submission. These are short headless software
rendering measurements, not GPU-completion times, physical device results or a
Three benchmark. An earlier section sample measured p95 17.4 ms.

## Repairs and reproducibility

An initial numeric assertion distinguished signed zero despite equal geometry;
the repaired assertion uses the same bounded numeric tolerance as the source
comparison. Type checking exposed union inference in `flatMap`; an explicit local
entity-sample type preserves both focus/context variants without casts.

The first round-trip screenshot check compared different native focus-ring states.
Its byte-buffer failure formatter stalled; the owned worker was terminated. The
repaired harness compares the same unfocused canvas and reports a bounded boolean
pixel-equality result. The complete 12-workflow suite then passed. No product
check was removed to hide those failures.

Theseus owns verification records, context closure and the review stop in
`run-contract.kp.graph-sections-planar-20261125` (one delivery package). The generic
handoff still selects a historical unrelated run; resume this scope explicitly
with `theseus work context task.kp.graph-sections-planar-20261125 --mode brief`.
Acceptance of this exemplar is separate from selecting another shape, promoting
an adapter or returning to the proposed matrix authoring work.
