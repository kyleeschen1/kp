# Generalized Additive Inverse Cancelation Slice 8

Date: 2026-07-09
Run contract: `run.semantic-katex-transform-v1`
Target: `frontier.transform.cancel-additive-inverse-general-v1`
Status: complete

## Summary

Generalized left-side additive inverse cancelation for a first parser-backed
pattern:

```txt
y + 2 - 2 = 10 - 2  -- cancel left additive inverse -->  y = 10 - 2
```

The generated transition emits dynamic token ids, selector paths,
correspondence records, annotations, and motion-plan timing compatible with the
existing cancelation sampler.

The existing `x + 3 - 3 = 7 - 3` fixture still uses its hand-authored transition
so current demo behavior remains stable.

## Verification

Red check:

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-sampler.test.ts`
- Failed because `y + 2 - 2 = 10 - 2` left cancelation was unsupported.

Green checks:

- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-sampler.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-sampler.test.ts tests/equation-motion-plan.test.ts`
- `npm run typecheck`
- `git diff --check`
- `npm test`

## Next Slice

Proceed to `frontier.transform.evaluate-constant-expression-v1`.
