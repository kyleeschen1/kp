# WebGL KaTeX Artifact Morph Design

Date: 2026-07-09
Status: approved direction

## Purpose

KP needs a better visual layer for notation changes where the semantic plan is
correct but the rendered motion still feels like disconnected stickers. The
immediate examples are:

- `x^{1/3} -> \sqrt[3]{x}` or `x^{1/2} -> \sqrt{x}`;
- matrix square brackets changing into parentheses;
- non-persistent operators or notation artifacts fading during expression
  rewrites.

The recommendation is: make the long-term visual goal a pixel/particle morph,
but implement v1 as a WebGL texture-blend motif. Semantic transformations remain
the source of truth. WebGL only renders selected visual motifs.

## Design Principle

The semantic layer decides identity. The WebGL layer does not.

```txt
SemanticTransformation
  -> CorrespondenceMap
  -> visual motif selection
  -> measured KaTeX groups
  -> sample(progress)
  -> DOM or WebGL renderer
```

If a token persists, like the radicand `x`, it still moves through the ordinary
semantic motion plan. If notation artifacts do not persist, like radical glyphs,
fraction bars, exponents that become root indices, or delimiters, they can be
rendered by a WebGL artifact motif.

## V1 Motif: Texture Blend

The first motif is `artifact-texture-blend`.

Inputs:

- source artifact group ids;
- target artifact group ids;
- optional persistent anchor ids that should remain DOM-rendered;
- timing beats;
- blend style.

The renderer captures source and target artifact groups into the existing KaTeX
texture atlas path, then draws them on a WebGL overlay. The fragment shader
crossfades alpha and can optionally apply a soft threshold/blur effect so two
sets of pixels feel like one piece of visual material.

V1 does not need true pixel correspondence. It only needs the source and target
textures to share a local transition frame and sample from the same clock.

## Future Motif: Pixel Flow

The target experience is `artifact-pixel-flow`.

This motif samples alpha-bearing pixels from a source group and maps them toward
alpha-bearing pixels in a target group. It can render particles, point sprites,
or a distance-field-like field. This is appropriate for the visual idea of
`1/3` collapsing into a radical index/glyph, but it must still be driven by a
semantic mapping that says what is derived, removed, or introduced.

Pixel flow should come after texture blend because it needs more policy:

- how to pair source pixels with target pixels;
- how to preserve readable typography at rest;
- how many particles to emit per glyph;
- how to handle reduced motion and low-powered devices.

## Radical Rewrite Behavior

For `x^{1/3} -> \sqrt[3]{x}`:

- `x` persists as the same semantic token and remains a DOM/transform motion.
- exponent content `1/3` is a derived or removed notation group, depending on
  the semantic transform.
- radical glyph, overbar, and optional root-index placement are target visual
  artifacts.
- the artifact motif may blend `1/3` into the root-index/glyph region while
  the persistent `x` moves into the radicand slot.

For `x^{1/2} -> \sqrt{x}`, there may be no visible target index. In that case
the exponent can texture-blend or pixel-flow into the radical glyph/overbar
artifact instead of pretending to persist as text.

## Matrix Delimiter Behavior

For bracket swaps, matrix entries persist and should not be part of the artifact
morph.

Recommended timing:

1. Matrix entries settle into their target measured positions.
2. Source square brackets fade or texture-blend out.
3. A short pause clears the delimiter area.
4. Target parentheses enter or texture-blend in.

The current issue is that parentheses arrive too early and compete with the
exiting brackets. The motif needs separate exit and entry beats for visual
artifacts, even when the semantic operation is one transformation.

## Components

`VisualMotifPlan`

- Describes visual-only rendering work attached to semantic tokens.
- References source and target motion ids.
- Carries timing and renderer preference.

`KaTeXArtifactCapture`

- Reuses existing texture atlas capture where possible.
- Supports grouped captures, not just individual token quads.
- Keeps persistent semantic tokens out of artifact captures unless explicitly
  requested.

`WebGLArtifactRenderer`

- Draws source and target artifact textures in one overlay.
- Samples the same normalized progress as the equation motion player.
- Supports `texture-blend` in v1 and can later add `pixel-flow`.

`MotionRendererRouter`

- Chooses DOM transform, existing WebGL quad transition, artifact texture blend,
  or reduced-motion fallback based on the motion plan and environment.

## Data Flow

At runtime:

1. Render annotated source and target KaTeX.
2. Measure all semantic motion ids.
3. Build the ordinary equation motion plan for persistent and non-artifact
   tokens.
4. Extract artifact motif plans from the transition metadata.
5. Capture source and target artifact groups into textures.
6. On each sampled progress value, render DOM token poses and WebGL artifact
   overlays from the same clock.
7. At rest, clear overlays and reveal the normal target/source KaTeX DOM.

Rewind samples the same motif plans backward. There is no separate reverse
animation.

## Error Handling And Fallback

If WebGL is unavailable, texture capture fails, or a referenced artifact id is
missing:

- keep the semantic DOM animation;
- use fade-only artifact entry/exit;
- record diagnostics on the demo element for tests and debugging.

Reduced-motion mode should skip pixel flow and use direct fades or instant
state changes.

## Testing

Tests should prove rendered behavior, not only plan shape:

- Browser test that a radical persistent `x` moves by bounding box while
  artifact pixels render separately.
- Browser test that bracket entries remain stable while delimiters use artifact
  timing.
- WebGL pixel-read test that the texture-blend overlay renders nontransparent
  pixels during the blend beat and clears at rest.
- Unit tests that motif plans reject missing source/target artifact ids.
- Rewind test that texture-blend opacity/threshold samples exactly backward.

## Non-Goals For V1

- Building a full glyph-to-glyph optical-flow engine.
- Replacing KaTeX layout or typography.
- Letting pixel morphs decide semantic identity.
- Using WebGL for every token by default.
- Solving arbitrary LaTeX diffing without semantic transform metadata.

## Implementation Slices

1. Add `VisualMotifPlan` records for radical and matrix artifacts.
2. Add grouped artifact capture on top of the existing KaTeX texture atlas path.
3. Add a minimal `texture-blend` WebGL renderer.
4. Route radical and matrix artifact motifs through the renderer.
5. Tune radical and matrix beats with browser tests.
6. Add the later `pixel-flow` motif once texture blending is stable.
