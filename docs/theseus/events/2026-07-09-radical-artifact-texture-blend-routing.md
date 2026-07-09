# Radical Artifact Texture Blend Routing

Target: `frontier.rendering.radical-artifact-texture-blend-routing-v1`

## Summary

Routed the radical rewrite fixture through the option-B WebGL
`artifact-texture-blend` primitive in the live equation animation card.

The first routed case is:

- source artifact: `radical.rewrite-power-as-root.source.exponent`;
- target artifact: `radical.rewrite-power-as-root.target.radical`;
- persistent semantic token: `radical.rewrite-power-as-root.source.x` to
  `radical.rewrite-power-as-root.target.x` still moves through the DOM semantic
  motion plan.

This keeps semantic identity in the existing equation motion plan while using a
WebGL canvas only for the non-persistent notation artifact.

## Sources

- `src/editor/equation-motion-demo-controller.ts`
  - Added a small async artifact texture-blend render context for the radical
    fixture.
  - Captures source and target artifact anchors once, creates a texture atlas,
    and samples the renderer from the same frame progress as DOM motion.
  - Hides the DOM artifact anchors only during in-flight blend progress.
  - Records fallback diagnostics on the demo if capture or WebGL setup fails.
- `src/rendering/katex-texture-atlas.ts`
  - Forces capture roots visible and untransformed so transient DOM motion
    styles do not blank artifact textures.
  - Excludes inner SVG path/line descendants from visual-union measurement so
    radical glyph internals do not inflate atlas bounds.
- `src/styles.css`
  - Positions the equation stage and artifact overlay canvas.
- `tests/katex-transition.browser.spec.ts`
  - Verifies that the radical artifact overlay uses WebGL, references the
    expected source/target artifact ids, remains connected, and renders
    nontransparent pixels at mid-transition.

## Red/Green Evidence

- Red: `npm run test:browser:katex -- -g "editor equation motion demo uses semantic playback plans"`
  - Failed because no radical artifact texture overlay existed.
- Red: same focused browser test
  - Failed with target radical atlas overflow, revealing that SVG path
    descendants inflated the capture rect.
- Red: same focused browser test
  - Failed on zero pixels because the test sampled before async atlas upload and
    first WebGL draw.
- Green: same focused browser test
  - Passed after SVG measurement tightening and an explicit overlay-ready marker.

## Next Hook

The matrix delimiter swap can use the same renderer context pattern, but should
group left/right delimiters and keep matrix entries out of the artifact atlas.
