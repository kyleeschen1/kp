# Specular Rim Lighting

Recorded: 2026-07-07

Added specular and rim terms to the SVG 3D surface lighting model. The semantic
graph light now includes `specular` and `rim`, the renderer emits those values
as SVG metadata, and surface quad fills combine ambient, diffuse, specular, rim,
and depth haze using the projected camera direction.

The editor reuses the scalar light-control path for specular and rim, so both
values can be tuned alongside ambient, diffuse, and depth haze.

TDD evidence:
- Red:
  - `node --disable-warning=ExperimentalWarning --test tests/surface-lighting.test.ts`
    failed because specular and rim inputs did not affect fill lightness.
  - `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
    failed because graph light objects did not include specular/rim settings.
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
    failed because SVG light metadata did not expose specular/rim.
  - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
    failed because the editor did not render specular/rim controls.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/surface-lighting.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  - `npm run typecheck`
  - `git diff --check`
