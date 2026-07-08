# SVG Light Metadata

Recorded: 2026-07-07

3D graph SVG output now exposes semantic light settings:

- graph root: light direction, ambient, diffuse, and depth-haze values;
- each surface quad: the same light settings next to the lighting model marker.

This keeps lighting inspectable in exported SVG and gives later editor/runtime
work a stable metadata contract.

TDD evidence:
- Red: `tests/rendering.test.ts` expected `data-kp-light-*` attributes that were
  not emitted.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `npm run typecheck`
  - `git diff --check`
