# Shadow Controls

Recorded: 2026-07-07

Projected shadows are now controlled by semantic graph settings:
`Graph3DObject.shadow.enabled` and `Graph3DObject.shadow.opacity`. The SVG
renderer exports those values, skips shadow quads when disabled, and uses the
semantic opacity for rendered shadow polygons.

The editor now exposes a shadow toggle and opacity slider through the existing
graph control strip and input-refresh path.

TDD evidence:
- Red:
  - `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
    failed because graph shadow settings were missing.
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
    failed because shadow enabled/opacity metadata was missing.
  - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
    failed because shadow state helpers and controls were missing.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/projection.test.ts`
  - `npm run typecheck`
  - `git diff --check`
