# Equation Animation Catalog Slice 1

Target: `frontier.editor.equation-animation-catalog-v1`

## Summary

Introduced the editor equation animation catalog shell and moved the existing
`x + 3 = 7` demo into the first catalog entry.

The visible panel now has:

- a top animation dropdown;
- the equation stage in the middle;
- bottom Back/Forward step buttons;
- beat, duration, and minimum-size sliders inside a closed `details` foldout.

The existing linear-equation animation behavior is still the only catalog entry
and still uses the existing semantic operation sequence.

## Sources

- `src/editor/equation-animation-catalog.ts`
  - Added catalog entry types and the default linear-equation entry.
- `src/editor/editor.ts`
  - Rendered the panel from the catalog and reorganized controls.
- `src/editor/equation-motion-demo-controller.ts`
  - Read transition operations from the selected catalog entry.
- `src/styles.css`
  - Styled the selector, bottom controls, and folded timing panel.
- `tests/editor.test.ts`
  - Added render-contract coverage for the selector and control layout.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
  - Failed because the panel did not render `data-kp-equation-animation-selector`.
- Green: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/equation-motion-player.test.ts tests/equation-motion-plan.test.ts`
  - Passed 38 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/equation-motion-player.test.ts tests/equation-motion-plan.test.ts`
  - Passed 38 tests.
- `npm run typecheck`
  - Passed.

## Next

Proceed to animation selection wiring and fixture-backed catalog entries.
