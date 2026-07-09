# Radical Artifact Pixel Flow Prototype

Target: `frontier.rendering.radical-artifact-pixel-flow-v1`

## Summary

Replaced the radical fixture's routed WebGL `artifact-texture-blend` overlay
with an `artifact-pixel-flow` prototype.

The first routed case is still intentionally narrow:

- source artifact: `radical.rewrite-power-as-root.source.exponent`;
- target artifact: `radical.rewrite-power-as-root.target.radical`;
- persistent semantic token: `radical.rewrite-power-as-root.source.x` to
  `radical.rewrite-power-as-root.target.x` remains DOM semantic motion.

This tests the stronger motif: source notation is sampled as alpha-mask
particles, paired deterministically with target artifact pixels, and rendered by
a raw WebGL point-sprite shader on the same scrub/rewind clock as the rest of
the equation motion plan.

## Sources

- `src/rendering/katex-artifact-pixel-flow.ts`
  - Added the pixel-flow plan, reversible beat-local progress sampler,
    deterministic source/target point pairing, atlas alpha-mask sampling, and
    raw WebGL point-sprite renderer.
- `src/editor/equation-motion-demo-controller.ts`
  - Routed the radical artifact overlay through `artifact-pixel-flow`.
  - Exposes mode, renderer, source/target ids, and particle count as DOM
    diagnostics for browser verification.
- `tests/katex-artifact-pixel-flow.test.ts`
  - Added red/green unit coverage for clock sampling, deterministic pairing,
    and no-jump interpolation.
- `tests/katex-transition.browser.spec.ts`
  - Updated the radical overlay assertion to expect `pixel-flow`,
    `webgl-pixel-flow`, `1024` particles, and visible WebGL pixels.

## Red/Green Evidence

- Red: `npm test tests/katex-artifact-pixel-flow.test.ts`
  - Failed because `src/rendering/katex-artifact-pixel-flow.ts` did not exist.
- Green: same focused Node test
  - Passed after adding the pixel-flow module.
- Green: `npm run test:browser:katex`
  - Passed after routing the radical fixture overlay to the pixel-flow renderer.

## Next Hook

The current target anchor is the existing `target.radical` visual artifact,
which maps to the current KaTeX structural annotation. A better radical-shaped
flow needs a grouped visual artifact capture that includes the sqrt glyph and
rule while excluding the persistent radicand `x`.
