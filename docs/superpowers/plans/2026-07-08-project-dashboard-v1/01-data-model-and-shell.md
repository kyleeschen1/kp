# Phase 1: Data Model And Shell

## Goal

Introduce the canonical V1 dashboard data model and a button-accessible
prototype shell without replacing the current Semantic Editor.

## Expected Files

- Create `src/project-dashboard/model.ts`
- Create `src/project-dashboard/data.ts`
- Create `src/project-dashboard/render.ts`
- Modify `src/editor/editor.ts`
- Modify `src/main.ts`
- Modify `src/styles.css`
- Modify `tests/editor.test.ts`
- Create `tests/project-dashboard.test.ts`

## Implementation Steps

1. Add failing model tests in `tests/project-dashboard.test.ts` for:
   - seed data exposes work cards, gallery items, and report themes;
   - card ids are unique;
   - related ids point at known cards or gallery items;
   - rendering includes a dashboard shell and back button.
2. Run `npm test tests/project-dashboard.test.ts` and confirm it fails because
   the dashboard modules do not exist.
3. Add the model types:
   - `ProjectDashboardCategory`
   - `ProjectDashboardStatus`
   - `ProjectDashboardPriority`
   - `ProjectCard`
   - `ProjectGalleryItem`
   - `ProjectReportTheme`
   - `ProjectDashboardData`
4. Add seed data for current real project work:
   - rendering/time protocol;
   - equation cancelation animation;
   - equation final simplify crossfade;
   - graph surface morphs;
   - semantic object registry;
   - dashboard v1.
5. Add pure helpers:
   - `collectProjectDashboardIds(data)`;
   - `validateProjectDashboardData(data)`;
   - `renderProjectDashboard(data)`.
6. Add a `Project Dashboard` button to the current editor header.
7. Add `show-project-dashboard` and `show-editor` button actions in
   `src/main.ts`.
8. Keep editor rendering and hydration isolated:
   - dashboard view renders into `#app`;
   - returning to editor calls the existing `renderEditor()`;
   - graph WebGL shells are disposed before replacing the editor view.
9. Add compact dashboard CSS with operational cards, status chips, and a
   top-level back button.
10. Run focused tests until green.
11. Run `npm test`, `npm run typecheck`, and `npm run build`.
12. Commit the phase.

## Acceptance Criteria

- The current editor remains the default first screen.
- A visible `Project Dashboard` button opens the prototype.
- The prototype shows seeded work, gallery, and report data.
- A `Back to Editor` button restores the editor view.
- Existing equation motion and graph controls remain wired after returning.

## Commit Message

`feat: add project dashboard prototype shell`
