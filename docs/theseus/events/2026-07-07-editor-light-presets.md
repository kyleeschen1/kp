# Editor Light Presets

Recorded: 2026-07-07

Added editor-level 3D light presets for the existing semantic light fields. The
graph still stores only `Graph3DObject.light`; presets are a control convenience
for applying named direction/ambient/diffuse/depth-haze bundles. The editor now
renders a preset select and keeps scalar sliders synchronized after preset or
manual light changes.

TDD evidence:
- Red: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  failed because the preset exports and `set-graph-light-preset` control did not
  exist.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `npm run typecheck`
  - `git diff --check`
