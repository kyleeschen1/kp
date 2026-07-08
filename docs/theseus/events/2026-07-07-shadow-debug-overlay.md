# Shadow Debug Overlay

Recorded: 2026-07-07

Added an opt-in `debug.shadowOverlay` setting for 3D graphs. When enabled, the
SVG renderer emits a capped debug overlay showing sampled projected shadow quads
over the normal render. This gives a lightweight way to inspect shadow/light
projection geometry without changing normal output.

TDD evidence:
- Red:
  - `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
    failed because `debug.shadowOverlay` was missing.
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
    failed because the shadow debug overlay metadata and polygons were missing.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/projection.test.ts`
  - `npm run typecheck`
  - `git diff --check`
