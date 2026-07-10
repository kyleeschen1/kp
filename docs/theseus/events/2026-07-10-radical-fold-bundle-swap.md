# Radical Fold Bundle Swap

Target: `frontier.rendering.radical-fold-bundle-swap-v1`

## Summary

Refined the radical rewrite motif to avoid any dissolve-class pieces:

- every captured artifact piece now uses fold/collapse motion;
- the source fraction/exponent collapses into the visible bundle without live
  KaTeX DOM interpolation;
- the target radical unfolds out of the same bundle;
- the source/target replacement is hidden inside the overlapped bundle instead
  of being shown as dissolve or particle fade;
- the live editor route now advertises `fold-bundle-swap` with
  `dissolveFraction: 0`.

This keeps the transition texture-based and avoids the CSS artifacts that show
up when KaTeX fraction DOM is interpolated directly.

## Sources

- `src/editor/equation-motion-demo-controller.ts`
  - Routes the radical artifact animation as `fold-bundle-swap`.
  - Sets the radical route's `dissolveFraction` to `0`.
- `tests/katex-artifact-seed-reveal.test.ts`
  - Verifies all pieces avoid `dissolve` motion.
- `tests/katex-transition.browser.spec.ts`
  - Verifies the live route reports `canvas-fold-bundle-swap` and
    `dissolveFraction: 0`.

## Red/Green Evidence

- Red: focused browser route test failed because the live route still reported
  `fold-resolve`, `canvas-fold-resolve`, and `dissolveFraction: 0.25`.
- Green: focused sampler and browser route tests passed after switching route
  metadata and plan values to no-dissolve fold-bundle-swap.
