# Project Dashboard Thread

Status: active
Last Updated: 2026-07-10
Current Next Action: Keep dashboard rows aligned with the semantic runtime
roadmap and use sample targets to open live rendered examples from catalog rows.

## Goal

Make the dashboard the KP operating surface for project state, object and
transform catalogs, report cards, blockers, samples, and future authoring
flows.

## Current Decision

Use agenda-style rows rather than card-heavy layouts. Every work item, report,
object, transform, visual, API group, sample, and future tutorial artifact
should be discoverable as a row with search text, tags, status, source refs,
verification, and a selected-row preview.

## Accepted Scope

- search over work, reports, gallery items, API rows, transforms, and samples;
- foldable sections and selected-row preview;
- sample target metadata;
- live actions into editor samples and API cards;
- project docs and Theseus records as long-term data sources.

## Out Of Scope

- browser writeback before structured docs/JSON validation is settled;
- dashboard-only samples that do not connect to source refs;
- replacing the editor surface before the semantic runtime is stable.

## Links

- `docs/project/roadmap.md`
- `docs/project/strategy.md`
- `src/project-dashboard/data.ts`
- `src/project-dashboard/render.ts`
- `src/project-dashboard/theseus-adapter.ts`
- `tests/project-dashboard.test.ts`
- `tests/project-dashboard.browser.spec.ts`
