# Project Dashboard V1 Plan

## Objective

Build a prototype project dashboard that keeps the current Semantic Editor as
the default page and adds a button-accessible dashboard view for tracking work,
report themes, and object galleries.

## Version 1 Shape

V1 is a local, file-backed prototype. It does not add a backend writer or
replace the current editor dashboard. Codex updates the seed data in source as
work is completed. The browser view can search, filter, and inspect the data.

## Phases

1. `01-data-model-and-shell.md` - create typed project dashboard data, render a
   prototype shell, and wire it to a button from the current page.
2. `02-work-cards.md` - add grouped todo cards with status, blockers,
   priorities, nesting, tag filters, and related links.
3. `03-galleries.md` - add searchable animation, visual, semantic object, and
   protocol/API galleries that share the card model.
4. `04-report-cards.md` - add report-card themes with evidence, risks, review
   dates, and next-action summaries.
5. `05-write-protocol.md` - document and expose the process for Codex and the
   user to keep the shared dashboard data current.
6. `06-browser-verification.md` - add browser coverage for opening the
   dashboard, returning to the editor, and preserving existing animation and
   graph controls.

## Verification Strategy

- Use test-first slices for data model, filtering, rendering, and view
  switching.
- Run focused Node tests during each phase.
- Run `npm test`, `npm run typecheck`, and `npm run build` after phases that
  touch shared app rendering or event routing.
- Use Playwright in the final browser-verification phase and earlier if view
  switching becomes fragile.

## Deferrals

- Browser-to-filesystem writeback.
- Drag-and-drop prioritization.
- Automated report-card grading.
- Rich live previews for every gallery item.
- Route-level navigation or persistent URL state.
- Multi-project sync.
