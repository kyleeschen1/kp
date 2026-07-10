# Radical 1px Filament Flow

Target: `frontier.rendering.radical-1px-filament-flow-v1`

## Summary

Refined the radical rewrite particle motif after visual review:

- the exponent/fraction source now lifts straight upward instead of diagonally;
- the source pauses briefly, then collapses smoothly into its midpoint;
- collapsed particles are explicit 1 CSS-pixel dots rather than scale-derived,
  nearly transparent subpixel marks;
- particles keep full alpha while streaming so the thin filament remains visible;
- the filament stays narrow behind the persistent `x`, then the radical artifact
  forms late from the stream.

This keeps the semantic structure from the previous anticipation/filament
approach while making the visible phases easier to read.

## Sources

- `src/rendering/katex-artifact-pixel-flow.ts`
  - Replaced source `minScale` with explicit `collapsedPointSize`.
  - Updated the CPU sampler and WebGL shader to use point-size sampling instead
    of point-size/opacity scale sampling.
  - Keeps collapsed and streaming particles at full alpha.
- `src/editor/equation-motion-demo-controller.ts`
  - Tuned the radical route to upward anticipation, 1px collapse, thinner
    filament, and later radical formation.
  - Exposes route parameters as overlay diagnostics for browser regression
    coverage.
- `tests/katex-artifact-pixel-flow.test.ts`
  - Verifies lift, pause, collapse to 1px dots, narrow filament streaming, and
    late target growth.
- `tests/katex-transition.browser.spec.ts`
  - Verifies the live editor route reports the tuned radical motion parameters.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-artifact-pixel-flow.test.ts`
  - Failed because the old sampler still expected `minScale`, producing `NaN`
    for explicit 1px dot size.
- Red: `npm run test:browser:katex -- -g "editor equation motion demo uses semantic playback plans"`
  - Failed because the overlay did not expose the tuned route parameters.
- Green: focused unit and browser tests passed after replacing scale/fade with
  explicit point-size sampling and route diagnostics.
