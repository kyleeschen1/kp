# Dashboard Selected Row Preview

Date: 2026-07-10
Project: kp
Status: implementation-record

## Summary

Implemented the next dashboard priority: selecting an agenda row now opens a
single shared preview panel without leaving the org-agenda table model.

The dashboard remains row-first. Rows are selected through explicit row buttons,
the selected row is highlighted, and one shared preview panel renders the
selected entity's title, status, summary, tags, and domain-specific fields.

## Behavior

- The first visible agenda row is selected by default.
- Clicking a row updates the shared preview panel.
- TOC mode hides row tables and the preview panel, preserving headers only.
- API rows expose their group/status/id fields in the preview.
- KaTeX transform rows expose fixture id, source LaTeX, target LaTeX, and linked
  animation status.
- Animation layout rows expose animation id, beat count, duration, and state
  count.
- Work, report, gallery, and data-contract rows expose useful status and source
  metadata.

## Sources

- `src/project-dashboard/render.ts`
  - Adds selected agenda row state to rendering, row select buttons, selected
    row lookup, and the shared preview panel.
- `src/main.ts`
  - Stores selected agenda row id and re-renders the dashboard on row selection.
- `src/styles.css`
  - Styles the preview panel, selected rows, and row select buttons.
- `tests/project-dashboard.test.ts`
  - Covers default preview selection, API row preview, KaTeX row preview, and
    TOC preview hiding.
- `tests/project-dashboard.browser.spec.ts`
  - Covers clicking an API row and verifying the browser preview updates.

## Verification

- `npm test tests/project-dashboard.test.ts`
  - Passed 296 tests.
- `npm run typecheck`
  - Passed app, node, and test TypeScript projects.
- `npm run test:browser:dashboard`
  - Passed 1 Chromium browser test.
- `git diff --check`
  - Passed.

## Theseus CLI Status

`theseus.config.json` is present and points events to `docs/theseus/events`.
This repository still has no `theseus` script in `package.json`, so this event
was recorded manually under the configured `eventsRoot`.

## Next

Upgrade selected-row previews from metadata summaries into live sample surfaces:
KaTeX transform rows should render scrubbers, animation rows should render the
animation card, and API rows should expose richer interface/sample-card controls.
