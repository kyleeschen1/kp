# Phase 3: 2D Scene API

## Goal

Introduce a retained scene model for 2D graphs so SVG and future WebGL 2D rendering can share semantic roles, stable IDs, and geometry.

## Scope

- Add `Graph2DSceneModel` or equivalent.
- Include axes, curves, projected points, and render roles.
- Keep existing SVG output intact, but feed it from the scene model where practical.
- Do not implement a full WebGL 2D renderer in this phase.

## Expected Files

- `src/rendering/graph-2d-scene.ts`
- `src/rendering/graph-svg.ts`
- `tests/rendering.test.ts` or `tests/graph-2d-scene.test.ts`

## Verification

- Focused 2D scene/rendering tests.
- Full Node test suite.
- Typecheck/build/diff hygiene.

## Commit

Commit after this phase with a 2D scene API message.
