# Direct WebGL grid and saddle: accepted pilot

Date: 2026-11-25
Outcome: COMPLETE — user accepts the pilot; label backing corrected. Shared renderer promotion remains separate.
Authority and preservation boundary: [approved pilot](../2026-11-25-direct-webgl-graph-pilot.md).

## Acceptance and follow-up discussion

The user says “it looks great!” and identifies the labels' visible background.
Remove the paper-colored background, circular corners and padding from the existing
axis-label CSS owner; keep glyph colors, projection and mathematical state intact.
The existing scoped browser paint/theme/phone workflow passes after this correction.
This is a local presentation preference, checked with the existing visual captures;
it does not introduce a reusable attention motif or require renewed pilot approval.

The user asks about metrics, losing Three.js, shapes, sections and 3D/2D return.
The measurements below support this small scene. The brief headless software-rendered
sample does not measure GPU completion, mobile hardware or general superiority.
Original production byte counts were recorded at `e0dad595f`; the label-only CSS
correction changes stylesheet bytes, not mathematical or JavaScript behavior.

Keep renderer replacement undecided. Retained geometry and custom shading are also
possible through [Three BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html)
and [ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html). Three supplies
object transforms, picking, materials and clipping support; a custom renderer owns
those costs when they become necessary. Transparency and application resource
disposal still require deliberate handling with Three.

Proposed successor, not implementation approval: one saddle cross-section becomes
a linked 2D curve and returns to its saved 3D view. At y=c the curve is
z=(x²−c²)/d; at z=c the contour satisfies x²−y²=dc. Keep projection, cross-section
and display flattening distinct. The existing `createGraph3DTo2DTransitionDescriptor`
and camera-up handling are foundations; the direct pilot currently clamps elevation
to ±75° and does not expose an exact planar endpoint. Do not silently reduce source
dimension when rotating a view.

Basic shape meshes are feasible through the same position/index/normal pipeline;
they are not yet implemented in this pilot. A sphere or cone would later pressure
different topology. Clipping paint, constructing an intersection curve, and capping
a sliced solid are separate capabilities. Preserve mathematical identities and
geometry outside either renderer; avoid promising duplicate feature parity.
Matrix authoring remains the proposed return path after this exploration.

## Inspect

Open <http://127.0.0.1:8000/experiments/direct-webgl-graph/> on the shared product
service. Start with **3D grid**, drag or use arrow keys, then choose **Saddle
surface**. Adjust **d**, Play, Reverse and scrub during playback. Home/Reset view
restores the camera. Compare smooth lighting, surface-grid and coordinate-plane
toggles; inspect light/dark themes. **Compare current renderer** explicitly loads
the existing Three.js adapter below, using the same mathematical source and camera.

Judge whether the curved shape and depth read clearly, whether the moving surface
feels smooth, and whether the lighting/line treatment fits KP. The reference uses
its native translucent unlit material, sampling density and axes; this is a visual
comparison of two implementations, not an equal-work renderer benchmark.

The candidate's canonical fixture is `src/experiments/direct-webgl-graph/model.ts`.
Its isolated renderer retains the existing saddle evaluator/gradient, Graph3D
camera projector, reader timeline clock and context-lease owner. The notebook and
shared Three renderer are unchanged. Matrix reuse remains the proposed return path.

## What the experiment establishes

- A 97 × 97 shared-vertex saddle (9,409 vertices, 18,432 triangles) is sampled once.
  Heights and gradients scale together by 4/d; numeric tests compare the whole
  retained sample cohort against the canonical expression for d in 4–8.
- Camera and curvature samples update uniforms. Three GPU buffer uploads remain
  constant across forward motion, reversal and scrubbing. Geometry totals
  299,864 bytes, excluding shaders, framebuffers and driver allocations.
- Coordinate lines use instanced screen-space quads for predictable pixel widths.
  Smooth normals shade the opaque surface; depth testing hides occluded geometry.
  HTML labels stay separate from GPU paint. Coordinate planes can be inspected
  independently or overlaid on the saddle.
- Idle/offscreen work stops. Loss or unavailable WebGL switches to the existing
  static mathematical view, disables motion and offers retry. Retry preserves the
  current sample/camera. Disposal cancels observers, clocks, input and GPU leases;
  closing a pending comparison prevents late renderer acquisition.

## Measured limits

`npm run measure:direct-webgl-graph` builds the complete production HTML entry,
including the lazy comparison and emitted assets. Per-file gzip estimates:

| Payload | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Initial JavaScript | 76,452 | 25,048 |
| Additional comparison JavaScript | 528,195 | 131,670 |
| CSS | 4,431 | 1,637 |
| Complete emitted HTML/JS/CSS/fonts | 653,703 | 202,826 |

Both dev requests and the production import closure confirm no Three.js before
explicit comparison. Complete emitted includes both emitted font formats; actual
HTTP transfer, browser-selected fonts and server cost are not measured here.

Final scoped Chromium 149 / ANGLE SwiftShader run, 1022 × 408 physical canvas at
DPR 1: median RAF interval 16.7 ms, p95 17.3 ms, maximum 17.6 ms over 59 intervals;
p95 JavaScript/WebGL submission 0.2 ms. This is a brief headless software-rendering
sample, not GPU completion timing or device certification. A concurrent-check run
showed p95 66.5 ms; isolated repeats measured 17.2–17.6 ms. Avoid competing compiler
work when reproducing the runtime sample. Browser/driver/device comparisons,
complex surfaces, transparent sorting and shared renderer promotion remain unproved.
Removing Three does not inherently improve quality: materials, sampling, retention
and line treatment are choices that can also be implemented through Three.

## Verification and recovery

- `npm run test:direct-webgl-graph` — 6 numeric/topology/projection/boundary checks.
- `npm run typecheck:direct-webgl-graph` — complete experiment, reference, tests
  and measurement imports checked.
- `npm run visual:direct-webgl-graph` — 7 Chromium workflows, including actual
  painted pixels, responsive/theme captures, retained uploads, camera comparison,
  reversal/idle/offscreen/reduced motion, loss/retry/disposal, unavailable graphics
  and pending-import cancellation. Phone evidence is layout at 390px, not hardware.
- `npm run test:graph-3d-runtime` — 42 existing owner/preservation checks.
- `npm run test:project-vision` — 75 checks. Initial thread budget exceeded by
  three words; wording was condensed and the complete suite passed.
- `npm run check:playwright-configs` and `npm run check:typescript-configs` passed.
  The new scoped Playwright config's reviewed hash was added without changing
  existing hashes. It uses the shared server and one experiment spec.
- The first delayed-import test missed Vite's revision query and timed out.
  Matching the module pathname repaired the harness; the complete seven-test suite
  then passed. No product failure was hidden by dropping the check.
- `theseus workspace validate` passed after evidence, context receipt closure and
  checkpoint transitions. The generic handoff still elects a historical run with
  unrelated metadata gaps; use the explicitly selected pilot context below.

Screenshots and cost/runtime reports are disposable outputs of these stable commands,
not approved visual goldens. Pilot acceptance does not promote a shared renderer.

Execution owner: `run-contract.kp.direct-webgl-graph-20261125`, one delivery package.
Resume context with `theseus work start task.kp.direct-webgl-graph-20261125 --mode brief`
for bounded follow-up context. Acceptance of this pilot does not select a renderer migration or
authorize matrix authoring; either successor needs a bounded scope decision.
