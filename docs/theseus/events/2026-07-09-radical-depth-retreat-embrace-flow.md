# Radical Depth Retreat Embrace Flow

Target: `frontier.rendering.radical-depth-retreat-embrace-flow-v1`

## Summary

Replaced the radical source bounce motif with a depth-retreat motif:

- exponent particles first lift forward in visual depth without moving away from
  the exponent group;
- particles retract to the exponent midpoint, forming the emitter;
- the stream phase uses smaller particles and renders behind the persistent
  radicand `x`;
- the target radical particles move slightly forward at the end through a
  `behind-token-embrace` phase.

This better matches the semantic visual story: the exponent notation compresses
into a source of radical notation, while the base `x` remains persistent and in
front of the stream.

## Sources

- `src/rendering/katex-artifact-pixel-flow.ts`
  - Replaced `bounce-collapse-emitter` with `depth-retreat-emitter`.
  - Added `behind-token-embrace` target motion.
  - Added CPU sampler fields for depth scale and smaller stream particles.
  - Updated the raw WebGL shader to use the same phase math.
- `src/editor/equation-motion-demo-controller.ts`
  - Routed radical rewrite through `depth-retreat-emitter` and
    `behind-token-embrace`.
  - Exposes source/target motion diagnostics on the overlay canvas.
- `src/styles.css`
  - Positions persistent motion tokens above the artifact canvas so the particle
    stream reads as behind `x`.
- `tests/katex-artifact-pixel-flow.test.ts`
  - Replaced the bounce test with a depth/retract/stream/embrace contract.
- `tests/katex-transition.browser.spec.ts`
  - Verifies the radical overlay advertises both motion phases and that the
    canvas is layered behind the persistent `x`.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-artifact-pixel-flow.test.ts`
  - Failed because the old bounce sampler could not handle
    `depth-retreat-emitter`.
- Red: `npm run test:browser:katex -- -g "editor equation motion demo uses semantic playback plans"`
  - Failed because the radical overlay still reported `bounce-collapse-emitter`
    and no target motion.
- Green: focused unit test
  - Passed after adding depth-retreat source and embrace target sampling.
- Green: focused browser test
  - Passed after routing the radical overlay and lowering the artifact canvas
    behind persistent tokens.

## Next Hook

Grouped radical target capture is still the next visual improvement: the stream
should fill the composed sqrt glyph and rule, not only the current single
structural radical anchor.
