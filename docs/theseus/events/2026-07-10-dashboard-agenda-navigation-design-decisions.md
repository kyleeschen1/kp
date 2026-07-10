# Dashboard Agenda Navigation Design Decisions

Date: 2026-07-10
Project: kp
Status: design-record

## Summary

Recorded the dashboard navigation decisions from the project-state discussion.
The project dashboard is now treated as an org-agenda-like index over Kinetic
Press entities, not as a collection of independent visual cards. The dashboard
should help both the user and Codex answer what exists, what is active, what is
blocked, what is related, and where to go next.

## Primary Decisions

### Every Entity Gets A Row

The dashboard agenda uses a shared row shape for:

- Work items and nested work phases.
- Report-card themes.
- Object gallery entries.
- Animation layout entries.
- KaTeX transform fixtures.
- API groups and API items.
- Supporting operational records such as the dashboard data contract.

Nested work is represented as indented rows rather than nested cards. This keeps
the dashboard close to an org agenda buffer: headlines, subheadlines, summaries,
statuses, and tags.

### Rows Replace Card Grids For Project Navigation

Cards remain appropriate for actual previews, fixtures, and rendered samples.
Project navigation rows should not look like cards. Rows use table structure,
plain section dividers, text status, and text tags. Rounded boxes and pill-heavy
visuals are intentionally avoided for agenda entities because they make the
dashboard harder to scan as the library grows.

### Sections Are Headings With Counts

Each dashboard section has an `h2` heading with a count in parentheses, such as
`Work (12)`. The section heading lives above the rows it manages, not inside the
table rows. The current top-level order is:

1. Work.
2. Report Cards.
3. Object Gallery.
4. Animation Layout.
5. KaTeX Transforms.
6. API.
7. Other.

This keeps the dashboard readable at both project-management scale and concept
catalog scale.

### Search Is A Whole-Project Index

The search bar searches across all agenda row sources, including synthetic rows
that do not live directly in `projectDashboardData`, such as animation catalog
entries, KaTeX fixture entries, API catalog entries, and the data contract row.

The search result summary reports `Showing X of Y rows`. This is important
because it makes search feel like an index over project state, not a local UI
filter hiding a few panels.

### TOC Mode Gives A Fast Zoom-Out

The `Fold lists into TOC` checkbox folds the agenda into headers only. TOC mode
preserves section counts and hides row tables and preview-heavy content. This
lets the user zoom out to the project map without losing the section structure.

### Dashboard Status Belongs In The Header

The data-validity indicator is part of the dashboard title area. It is rendered
as a compact status box beside the title so the user can see whether the
dashboard data source is valid without consuming a full row or section.

### Catalogs Should Reuse Canonical Sources

The agenda should not duplicate catalog data by hand:

- Animation Layout rows come from `equationAnimationCatalogEntries`.
- KaTeX Transform rows come from `katexTransformFixtures`.
- API rows come from `apiCatalogGroups`.
- Work, reports, gallery, and data-contract rows continue to come from
  `projectDashboardData` and `projectDashboardDataContract`.

The dashboard is therefore a rendered index over canonical project data, not a
parallel manually maintained dashboard model.

## Sources

- `src/project-dashboard/render.ts`
  - Builds the agenda model, search counts, TOC rendering, synthetic rows, and
    section order.
- `src/project-dashboard/model.ts`
  - Exposes the dashboard fuzzy matcher for synthetic agenda rows.
- `src/editor/api-catalog.ts`
  - Exports API catalog groups for dashboard indexing.
- `src/main.ts`
  - Stores and toggles dashboard TOC state.
- `src/styles.css`
  - Styles header status, search footer, TOC toggle, and agenda table rows.
- `tests/project-dashboard.test.ts`
  - Covers header status placement, section counts, synthetic rows, search
    counts, and TOC rendering.
- `tests/project-dashboard.browser.spec.ts`
  - Covers dashboard round trip, search counts, agenda ordering, and TOC toggle
    behavior in the browser.

## Verification

- `npm test tests/project-dashboard.test.ts`
  - Passed 293 tests.
- `npm run typecheck`
  - Passed app, node, and test TypeScript projects.
- `npm run test:browser:dashboard`
  - Passed 1 Chromium browser test.
- `git diff --check`
  - Passed.

## Theseus CLI Status

`theseus.config.json` is present and points events to `docs/theseus/events`.
This repository still has no `theseus` script in `package.json`, matching prior
KP event records. This decision record is therefore recorded manually under the
configured `eventsRoot`.

## Next

The next useful dashboard step is to make selected agenda rows open a sample or
preview surface without leaving the agenda model. The likely path is to let rows
remain table entries while a single shared preview panel renders the selected
work item, report card, object, animation fixture, API item, or transform.
