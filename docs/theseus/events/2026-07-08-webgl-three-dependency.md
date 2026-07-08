# WebGL Three Dependency Slice

Date: 2026-07-08
Project: kp
Status: checkpoint

## Summary

Added Three.js as the runtime WebGL renderer dependency and `@types/three` for
TypeScript coverage. This slice only verifies dependency availability; no graph
renderer behavior is switched yet.

## Source Refs

- `package.json`: adds `three` runtime dependency and `@types/three` dev
  dependency.
- `package-lock.json`: records resolved dependency tree.
- `tests/graph-webgl.test.ts`: dynamic import smoke test for Three.js renderer
  primitives used by the upcoming WebGL graph renderer.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/graph-webgl.test.ts`
- `npm run typecheck`
- `npm run build`

## Theseus CLI Status

`npm run theseus` remains unavailable because this repository has no `theseus`
package script. This checkpoint is recorded manually under `docs/theseus/events`.
