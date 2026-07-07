# Saddle-Weave Curve Fixture

Recorded: 2026-07-07

Added a non-default 3D curve fixture for renderer tests:

`x(t)=t`, `y(t)=0`, `z(t)=t^2/4 + 0.25 sin(2t)`

The fixture uses the same expression-backed `Curve3DObject` contract as other
parametric curves. It deliberately weaves above and below the default saddle so
curve visibility tests can exercise hidden and visible depth-buffer segments
without returning the old spiral to the default scene.

Verification:
- Red tests first: missing `createSaddleWeaveCurve3D` export.
- `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
- `npm run typecheck`
- `git diff --check`
