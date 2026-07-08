# Graph3D Semantic Light Settings

Recorded: 2026-07-07

Added semantic light settings to `Graph3DObject`:

- direction vector;
- ambient intensity;
- diffuse intensity;
- depth-haze intensity.

`createGraph3DObject` now supplies defaults and clamps intensity values to
`0..1`. Direct graph fixtures were updated to include the default light object.

TDD evidence:
- Red: `tests/semantic.test.ts` expected default `graph.light`, which was
  missing from factory-created 3D graphs.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts tests/projection.test.ts`
  - `npm run typecheck`
  - `git diff --check`
