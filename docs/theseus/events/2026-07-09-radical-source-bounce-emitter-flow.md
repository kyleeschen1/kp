# Radical Source Bounce Emitter Flow

Target: `frontier.rendering.radical-source-bounce-emitter-flow-v1`

## Summary

Refined the radical pixel-flow motif so the source exponent no longer streams
directly from its original mask into the radical artifact.

The new `bounce-collapse-emitter` source phase treats the exponent as a visual
group:

- sample every opaque source pixel from the exponent capture;
- compute the exponent capture box midpoint;
- move each sampled pixel outward from that midpoint in proportion to its
  distance from the midpoint;
- collapse all sampled pixels back to the midpoint, forming a dot-like emitter;
- stream particles from that emitter into the target radical artifact.

This keeps the semantic identity rule unchanged: the base/radicand token still
persists through DOM semantic motion, while the exponent notation becomes visual
material that generates the radical notation.

## Sources

- `src/rendering/katex-artifact-pixel-flow.ts`
  - Added `KatexArtifactPixelFlowSourceMotion`.
  - Added CPU frame sampling for direct flow and `bounce-collapse-emitter`.
  - Added matching WebGL shader uniforms and phase math.
- `src/editor/equation-motion-demo-controller.ts`
  - The radical rewrite plan now opts into `bounce-collapse-emitter`.
  - The overlay exposes `data-kp-equation-motion-artifact-source-motion` for
    browser diagnostics.
- `tests/katex-artifact-pixel-flow.test.ts`
  - Added a red/green unit test for bounce, collapse, and emitter streaming.
- `tests/katex-transition.browser.spec.ts`
  - Added a browser integration assertion that the radical overlay is using the
    source-motion phase.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-artifact-pixel-flow.test.ts`
  - Failed because particles still interpolated directly from source to target.
- Red: `npm run test:browser:katex -- -g "editor equation motion demo uses semantic playback plans"`
  - Failed because the radical overlay did not expose a source-motion phase.
- Green: focused unit test
  - Passed after adding `bounce-collapse-emitter` frame sampling.
- Green: focused browser test
  - Passed after routing the radical plan through the new source phase.

## Next Hook

The next visual improvement is grouped radical target capture: particles should
stream into a composed radical glyph/rule shape instead of the current single
structural target anchor.
