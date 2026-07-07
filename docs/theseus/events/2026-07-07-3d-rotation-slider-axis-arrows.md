# 3D Rotation Slider, Axis Arrows, and Saddle Edge Contrast

## Context

The editor is using semantic graph objects that compile into SVG-backed HTML assets. The current 3D saddle renderer already projects filled surface quads and splits axes into visible and fake-occluded layers.

## Recommendation

Treat this as a renderer/editor interaction slice, not a semantic object redesign. The existing `Graph3DObject.camera.azimuthDegrees` field is the correct semantic home for z-axis rotation, and the slider should update that camera value directly.

Use black axes with opacity differences for fake occlusion instead of changing axis hue. Hidden axis pieces should remain only slightly more translucent than visible pieces, since the goal is a semantic "behind the mesh" cue rather than disappearing geometry.

Add arrowheads to both ends of each axis using `marker-start` and `marker-end`, with marker size still derived from endpoint depth. Add a dark blue projected perimeter outline around the saddle for contrast.

For future transform-only surface animation, triangulate internally. Any projected 2D triangle can be mapped exactly to another projected triangle with a single affine transform, while arbitrary quadrilateral deformation cannot generally be represented by translate/rotate/scale/skew alone. Keep the semantic object as a surface, but use triangles as an animation implementation detail if profiling later justifies transform-driven animation.

## Record

- Added renderer metadata for `data-kp-camera-azimuth-degrees`.
- Changed 3D axes to black strokes with `data-kp-stroke-extra-px="1"` and a 3.5px effective stroke width.
- Raised hidden axis opacity into the same visual range as visible axis opacity, keeping hidden pieces only slightly more translucent.
- Added negative-end and positive-end SVG markers for both axis ends.
- Added `graph-surface__edge-outline` as a dark blue projected saddle perimeter.
- Added a z-rotation range slider for 3D graph previews.
- Added `updateGraph3DAzimuth` to update the semantic JSON immutably.
- Wired the client so slider input updates the semantic document, JSON pane, and matching 3D SVG preview.
- Updated `docs/semantic-editor-first-pass.md` with the new renderer behavior and triangle-transform animation direction.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`: passed, 12 tests.
- `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`: passed, 5 tests.
- `npm run typecheck`: passed after strict DOM typing fixes.
- `npm test`: passed, 39 tests.
- `npm run build`: passed.
- `curl -I http://127.0.0.1:8000/`: returned HTTP 200.
- `curl -s http://127.0.0.1:8000/api/health`: returned `{"status":"ok","service":"kinetic-press-api"}`.
- Runtime compile smoke against `POST /api/compile`: passed with status 200 and confirmed black 3.5px axes, subtle hidden opacity, negative and positive arrow markers, marker-start and marker-end, saddle edge outline, z-rotation slider, z-rotation axis metadata, and azimuth SVG metadata.

## Theseus CLI Status

`theseus.config.json` exists. `npm run theseus -- project-state --limit 5` still fails because this repository has no `theseus` npm script, so this event records the slice manually under `docs/theseus/events`.
