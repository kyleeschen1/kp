# Transform Fixture Contract Slice 22

Target: `frontier.authoring.transform-fixture-contract-v1`

## Summary

Added a JSON-compatible authoring contract for LLM-authored KaTeX transform
fixtures:

- `TransformFixtureDocument` wraps one fixture with `schemaVersion: 1` and
  `kind: "katex-transform-fixture"`.
- `exportKatexTransformFixture` emits a JSON clone of an existing fixture.
- `importKatexTransformFixtureDocument` validates and clones authored documents.
- `validateTransformFixtureDocument` reports path-specific issues for malformed
  family, intent, side, token, structural-token, and role-change fields.

The contract deliberately stops before full semantic object-history integration.
It only defines the portable shape needed for authored fixtures to enter future
galleries and sample cards.

## Sources

- `src/authoring/transform-fixture-contract.ts`
  - Added the document type, export/import helpers, and runtime validation.
- `src/editor/api-catalog.ts`
  - Added `TransformFixtureDocument` to the editor API outline.
- `tests/semantic.test.ts`
  - Added JSON round-trip and invalid LLM-authored field coverage.
- `tests/editor.test.ts`
  - Added editor API outline coverage for the authoring contract.
- `docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md`
  - Added the Slice 22 checkpoint.

## Red/Green Evidence

- Red: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/semantic.test.ts`
  - Failed because `src/authoring/transform-fixture-contract.ts` did not exist
    and the editor API outline did not expose the contract.
- Green: same focused command
  - Passed 44 tests.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/semantic.test.ts`
  - Passed 44 tests.
- `npm run typecheck`
  - Passed.
- `git diff --check`
  - Passed.
- `npm test`
  - Passed 257 tests.

## Next

Proceed to `frontier.theseus.semantic-animation-report-card-v1`.
