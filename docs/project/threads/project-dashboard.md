# Project Dashboard Thread

Status: superseded
Last Updated: 2026-07-31
Current Next Action: Preserve unique dashboard evidence and data sources while
the Animation Catalogue absorbs useful artifact inspection. Do not extend the
dashboard as KP's primary operating surface.

## Goal

Preserve the project dashboard as a diagnostic view of project state, report
cards, blockers, and historical catalogue sources while its former primary
authoring role is replaced by the asset-first Animation Catalogue.

## Current Decision

The dashboard no longer defines catalogue identity and is not the default
internal home. Planned work, Theseus state, objects, transforms, reports, and
animation assets should not share one selectable row model. Useful source refs,
verification records, and diagnostic projections may be preserved or linked
from catalogue Details without turning those contexts into peer
representations.

## Accepted Scope

- read-only project and historical diagnostic views;
- source refs, verification records, and report evidence not yet available
  elsewhere;
- temporary links to old editor, sample, and API diagnostics during migration;
- project docs and Theseus records as the authority for direction and execution.

## Out Of Scope

- browser writeback before structured docs/JSON validation is settled;
- dashboard-only samples that do not connect to source refs;
- new asset identity, representation selection, or authoring workflow;
- roadmap and catalogue state merged into one row index;
- restoring the dashboard as the default internal surface.

## Links

- `docs/project/threads/animation-catalogue.md`
- `docs/project/decisions/2026-07-31-kp-animation-catalogue-first-simplification.md`
- `docs/project/roadmap.md`
- `docs/project/strategy.md`
- `src/project-dashboard/data.ts`
- `src/project-dashboard/render.ts`
- `src/project-dashboard/theseus-adapter.ts`
- `tests/project-dashboard.test.ts`
- `tests/project-dashboard.browser.spec.ts`
