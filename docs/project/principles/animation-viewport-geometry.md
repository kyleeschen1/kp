# Animation Viewport Geometry

Animation layout must not create a scrollbar inside the animation viewport.
Ordinary document scrolling, playback controls, and inspector panels are
outside this contract.

## Measurement Scope

Measure the animation stage and its renderer-owned layout containers at stable
semantic checkpoints: start, active midpoint, native settlement, and rewind.
The catalog audit uses narrow, medium, and desktop viewport widths.

Two findings are intentionally distinct:

- **Nested scrollbar:** a measured layout container uses `overflow: auto` with
  a real scroll range, or uses `overflow: scroll` on either axis.
- **Content overflow:** rendered content extends beyond a layout container,
  regardless of whether CSS exposes, clips, or scrolls it.

The first violates the user-facing requirement. The second prevents a false
pass where a scrollbar disappears only because overflow was hidden.

KaTeX-internal structural crops, such as radical tail masks, are not animation
layout containers and remain governed by the ink-bound contract.

## Required Invariants

1. Animation layout containers have zero nested-scrollbar findings.
2. Content fits without clipping glyph ink, shadows, or traveling material.
3. Responsive fitting uses native typography and layout geometry.
4. Active choreography never scales a whole equation as one transformed box.
5. Motion space is reserved before tokens travel outside their native locus.
6. Direct seek and rewind measure the same semantic pose.

The default measurement tolerance is one CSS pixel so browser subpixel
rounding does not become a false failure.
