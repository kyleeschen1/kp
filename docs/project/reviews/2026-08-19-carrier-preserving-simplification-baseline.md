# Carrier-Preserving Simplification Preservation Baseline

Date: 2026-08-19
Status: frozen before exemplar implementation
Run contract: `run-contract.kp.carrier-preserving-simplification-v4`

## Preserved behavior

- Contributor fusion is the approved contrast. Commit `01e3cc16` promotes its
  product, quotient, and sum cohort; `npm run
  test:operation-evaluation-family-exemplar` passes 12/12 assertions.
- The unit-factor ownership seam is repaired by commits `419fb00a`,
  `608b5c20`, and `1122b4a7`. `npm run
  test:common-denominator-pressure-presentation` passes 10/10 assertions,
  including one stable native equation, immutable endpoint ownership, one
  reversible clock, and explicit numeric-product evaluation.
- `animation.generated.add-zero` retains its existing semantic object IDs,
  correspondence, source/target equations, and timeline. The focused draft,
  compiler, and identity-absorption suites pass 15/15 assertions.

These checks are the preservation boundary for the new exemplar. A future
slice may add assertions, but it may not update accepted outputs merely to
make the carrier implementation pass.

## Classified canonical-renderer debt

`npm run test:canonical-equation-renderer` passes 26/28 assertions and fails
only the two conditions already present before this run:

1. The sealed direct-dependency allowlist does not yet include
   `src/rendering/native-katex-endpoint-ownership.ts`, even though the repaired
   ownership seam intentionally imports it.
2. The measured canonical aggregate is 463,923 source bytes against the
   existing 455,000-byte ceiling.

This run will not raise the byte ceiling. It will also not disguise the new
ownership authority by deleting it from the measured closure. Any later
allowlist correction must remain a truthful architecture-audit change, and
new carrier work must not increase the aggregate without explicit
classification.

## Commands

```text
npm run test:operation-evaluation-family-exemplar
npm run test:common-denominator-pressure-presentation
node --disable-warning=ExperimentalWarning --test tests/kp-llm-animation-draft.test.ts tests/kp-llm-animation-draft-compiler.test.ts tests/kp-identity-absorption-choreography.test.ts
npm run test:canonical-equation-renderer
```
