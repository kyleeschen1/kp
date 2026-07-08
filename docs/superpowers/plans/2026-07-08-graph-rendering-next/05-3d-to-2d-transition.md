# Phase 5: 3D To 2D Transition Descriptor

## Goal

Represent the 3D-to-2D transition explicitly: camera rotates to face the `x-y` plane, z-axis fades, and z coordinates flatten.

## Scope

- Add a transition descriptor for 3D-to-2D graph handoff.
- Include camera target, axis visibility/fade, and flatten progress.
- Keep actual animation playback minimal or deferred until descriptor tests are stable.

## Expected Files

- `src/rendering/graph-transitions.ts`
- `tests/graph-transitions.test.ts`

## Verification

- Focused transition tests.
- Full Node test suite.
- Typecheck/build/diff hygiene.

## Commit

Commit after this phase with a 3D-to-2D transition descriptor message.
