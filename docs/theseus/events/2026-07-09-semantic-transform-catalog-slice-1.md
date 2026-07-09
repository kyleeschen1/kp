# Semantic Transform Catalog Slice 1

Date: 2026-07-09
Run contract: `run.semantic-katex-transform-v1`
Target: `frontier.catalog.semantic-transform-groups-v1`
Status: complete

## Summary

Added semantic transformations as first-class project dashboard gallery records.
The dashboard now has a typed `semantic-transform` gallery kind and seven
records whose ids match the editor API outline:

- `transform-subtract-both-sides`
- `transform-cancel-additive-inverse`
- `transform-evaluate-constant-expression`
- `transform-matrix-multiply`
- `transform-compute-jacobian`
- `transform-compute-hessian`
- `transform-rename-variable`

Each record includes status, tags, domains, interfaces, and related ids so the
dashboard can search and link them like semantic objects, visuals, animation
motifs, and protocol/API records.

## Verification

Red check:

- `node --disable-warning=ExperimentalWarning --test tests/project-dashboard.test.ts tests/editor.test.ts`
- Failed because the dashboard did not yet expose
  `transform-subtract-both-sides`, did not have a `semantic-transform` gallery
  kind, and did not render the group.

Green checks:

- `node --disable-warning=ExperimentalWarning --test tests/project-dashboard.test.ts tests/editor.test.ts`
- `npm run typecheck`
- `git diff --check`

## Next Slice

Proceed to `frontier.docs.katex-transform-taxonomy-v1`, the KaTeX transform
taxonomy proposal.
