# Radical Seed Reveal

Target: `frontier.rendering.radical-seed-reveal-v1`

## Summary

Replaced the radical rewrite's particle artifact with a non-particle texture
transition:

- the exponent/fraction artifact is captured as a grouped source texture;
- the source texture contracts smoothly into a one-pixel root-operator seed;
- the source fades out only at the seed;
- the radical texture expands from the same seed until the root is whole;
- the overlay remains below the persistent `x`, so the `x` keeps semantic and
  visual identity while the operator changes behind it.

This treats the exponent and radical as distinct semantic artifacts connected by
a visual seed transformation, instead of pretending the fraction tokens persist
as radical particles.

## Sources

- `src/rendering/katex-artifact-seed-reveal.ts`
  - Adds reversible progress sampling, source contraction, target reveal, and a
    2D canvas texture renderer.
- `src/editor/equation-motion-demo-controller.ts`
  - Routes the radical rewrite through `artifact-seed-reveal`.
  - Exposes seed-reveal route diagnostics on the overlay canvas.
- `tests/katex-artifact-seed-reveal.test.ts`
  - Verifies source contraction into a seed and target expansion from that seed.
- `tests/katex-transition.browser.spec.ts`
  - Verifies the editor radical route uses a 2D seed-reveal canvas rather than a
    WebGL particle overlay.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-artifact-seed-reveal.test.ts`
  - Failed because the seed-reveal renderer module did not exist.
- Red: `npm run test:browser:katex -- -g "editor equation motion demo uses semantic playback plans"`
  - Failed because the live radical overlay still used WebGL particles.
- Green: focused unit and browser tests passed after adding the 2D seed-reveal
  renderer and routing the radical fixture through it.
