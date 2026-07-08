# Phase 2: Work Cards

## Goal

Turn the shell into a usable work dashboard for todo cards with status,
priority, blockers, nesting, tags, and related links.

## Expected Files

- Modify `src/project-dashboard/model.ts`
- Modify `src/project-dashboard/data.ts`
- Modify `src/project-dashboard/render.ts`
- Modify `src/styles.css`
- Modify `tests/project-dashboard.test.ts`

## Implementation Steps

1. Add failing tests for grouping cards by status and priority.
2. Add failing tests for rendering nested child cards.
3. Add failing tests for blocker text and related-link rendering.
4. Implement pure grouping helpers in the dashboard module.
5. Render grouped status sections: active, planned, blocked, done.
6. Render child cards under parent cards without duplicating them as top-level
   cards.
7. Add compact styles for status lanes, child stacks, blockers, and priority.
8. Run focused tests until green.
9. Run `npm test`, `npm run typecheck`, and `npm run build`.
10. Commit the phase.

## Acceptance Criteria

- Cards are grouped by status.
- Priority is visible and sort order is deterministic.
- Blockers are visible where present.
- Nested cards are readable and not duplicated as independent top-level cards.
- Related items render as navigable same-page references.

## Commit Message

`feat: render project dashboard work cards`
