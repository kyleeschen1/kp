# Equation-series pinned live benchmark

Date: 2026-08-19

Status: passed

## Reproducibility

- Planner: `planner.codex-cli.live.v1`
- Model: `gpt-5.6-sol`
- Repetitions: 3
- Cases per repetition: 6
- Prompt fingerprint: `fnv1a64:882146c856a2586a`
- Command: `npm run benchmark:equation-series:live -- --model gpt-5.6-sol --repetitions 3 --check`

Raw response fingerprints, in repetition order:

1. `fnv1a64:b42226e07d6d1bae`
2. `fnv1a64:b42226e07d6d1bae`
3. `fnv1a64:fb9e4a4f6398b254`

The disposable raw responses and full report were captured under
`tmp/codex/equation-series-live-model-benchmark/`; this record retains the
reviewable identity and outcome without committing provider output.

## Results

- 18 total case-runs passed.
- 15 of 15 supported case-runs selected the exact expected operation IDs.
- All 15 proposed case-runs preserved adjacency identity.
- 3 of 3 unsupported fraction-equivalence case-runs explicitly abstained.
- All 9 governed-source cases returned the expected typed repair guidance.
- Authority attempts: 0.
- Compiled selection mismatches: 0.
- Silent fallbacks: 0.
- Provider errors during the accepted run: 0.

The supported corpus covered function wrapping, distribution, log-product
expansion, the three-operation exponential-solving sequence, and logarithm
change of base. Fraction equivalence remained unsupported in all repetitions,
as required before its governed operation is introduced.

## Preflight note

The first command invocation never reached the model because the provider's
structured-output subset rejected JSON Schema `oneOf`. The deterministic
schema was changed to the supported `anyOf` form while retaining disjoint
proposed and unsupported record shapes; the offline schema suite passed before
the accepted three-repetition run above. This was a harness compatibility fix,
not a planner retry or model substitution.
