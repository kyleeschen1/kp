# Phase 2: Adaptive Surface Resolution

## Goal

Let the renderer choose denser surface grids while preserving cheaper interaction updates.

## Scope

- Add graph surface quality/resolution settings.
- Default desktop/static quality can move beyond `13 x 13`.
- Keep a low/interactive quality path for slider drags and slower devices.
- Ensure SVG and WebGL use the same sampled resolution for equivalent graph states.

## Expected Files

- `src/semantic/graph.ts`
- `src/editor/state.ts`
- `src/editor/editor.ts`
- `src/rendering/graph-svg.ts`
- `src/rendering/graph-webgl.ts`
- `tests/semantic.test.ts`
- `tests/editor.test.ts`
- `tests/rendering.test.ts`
- `tests/graph-webgl.test.ts`

## Verification

- Focused semantic/state/rendering/WebGL tests.
- Full Node test suite.
- Typecheck/build/diff hygiene.

## Commit

Commit after this phase with a resolution/adaptive-quality message.
