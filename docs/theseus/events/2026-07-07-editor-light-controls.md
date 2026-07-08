# Editor Light Controls

Recorded: 2026-07-07

The 3D graph editor controls now expose scalar semantic light settings:
ambient, diffuse, and depth haze. Each control writes back to
`Graph3DObject.light`, refreshes the semantic JSON, and rerenders the 3D graph
preview through the existing editor update path.

TDD evidence:
- Red: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  failed because `updateGraph3DLightSetting` was missing and the editor did not
  render `data-action="set-graph-light-setting"` controls.
- Green:
  - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`
  - `npm run typecheck`
  - `git diff --check`
