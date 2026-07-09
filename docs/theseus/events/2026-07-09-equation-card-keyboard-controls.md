# Equation Card Keyboard Controls

Target: `frontier.editor.equation-card-keyboard-controls-v1`

## Summary

Added a focused-card interaction contract for the equation animation card:

- the card is focusable and receives a darker border/focus ring while focused
  or focus-within;
- `Space` toggles playback pause/resume;
- `j` and `k` step to the next and previous animation step;
- `J` and `K` open an in-card animation picker and move through entries;
- `Enter` commits the highlighted picker entry;
- `Escape` closes the picker without changing animations.

Keyboard handling is scoped to events originating inside the animation card and
ignores form-editing targets unless the keyboard picker is already open.

## Sources

- `src/editor/editor.ts`
  - Made the equation animation card focusable.
  - Added a hidden listbox-style keyboard picker mirroring the animation
    dropdown.
- `src/editor/equation-motion-demo-controller.ts`
  - Added card-level key handling.
  - Split button stepping from card stepping.
  - Replaced the old active frame id map with active/paused animation records so
    Space can pause and resume from the same sampled progress.
  - Added picker navigation and commit helpers.
- `src/main.ts`
  - Routed keydown events through the equation motion controller.
- `src/styles.css`
  - Added the darker focus border and keyboard picker styling.
- `tests/katex-transition.browser.spec.ts`
  - Added browser coverage for focus styling, `j/k`, Space pause/resume, and
    `J/K/Enter` picker selection.

## Red/Green Evidence

- Red: `npx playwright test tests/katex-transition.browser.spec.ts --project=chromium -g "focused keyboard controls"`
  - Failed because the card was not focusable and retained the default border.
- Green: same focused browser command
  - Passed after adding focusability, keyboard handling, pause state, and picker
    behavior.

## Design Note

Idle Space playback intentionally ignores the latest scrub/rewind transition
and chooses the current step's natural next transition. Scrubbing still uses the
latest transition, but keyboard playback should feel local to the currently
focused card state.
