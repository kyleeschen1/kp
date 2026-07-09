# Notation Transform Category Slice 10

Target: `frontier.semantic.notation-transform-v1`

## Summary

Introduced `NotationTransform` as a separate category for semantic-preserving
notation changes. This keeps representation changes out of
`SemanticTransformation`, which remains reserved for operations that derive a
new semantic object or proof step.

Seed examples:

- `inlineFractionToStackedFraction`
- `radicalToExponent`
- `implicitToExplicitMultiplication`

## Sources

- `src/semantic/notation-transform.ts`
  - Added typed notation transform definitions, ids, geometry families, identity
    policy, artifact roles, and lookup helper.
- `src/editor/api-catalog.ts`
  - Added a `Notation Transformations` API outline group.
- `src/project-dashboard/model.ts`
  - Added `notation-transform` as a gallery kind and ordering entry.
- `src/project-dashboard/render.ts`
  - Added the dashboard label for notation-transform groups.
- `src/project-dashboard/data.ts`
  - Added three notation transform gallery records.
- `docs/superpowers/specs/2026-07-09-notation-transform-category-design.md`
  - Added the category design note.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Clarified the `SemanticTransformation` versus `NotationTransform` boundary.
- `docs/superpowers/specs/2026-07-09-animation-entity-taxonomy-design.md`
  - Added notation transforms as a dashboard card family.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/notation-transform.test.ts tests/editor.test.ts tests/project-dashboard.test.ts tests/equation-transform.test.ts tests/katex-token-snapshot.test.ts`
  - Failed because `src/semantic/notation-transform.ts` did not exist.
  - Failed because the editor and dashboard did not expose a notation-transform
    category.
- Green: same focused command
  - Passed 44 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/katex-token-snapshot.test.ts`
  - Passed 15 tests.
- `node --disable-warning=ExperimentalWarning --test tests/notation-transform.test.ts tests/editor.test.ts tests/project-dashboard.test.ts`
  - Passed 29 tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 234 tests.

## Next

Proceed to `frontier.katex.fraction-transform-fixtures-v1`.
