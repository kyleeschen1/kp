# Radical Fold Resolve

Target: `frontier.rendering.radical-fold-resolve-v1`

## Summary

Replaced the remaining global-scale feel in the radical rewrite with a
deterministic fold/bundle visual motif:

- exponent and radical artifacts are split into stable texture pieces;
- the exponent pieces collapse asynchronously into a small visible bundle;
- each collapsing piece receives seeded delay and drift, so the motion does not
  read as one rectangular scale transform;
- radical pieces unfold from the same bundle with ordered delays, making rewind
  read as the radical line folding back toward the exponent;
- a deterministic 25% subset of radical pieces dissolves in place, so rewind has
  partial path dissolve without particle dots.

This keeps the transition reversible and scrub-safe while making the radical
look like stroke geometry folding and resolving instead of a single texture
being scaled.

## Sources

- `src/rendering/katex-artifact-seed-reveal.ts`
  - Extends the canvas artifact renderer to emit deterministic texture pieces.
  - Adds bundle layout, seeded drift, per-piece delay, and target dissolve/fold
    piece classes.
- `src/editor/equation-motion-demo-controller.ts`
  - Retunes the radical route to `fold-resolve` metadata and a visible bundle.
- `tests/katex-artifact-seed-reveal.test.ts`
  - Verifies multi-piece collapse, asynchronous positions/opacities, visible
    bundle occupancy, target dissolve/fold classes, and exact final state.
- `tests/katex-transition.browser.spec.ts`
  - Verifies the editor route reports the fold-resolve motif and canvas renderer.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/katex-artifact-seed-reveal.test.ts`
  - Failed because the old seed-reveal frame still used one scaled quad.
- Red: `npm run test:browser:katex -- -g "editor equation motion demo uses semantic playback plans"`
  - Failed because the route still reported `seed-reveal`.
- Green: focused unit and browser tests passed after adding texture pieces,
  seeded delays/drift, bundle layout, and fold-resolve route metadata.
