# Motion Anchor Transformability And Zero Collapse

Target: `frontier.motion.anchor-transformability-collapse-zero-v1`

## Summary

Fixed the rendered-motion gap behind the still-visible jump/stutter:

- KaTeX motion anchors inside equation formulas now render as `inline-block`, so
  CSS transforms affect their actual rendered boxes. The radical `x` previously
  received changing transform styles, but the browser kept its bounding box
  fixed because the annotated KaTeX span was `display: inline`.
- The equation motion collapse-scale slider now supports `0%` and defaults to
  `0%`. This matches the observed smoother visual behavior: cancellation and
  final simplification collapse into a true point instead of leaving
  glyph-shaped miniatures overlapping at `35%`.

## Sources

- `src/styles.css`
  - Added transformable display behavior for `[data-kp-motion-id]` elements
    inside `.equation-motion__formula`.
- `src/editor/equation-animation-catalog.ts`
  - Changed the default collapse scale from `35%` to `0%`.
- `src/editor/equation-motion-demo-controller.ts`
  - Changed the runtime default/minimum collapse scale from `35/5` to `0/0`.
- `src/editor/editor.ts`
  - Changed the rendered slider minimum from `5` to `0`.
- `tests/katex-transition.browser.spec.ts`
  - Added browser-level radical interpolation coverage that checks real
    bounding-box movement, not only transform strings.
  - Updated cancellation/final-simplify expectations to use `0%` minimum scale.
- `tests/editor.test.ts`
  - Updated server-rendered slider expectations.

## Red/Green Evidence

- Red: `npm run test:browser:katex`
  - Failed because the radical source `x` computed as `display: inline`, so its
    rendered bounding box did not interpolate even though transform styles
    changed.
- Green: same command after making motion anchors transformable
  - Passed 2 Playwright tests.

## Design Note

The semantic token identity fix was necessary but insufficient. For DOM-backed
KaTeX motion, identity must reach a transformable visual box. Future renderers
should test actual rendered geometry for persistent tokens, not just semantic
anchors or inline style strings.
