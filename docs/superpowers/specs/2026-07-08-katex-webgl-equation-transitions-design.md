# KaTeX WebGL Equation Transitions Design

## Summary

Build a WebGL transition overlay for arbitrary rendered KaTeX equations. The real
KaTeX HTML remains the semantic and accessible source of truth. During a
transition, the runtime temporarily blanks the visible KaTeX, draws a WebGL copy
of the equation tokens, interpolates those token copies to their target
positions, then removes the overlay and reveals the target KaTeX.

V1 supports arbitrary LaTeX rendered through KaTeX. Because arbitrary LaTeX does
not carry our semantic expression IDs, V1 uses deterministic visual token
matching. Later authored lessons can add semantic token IDs or aliases to
override the heuristic when exact pedagogical identity matters.

## Goals

- Transition between two already-rendered KaTeX equation states.
- Keep source and target equations present as semantic HTML for accessibility.
- Use WebGL only for the temporary animated visual copy.
- Support arbitrary KaTeX output, not only expressions generated from KP math
  objects.
- Move matched tokens from source rects to target rects.
- Fade source-only tokens out in place.
- Fade target-only tokens in at their final positions.
- Fail softly to a DOM/CSS crossfade when WebGL, texture capture, or stable
  measurement is unavailable.

## Non-Goals

- Replacing KaTeX layout or typography with a native WebGL text renderer.
- Rebuilding a complete mathematical expression AST for arbitrary LaTeX in V1.
- Guaranteeing perfect semantic matching for repeated ambiguous symbols in V1.
- Exporting the transition as static video or image assets.
- Pixel-perfect visual diff testing of every animation frame.

## User Experience

At rest, users see normal KaTeX HTML. Screen readers and copy/select behavior
continue to use the DOM representation. When a transition starts, the equation
area remains the same size and the visible DOM text goes transparent. A WebGL
canvas overlays the same screen-space rectangle and animates token textures.
When the transition ends, the canvas is removed and the target KaTeX is visible.

For reduced-motion users, the default should be a quick crossfade or instant
swap instead of token motion.

## Architecture

The feature has five core units.

### `katex-token-snapshot`

Walks a rendered KaTeX subtree and produces a list of motion tokens.

Each token should include:

- stable runtime ID within the snapshot;
- text content;
- normalized class/style signature;
- bounding client rect in viewport coordinates;
- local rect relative to the transition overlay;
- row or baseline bucket inferred from vertical position;
- element reference for capture and diagnostics.

V1 should group rendered KaTeX spans into practical visual tokens rather than
every individual DOM leaf. A token may be a symbol, operator, number, or a small
subexpression when KaTeX markup is too fragmented to capture safely.

### `katex-token-matcher`

Builds a transition plan from source and target snapshots.

Matching priority:

1. Exact normalized text plus class/style signature.
2. Same text with compatible class/style signature.
3. Same row or nearest baseline bucket.
4. Stable order within each equivalent candidate group.

The matcher must be deterministic. If two source tokens and two target tokens
are equivalent, source order maps to target order. Ambiguity is acceptable in V1
as long as it is stable and diagnosable.

The matcher emits three groups:

- `matched`: source token and target token pair;
- `sourceOnly`: source token fades out in place;
- `targetOnly`: target token fades in at target position.

### `katex-texture-atlas`

Creates WebGL-ready texture regions for the tokens in a transition plan.

The preferred V1 path is DOM raster token textures. KaTeX remains responsible
for all typography, sizing, kerning, fractions, delimiters, and matrix layout.
The atlas captures token appearances from the already-rendered DOM and packs
them into one or more textures. If an individual token cannot be captured
cleanly, the implementation may capture a larger parent token or mark that token
for fade-only fallback.

The atlas result should include texture coordinates, pixel dimensions, and
device-pixel-ratio information so the WebGL overlay can draw crisp quads.

### `katex-webgl-transition`

Owns the canvas overlay, renderer lifecycle, animation loop, and cleanup.

The renderer draws screen-space textured quads. It should not need a 3D camera.
Each quad interpolates:

- position;
- size or scale;
- opacity;
- optional color tint for debugging only.

The renderer should lazy-load its heavier WebGL code, following the existing
graph renderer pattern where possible. The main app should not pay the WebGL
transition cost until a transition is requested.

### `katex-transition-controller`

Provides the public DOM API:

```ts
transitionKatexEquations(sourceEl, targetEl, options)
```

The controller coordinates measurement, matching, texture creation, blanking,
animation, cleanup, and fallback. It should accept two elements that already
contain rendered KaTeX. It should not parse author intent directly.

## Data Flow

1. Render source and target equations as KaTeX HTML.
2. Place target in a hidden-but-measurable state or staging layer.
3. Snapshot source tokens and target tokens before any visual blanking.
4. Create the deterministic transition plan.
5. Build the token texture atlas.
6. Add an absolutely positioned canvas over the combined equation bounds.
7. Apply a CSS class that visually blanks the real KaTeX while preserving layout
   and accessibility.
8. Animate WebGL quads using the transition plan.
9. Remove the overlay and renderer resources.
10. Reveal the target KaTeX and remove or hide the source KaTeX according to the
    caller's DOM ownership model.

The important contract is ordering: measure and capture first, blank second,
animate third, restore DOM last.

## Fallbacks

The system should fail soft.

- No WebGL: use a DOM/CSS source-to-target crossfade.
- Texture capture failure for a token: capture a larger parent token or fade the
  token instead of moving it.
- Ambiguous matching: use deterministic order matching and report diagnostics.
- Layout shift between snapshot and animation start: abort WebGL and reveal the
  target normally.
- `prefers-reduced-motion: reduce`: use crossfade or instant swap.

The transition result should expose diagnostics:

- source token count;
- target token count;
- matched count;
- source-only count;
- target-only count;
- texture count;
- duration;
- renderer used;
- fallback reason, if any.

## Testing Strategy

Test this in layers.

- Unit tests for token grouping from simplified DOM fixtures.
- Unit tests for deterministic token matching, including repeated symbols.
- DOM tests that render KaTeX and snapshot real KaTeX spans.
- Browser tests in Chrome that run a transition and verify:
  - source and target KaTeX remain in the DOM during the transition;
  - visual blanking is applied only while the overlay is active;
  - a WebGL canvas appears during the transition;
  - the canvas and transient classes are removed afterward;
  - target KaTeX is visible at the end.
- Fallback tests for reduced motion and missing WebGL.

Visual smoke cases:

- repeated variables such as `x + x`;
- fractions;
- superscripts and subscripts;
- matrices;
- target-only and source-only operators;
- equations whose target has a different bounding box.

## Open Follow-Up Work

- Decide the exact DOM rasterization strategy after a prototype verifies browser
  support and visual fidelity.
- Add optional semantic token IDs or author aliases after the arbitrary-KaTeX
  heuristic path works.
- Add performance budgets after measuring token count, texture atlas size, and
  frame time on slower devices.

## Implementation Note

The V1 implementation uses a small direct WebGL compositor for screen-space
token quads. It does not use Three.js for equation transitions because the
renderer does not need scene graph, camera, lighting, or depth behavior.
