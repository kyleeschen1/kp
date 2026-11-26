# Original fraction presentation with a left ridge

Outcome: HUMAN_CHECKPOINT. The user requested retiring the recent presentation
experiments and changing the original bracket frame to a black ridge.

Open http://127.0.0.1:8000/experiments/fraction-notebook/?reading=1.
Scroll through a mathematical operation, then reverse. Look for the original
fraction layout and motion, with one thin black vertical ridge on the left
instead of the bracket pair. There are no experimental prose lifts, depth
exchanges or translucent frame treatments. Old `rail=1&frames=1` links now
produce the same original presentation.

The canonical source remains
`content/authoring/algebra/fractional-linear-reasoning.article.md`, hosted in
the notebook's `/reader/fraction-notebook-preview/` iframe, with the existing
native KaTeX/material compositor. Theater and layout code are restored exactly
to `7b545a9ba`; subsequent independent annotation-fit corrections remain intact.
The ridge is a preview-scoped CSS override, leaving other readers unchanged.
The reset is one reversible commit; the ridge alone can be removed from
`src/fraction-notebook/preview.css`.

Verification passed:

- `npm run typecheck:fraction-notebook`
- `node --disable-warning=ExperimentalWarning --test tests/fractional-rising-scroll.test.ts tests/fraction-notebook.test.ts tests/semantic-reader-page-shell.test.ts` — 20 tests.
- `npm run visual:fraction-ridge -- --project=firefox` — four desktop/phone
  cases across Chromium and Firefox. Checks cover ridge geometry, retired flags,
  original scroll pacing, active material ownership, reversal and absent
  annotation repair alerts. Screenshots were inspected locally.

Human visual acceptance remains pending. The proposed physics-drag rewrite was
superseded by this narrower request and has not been implemented.
