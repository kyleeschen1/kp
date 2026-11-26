# Restricting the saddle to a cross-section

Date: 2026-11-26
Outcome: HUMAN_CHECKPOINT — one implemented and checked exemplar; choreography
awaits judgment. [Approved scope](../2026-11-26-graph-section-clipping.md).
The [accepted head-on correction](2026-11-25-graph-section-withdrawal.md) remains
preserved. Reusable-player design and shared renderer promotion remain separate.

## Inspect

Open <http://127.0.0.1:8000/experiments/direct-webgl-graph/?example=section> in
Firefox. Choose **Inspect in 2D**, then **Return to 3D**. The opaque saddle and
its wireframe retreat from both sides toward the red section as the camera turns.
The surviving surface retains its shape; it is neither squeezed nor faded. At
the front, only the section and its coordinates remain. Reverse reopens the same
surface and restores the saved camera.

Scrub **3D ↔ 2D** to roughly one-quarter, halfway and three-quarters: a broad
surface becomes a strip around the curve, then a narrow strip. Move **Plane y=c**
to another position and repeat. At c=±3 the selected section is already on a
boundary, so only the side containing surface retreats. Click the turn button
again mid-motion to reverse without reconstructing state.

Judge whether the moving boundaries make restriction to y=c easy to recognize,
whether the curve stays clear, and whether clipping and rotation are well paced
together. The existing 1.6-second turn/easing is retained provisionally. The two
clipping planes are expressed by the cut edges, without extra painted panels.

## Responsible change and preservation

The original issue is conceptual: a head-on projection combines depths; it does
not select the surface at one y value. `resolveSectionFrame` now narrows the
visible domain from [-3,3] toward c using the existing inspection playhead.
The frame distinguishes an absent surface from a bounded slab. Validated inputs
and the pure projection keep bounds ordered and retain the selected section.
The earlier one-degree head-on guard still skips all surface submissions,
including manual rotation; its small endpoint tolerance is preserved.

The direct WebGL adapter passes the bounds to the existing surface shader.
Fragments outside the slab are discarded; retained fragments remain opaque.
Mesh derivatives are evaluated before discard to retain ordinary wire coverage.
The obsolete fill/wire opacity uniforms and translucent depth prepass are removed.
The section/coordinate foreground ordering still prevents surface depth from
hiding the red subject. No vertices are moved, rebuilt or resampled for clipping.

Canonical host and artifact remain the experiment and its `section.ts` frame.
The saddle evaluator, Graph3D projector, scene/IDs, native labels, theme and reader
clock retain authority. Curve/grid remain WebGL; SVG stays the unavailable-context
fallback. The original grid/saddle tabs, Three comparison, lifecycle and saved
camera remain intact. This is not a general clipping API or promoted motif.

## Verification

- `npm run test:direct-webgl-graph`: 11 passed. Existing source/gradient,
  projection, curve-on-surface and identity checks remain. The former fade-order
  check is replaced by the approved interval restriction law: monotone bounds,
  section containment, edge cases, head-on absence and history-independent seeks.
- `npm run typecheck:direct-webgl-graph`: passed.
- `npm run visual:direct-webgl-graph`: 28 passed, 14 each in Chromium and Firefox.
  The new realized-pixel check compares the clipped frame with the same camera
  and full surface, then with the surface omitted. Both removed and fully retained
  paint must exist; a global fade, total disappearance or unchanged mesh fails.
  Light/dark and a seek away/back pass. The prior zero-draw manual head-on,
  source-linked equation, exact return, interruption, uploads, loss/retry,
  disposal, reduced motion, offscreen pause, phone and fallback checks still pass.
  Firefox source, halfway and narrow-strip captures were inspected.
- `npm run test:graph-3d-runtime`: 42 passed; shared consumers are unchanged.
- `npm run test:project-vision`: full rerun 75 passed. The first run passed 31/75:
  all 44 failures were the same chronology guard because the November 26 decision
  followed a November 25 snapshot stamp. After reviewing the current roadmap,
  thread, charter and selected sources, the stamp was reconciled to November 26;
  no guard or budget was changed.
- The focused orientation/vision files pass all 14 checks again after adding the
  review links. `theseus workspace validate` passes with 1,341 nodes; the tracked
  context receipt is closed and the single slice is complete at this checkpoint.
- `npm run measure:direct-webgl-graph`: initial JS 94,592 raw / 30,207 gzip bytes,
  down 417 / 100 from the preceding candidate. Lazy comparison 528,195 / 131,669;
  CSS 4,685 / 1,695; complete emitted closure 672,097 / 208,041. Gzip sums estimate
  compressed files, not measured HTTP transfer; closure includes alternate fonts.

Geometry remains 302,944 bytes, 9,409 vertices, 18,432 triangles and three uploads.
Clipping adds one two-number uniform and no GPU resource. A visible surface uses
one opaque submission, replacing the two submissions formerly used during fade.
The retained mesh still undergoes vertex processing while visible; clipping is
not a claim that all its GPU work disappears. A fully absent surface is skipped.

This browser run sampled clipping RAF median/p95/max 16.7/17.1/17.2 ms in Chromium
149 with SwiftShader and 16.66/17.56/17.66 ms in Firefox 151 (reported renderer
“Apple M1, or similar”). Submission p95 during the section sweep was 0.2 and 1 ms.
These are browser-frame/submission observations, not GPU completion or a controlled
renderer benchmark. Human judgment of the motion and broader device behavior
remain separate from these checks.

The rollback unit is the experiment-local clipping projection, shader binding
and evidence. No second caller, catalogue rollout or reusable stage is authorized.
