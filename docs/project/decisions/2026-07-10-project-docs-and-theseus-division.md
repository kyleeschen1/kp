# 1. Split Project Strategy From Theseus Execution

Date: 2026-07-10
Status: accepted

## Decision

Use `docs/project` as the durable human-readable project memory and use Theseus
as the executable graph for concrete work, verification, provenance, and run
contracts.

## Reason

KP now has a broad semantic tutorial-system vision and many implementation
slices. Keeping all of that only in Theseus makes the human story too
operational; keeping it only in Markdown makes Codex continuation and
verification too fragile. The split lets strategy remain readable while Theseus
continues to provide typed source refs, queue control, run contracts, and
evidence.

## Consequences

- `docs/project/roadmap.md` is the current source of truth for strategic
  ordering.
- Theseus nodes should point back to project docs when a run contract is derived
  from roadmap direction.
- Future pivots should update both layers when they affect implementation
  order.
- Dashboard rows should eventually read from project docs and Theseus together.

## Alternatives Considered

- **Theseus only:** good for execution, weak for long-form direction.
- **Markdown only:** readable, but too easy to drift from source refs and tests.
- **Dashboard only:** useful as a surface, but it needs underlying docs and
  graph records to stay durable.

## Follow-Ups

- Materialize roadmap priorities into Theseus next-actions.
- Use a run contract for the next semantic runtime loop after user approval.
- Keep next-step reviews in `docs/project/reviews/`.
