# Radical Fold Resolve Opacity Timing

Target: `frontier.rendering.radical-fold-resolve-opacity-v1`

## Summary

Refined the radical fold-resolve timing to remove endpoint jolts and early
vanishing:

- dissolve-class radical pieces now crossfade across the full lifecycle instead
  of appearing only in the late reveal window;
- source/exponent pieces stay fully opaque while they are still moving toward
  the bundle;
- source/exponent pieces fade only after each piece has reached the visible
  bundle, preserving the sense of a stream gathering in the middle.

This keeps the motif reversible while avoiding the visual snap that happened
when dissolve pieces appeared or vanished in a short window.

## Sources

- `src/rendering/katex-artifact-seed-reveal.ts`
  - Moves source fade start to each piece's arrival at the bundle.
  - Uses full-lifecycle opacity for target dissolve pieces.
- `tests/katex-artifact-seed-reveal.test.ts`
  - Verifies early dissolve visibility, opaque in-flight source pieces, and
    post-bundle source fade.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-artifact-seed-reveal.test.ts`
  - Failed because dissolve pieces were absent before the late reveal window.
- Green: focused sampler and browser route checks passed after changing opacity
  timing.
