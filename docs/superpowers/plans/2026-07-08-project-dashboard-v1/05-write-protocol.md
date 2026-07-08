# Phase 5: Write Protocol

## Goal

Document and expose the process for keeping dashboard data current as Codex and
the user reprioritize work.

## Expected Files

- Create `docs/superpowers/specs/2026-07-08-project-dashboard-v1-design.md`
- Modify `src/project-dashboard/data.ts`
- Modify `src/project-dashboard/render.ts`
- Modify `tests/project-dashboard.test.ts`

## Implementation Steps

1. Write a design doc explaining the V1 source of truth, update cadence, and
   migration path from typed source to structured docs.
2. Add a dashboard "Data contract" section that names the canonical source file
   and explains that browser edits are not persisted in V1.
3. Add failing tests for rendering the data-contract section.
4. Implement the data-contract section.
5. Seed at least one card that demonstrates Codex completion updates.
6. Run focused tests until green.
7. Run `npm test`, `npm run typecheck`, and `npm run build`.
8. Commit the phase.

## Acceptance Criteria

- The user can see where dashboard data is maintained.
- Codex has a written rule for updating cards as work completes.
- The design doc names the deferred persistent-editing path.

## Commit Message

`docs: define project dashboard write protocol`
