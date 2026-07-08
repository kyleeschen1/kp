# Phase 3: Galleries

## Goal

Add searchable galleries for animation types, visual types, semantic objects,
and protocol/API surfaces.

## Expected Files

- Modify `src/project-dashboard/model.ts`
- Modify `src/project-dashboard/data.ts`
- Modify `src/project-dashboard/render.ts`
- Modify `src/styles.css`
- Modify `tests/project-dashboard.test.ts`

## Implementation Steps

1. Add failing tests for gallery grouping by kind.
2. Add failing tests for text and tag filtering.
3. Add failing tests for gallery item capability/lens rendering.
4. Implement `filterProjectDashboardData(data, query)` as a pure helper.
5. Render gallery tabs or grouped sections for:
   - animation types;
   - visuals;
   - semantic objects;
   - protocol/API.
6. Show each item's tags, supported domains, lenses/interfaces, status, and
   linked work cards.
7. Add a query input that filters cards and gallery items client-side.
8. Run focused tests until green.
9. Run `npm test`, `npm run typecheck`, and `npm run build`.
10. Commit the phase.

## Acceptance Criteria

- Gallery data shares the same project knowledge source as work cards.
- Search finds items by title, tag, domain, status, and interface name.
- The current equation animation types appear in the animation gallery.
- Graph, table, network, code, and timeline visual categories are represented,
  even if some are marked planned.

## Commit Message

`feat: add project object galleries`
