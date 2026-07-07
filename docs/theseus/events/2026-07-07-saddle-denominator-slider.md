# Saddle Denominator Slider

Recorded: 2026-07-07

The editor now renders a saddle denominator slider for graphs that contain a
parameterized saddle surface. Moving it updates the semantic surface object,
rebuilds the executable expression, refreshes the semantic JSON, and rerenders
the 3D graph preview.

Details:
- Slider range: `1` to `16`, step `0.25`.
- State updates clamp to the same range.
- The control targets the surface by `data-surface-id` and rerenders the owning
  graph through `data-graph-id`.

Verification:
- Red test first: `updateSaddleSurfaceDenominator` was missing.
- `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
- `npm run typecheck`
- `git diff --check`
