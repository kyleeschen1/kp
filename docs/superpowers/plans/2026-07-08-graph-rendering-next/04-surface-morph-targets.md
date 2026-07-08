# Phase 4: Surface Morph Targets

## Goal

Create transition data that can morph between surface modes without ad hoc per-mode animation code.

## Scope

- Add a common `(u, v)` grid representation for mesh, donut, and hyperplanes.
- Produce source/target vertex arrays with matching topology.
- Include transition metadata for crossfading materials when semantic meaning changes.
- Do not implement final animation playback in this phase.

## Expected Files

- `src/rendering/graph-transitions.ts`
- `src/rendering/graph-webgl.ts`
- `src/rendering/graph-webgl-three.ts`
- `tests/graph-transitions.test.ts`
- `tests/graph-webgl.test.ts`

## Verification

- Focused transition/WebGL tests.
- Full Node test suite.
- Typecheck/build/diff hygiene.

## Commit

Commit after this phase with a morph-target message.
