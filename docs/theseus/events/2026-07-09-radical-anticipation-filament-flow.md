# Radical Anticipation Filament Flow

Target: `frontier.rendering.radical-anticipation-filament-flow-v1`

## Summary

Replaced the radical depth-retreat motif with a clearer 2D motion grammar:

- the exponent/fraction source anticipates up and right, opposite the direction
  of the later stream;
- the source pauses briefly at that anticipated position;
- source particles collapse into the exponent midpoint until they are barely
  visible;
- particles travel as a very thin filament toward the radical center;
- the stream fans out late so the final particles form the radical artifact.

This removes the awkward simulated front/back depth and makes the transformation
read as anticipation, compression, transfer, and formation.

## Sources

- `src/rendering/katex-artifact-pixel-flow.ts`
  - Replaced `depth-retreat-emitter` with `anticipate-collapse-emitter`.
  - Added `filament-stream` path motion and `late-radical-form` target motion.
  - Updated the CPU sampler and raw WebGL shader to share the same phase math.
  - Keeps tiny particles visible in WebGL with a minimum device-pixel point size.
- `src/editor/equation-motion-demo-controller.ts`
  - Routes the radical rewrite through anticipation, filament, and late-form
    phases.
  - Exposes source/path/target motion diagnostics on the overlay canvas.
- `tests/katex-artifact-pixel-flow.test.ts`
  - Replaced the depth-retreat unit contract with anticipation, pause,
    midpoint collapse, filament stream, and late radical formation assertions.
- `tests/katex-transition.browser.spec.ts`
  - Verifies the live radical overlay reports the new source/path/target phases
    and still renders nontransparent WebGL pixels.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-artifact-pixel-flow.test.ts`
  - Failed because the old depth-retreat sampler did not apply anticipation
    offsets.
- Red: `npm run test:browser:katex -- -g "editor equation motion demo uses semantic playback plans"`
  - Failed because the live route still reported `depth-retreat-emitter` and no
    filament path motion.
- Green: focused unit test
  - Passed after adding anticipation/collapse/filament/formation sampling.
- Green: focused browser test
  - Passed after routing the radical overlay and making tiny WebGL particles
    visible enough for pixel-read verification.

## Next Hook

The next improvement remains grouped radical target capture: the late formation
phase should fill the full sqrt glyph and rule, excluding the persistent `x`.
