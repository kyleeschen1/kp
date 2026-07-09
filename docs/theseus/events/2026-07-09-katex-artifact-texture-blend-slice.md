# KaTeX Artifact Texture Blend Slice

Target: `frontier.rendering.katex-artifact-texture-blend-v1`

## Summary

Fixed grouped KaTeX texture capture for nested layouts and added the first
option-B WebGL artifact texture-blend primitive.

The capture fix has two parts:

- recursively inline computed layout, text, and border styles onto cloned KaTeX
  descendants before rasterizing through SVG `foreignObject`;
- measure a visual-union capture rect for grouped artifacts, because KaTeX
  vlist/fraction descendants can paint outside the parent element's shallow DOM
  rect.

The new `artifact-texture-blend` primitive samples source and target artifact
quads from the same global clock, remaps that clock into a beat-local interval,
and rounds sampled unit progress so scrub/rewind opacity values stay stable.

## Sources

- `src/rendering/katex-texture-atlas.ts`
  - Added `measureKatexTextureCaptureRect`.
  - Added recursive computed-style inlining for capture clones.
  - Added capture-frame offsetting so a visual-union rect can contain an element
    whose own DOM rect is smaller than its painted descendants.
- `src/rendering/katex-artifact-texture-blend.ts`
  - Added the `artifact-texture-blend` plan, frame sampler, transition-plan
    adapter, and WebGL renderer wrapper.
- `tests/katex-transition.browser.spec.ts`
  - Added a browser regression for grouped fraction capture preserving stacked
    numerator/rule/denominator geometry.
- `tests/katex-artifact-texture-blend.test.ts`
  - Added unit coverage for beat-local sampling, reversible progress, missing
    atlas regions, and the existing WebGL quad-renderer adapter.

## Red/Green Evidence

- Red: `npm run test:browser:katex -- -g "KaTeX texture atlas preserves nested fraction geometry"`
  - Failed with grouped fraction capture compressed to `12/22px`, confirming the
    shallow clone lost nested KaTeX layout.
- Red: same browser test after recursive style inlining
  - Failed with one row cluster, revealing the second root cause: `.mfrac`
    visible children extend outside the parent rect.
- Green: same browser test
  - Passed after using visual-union capture rects and capture-frame offsetting.
- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-artifact-texture-blend.test.ts`
  - Failed because the texture-blend module did not exist.
- Green: same focused Node test
  - Passed after adding the option-B primitive.

## Next Hook

The demo controller can now build artifact group tokens from source/target
motion anchors, create a texture atlas with visual-union rects, and route a
radical or matrix delimiter pair through `createKatexArtifactTextureBlendRenderer`.
That wiring should be a separate small slice because it introduces async texture
capture into the currently synchronous equation-motion frame path.
