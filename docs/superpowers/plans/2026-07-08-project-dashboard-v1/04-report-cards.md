# Phase 4: Report Cards

## Goal

Add report-card themes so the user can periodically ask Codex for project or
meta-theme assessments with consistent evidence and next-action fields.

## Expected Files

- Modify `src/project-dashboard/model.ts`
- Modify `src/project-dashboard/data.ts`
- Modify `src/project-dashboard/render.ts`
- Modify `src/styles.css`
- Modify `tests/project-dashboard.test.ts`

## Implementation Steps

1. Add failing tests for rendering report themes.
2. Add failing tests for evidence links and latest review metadata.
3. Extend `ProjectReportTheme` with grade/status, evidence, risks, review date,
   and recommended next actions.
4. Seed report themes for:
   - animation protocol maturity;
   - semantic object API;
   - graph rendering;
   - programming object readiness;
   - dashboard/project operations.
5. Render report cards in their own dashboard section.
6. Run focused tests until green.
7. Run `npm test`, `npm run typecheck`, and `npm run build`.
8. Commit the phase.

## Acceptance Criteria

- Report cards are visible in the prototype.
- Each report card has scope, evidence, risks, and next-action fields.
- The data model can represent unreviewed themes and reviewed themes.

## Commit Message

`feat: add dashboard report cards`
