# Fixture Animation Entries Slice 2

Target: `frontier.editor.fixture-animation-entries-v1`

## Summary

Added five fixture-backed equation animation entries to the editor dropdown:

- Inline fraction to stacked
- Power to radical
- Wrap with function
- Repeated factor to exponent
- Matrix bracket swap

The catalog now stores precompiled `EquationTransition` records instead of
operation-only records. The existing linear-equation demo still uses its
multi-step semantic transitions; fixture entries use a one-step
`fixtureTransform` transition built from existing KaTeX transform fixture
records.

This first visible pass renders each fixture as a whole KaTeX expression token
for source and target. That keeps stacked fractions, radicals, and matrices
typographically correct while leaving finer per-token fixture lowering for later
slices.

## Sources

- `src/math/equation-transform.ts`
  - Added a fixture-transform operation marker for transition records.
- `src/editor/equation-animation-catalog.ts`
  - Added fixture-backed catalog entries and one-step fixture transitions.
- `src/editor/equation-motion-demo-controller.ts`
  - Consumed precompiled catalog transitions.
- `src/editor/editor.ts`
  - Allowed callers to render a selected animation entry.
- `src/main.ts`
  - Stored selected animation id and re-rendered the editor on dropdown change.
- `tests/editor.test.ts`
  - Added option coverage and selected fixture render coverage.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  - Failed because the dropdown did not include the fixture animation options.
- Green: same focused command
  - Passed 16 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  - Passed 16 tests.
- `npm run typecheck`
  - Passed.

## Next

Add browser coverage for selecting each animation and then improve fixture
lowering from whole-expression transitions toward token/artifact correspondence.
