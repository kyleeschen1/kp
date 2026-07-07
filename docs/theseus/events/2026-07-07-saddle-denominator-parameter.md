# Saddle Denominator Parameter

Recorded: 2026-07-07

The default saddle surface now carries a semantic parameterization:

`{ kind: "saddle", denominator: 4 }`

`createSaddleSurface3D` can also build flatter or steeper saddle expressions from
an explicit denominator. The resulting surface updates its label, equation text,
parameter metadata, and executable `MathExpression` together, keeping the JSON
object and renderer sampling path in sync.

Verification:
- Red tests first: the default surface had no parameter metadata, and a custom
  denominator still sampled as denominator `4`.
- `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
- `npm run typecheck`
- `git diff --check`
