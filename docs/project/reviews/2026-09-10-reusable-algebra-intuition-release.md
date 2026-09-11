# Reusable algebra intuition release evidence

Contract: `run-contract.kp.reusable-algebra-intuition-v2`, s23.
Status: release verification complete, including the bounded inventory repair below.

## Bounded integration repairs

The release architecture gate found two authoring imports bypassing the kernel
public API and one app-layer type import bypassing the renderer public API.
All now use already exported public contracts, without new exceptions. The task
inventory test now includes the registered `equation.algebra-intuition` owner.
The canary uses a copied-array reversal compatible with the existing compiler
target. Static publication omits the absent v2 question section without adding
whitespace to v1 editions; a regression assertion preserves those legacy bytes.
The generated reachability graph retains all 68 roots and records the new callers.

## Type-cost amendment under standing authority

All 49 core and both frontend fixtures remain active, with no skipped checking.
The existing composed-algebra fixture now executes v2 author-session, native-host,
Full/Compact reading, scoped-practice, question-reference, pure publication and
author-check consumers, plus negative report/native and v1/v2 authority tests.
The actual Node edition writer remains exercised by publication integration tests;
the browser inference cohort uses its pure source compiler, not Node filesystem
types. No production closure or old consumer was removed to lower the measurement.

| Cohort | Previous recorded measurement (types / instantiations) | Release measurement | Previous ceilings | Release ceilings |
| --- | --- | --- | --- | --- |
| Core | 112727 / 193102 | 115317 / 197053 | 115000 / 198900 | 117700 / 198900 |
| Combined | 173243 / 288463 | 175872 / 292746 | 176800 / 289700 | 176800 / 301600 |

Before adding explicit complete v2 consumers, the current combined closure already
measured 175023 / 291468. Thus the fixture adds 849 types / 1278 instantiations;
omitting it would have hidden cost while still failing the old instantiation cap.
Public import repairs were applied first. These measurements show bounded additive
growth, not evidence warranting a speculative type-system redesign. The amendment
restores fixed 2% type / 3% instantiation headroom, rounded to hundreds, only to
the exceeded caps. Both passing caps remain unchanged. Exact ceilings and complete
membership are pinned by tests; automatic baseline refresh is not introduced.

`npm run check:inference` passed both cohorts with these measurements as part of
the full-suite preflight. Standing authority:
`../decisions/2026-09-10-engineering-budget-repair-autonomy.md`.

The named compositor extension-cost closure passed unchanged: core 144979/150000,
planner 322467/330000, renderer support 94970/100000, direct dependencies
174396/295000 bytes; aggregate 33/34 modules, 562416/575000 bytes. This measures
that existing named closure, not every new authoring or reader module.

## Production budget amendment

All 12 reader production routes and both dev-only isolation gates pass. The
shared equation closure measured 152463 gzip bytes (previous released observation
142144; previous accepted baseline 138095 and limit 145000). Emitted attribution
includes endpoint handoff (1619), native paint observation (3472) and paint geometry
(2131) bytes, alongside shared layout/continuity code. These are realized-paint
checks, not editor, WebGL or runtime KaTeX leakage. The static module script list
also grows with the shared chunk graph; this contributes to generated HTML growth.
These numbers identify included mechanisms, not a controlled per-module causal
delta. The build still has advisory large-chunk warnings outside the reader gate.

Under standing bounded-budget authority, the shared runtime baseline is 152463
in both manifest and architecture owner. Only exceeded HTML baselines change:
solve-x gzip 4978→5303; fractional-linear gzip 5510→5836; radical raw 22307→23648;
foldable-distribution gzip 6451→6791; fractional-transfer gzip 4549→4864. All
passing HTML baselines, other runtime routes, the 5% growth policy, forbidden
assets and entry ceiling stay fixed. Removing paint validation or publishing an
unchecked handoff issuer would sacrifice correctness to save bytes; neither was
done. Future optional-loading work should retain issued authority and measure
actual route closures, not introduce a second animation pipeline.

## Browser preservation

The accepted s12 visual checkpoint was followed by a source-only four-state,
two-symbol caller without new motion logic. The real native compositor canary
checks both four- and five-state callers, realized paint continuity, exclusive
fan-out ownership, reverse/interruption and deliberate non-rigid corruption.
Its seek coordinates are semantic phases, not elapsed motif-duration fractions.

- `npm run visual:composed-algebra -- --grep 'complete algebra native handoff canary|primary: compound factoring uses|primary: evaluation contributor'`: 4 Chromium checks passed.
- `npm run visual:composed-algebra:cohort -- --grep 'extended|shorter two-symbol|question-oriented|independent algebra|complete algebra native|primary: compound factoring uses|primary: evaluation contributor|three-stop controls'`: 39 checks passed, 13 each Chromium, Firefox and WebKit.

WebKit is automated engine coverage, not a claim of physical-device Safari testing.
Human approval covers the primary aesthetic; automation covers preservation and
interaction, not demonstrated learning gains.

## Completed release checks

- `npm run test:composed-algebra-authoring`: 100/100 passed, including actual
  immutable edition writes, overwrite rejection, both source lengths and v1.
- `npm run visual:composed-algebra`: all 47 Chromium checks passed, including
  five retained authoring-trial sources and their existing immutable editions.
- `npm run build`: passed complete TypeScript/Svelte/domain checks and Vite build;
  zero Svelte errors/warnings. `npm run build:bundle` passed again after the
  manifest budget amendment; canonical tax and demand-shift publication current.
- `npm run check:reader-budgets`: all 12 routes passed after the documented
  amendment, repeated against the final rebuilt artifacts.
- `npm run check:reader-production`: 12 routes passed against final artifacts.
- `npm run check:dev-review-production`: 464 files / 12 forbidden markers passed.
- `npm run check:native-katex-compositor-conformance-production`: 9 forbidden
  markers passed. Both isolation gates repeated against the final rebuild.
- `npm run check:compositor-extension-cost`: unchanged named closure passed again.
- `npm run check:equation-reachability`: all 68 roots current after generation.
- `npm run check:composed-algebra-workflow`: both legacy source workflows passed;
  deterministic fixtures, zero model calls, no timing or learning claim.
- `node --disable-warning=ExperimentalWarning --test tests/typescript-inference-budget.test.ts tests/semantic-reader-route-budget.test.ts`: 13/13 passed, including complete v2 consumer retention.
- `theseus workspace validate` and `git diff --check`: passed before recording
  final evidence; repeated at commit boundaries.

`npm run typecheck` also passed standalone after the production and budget repairs,
with zero Svelte errors/warnings. `npm test` executed 7012 tests in 949.6 seconds:
7011 passed, one failed because the exact renderer-facade caller inventory omitted
the newly corrected native-handoff public import. The graph and architecture gate
already included it correctly. The only subsequent code change added that exact
caller to the test's expected list; no production behavior or check was weakened.
`npm run test:equation-reachability` then passed all 12 tests, including the failed
assertion, and the generated graph freshness check passed again. The full suite
was not rerun after this test-expectation-only repair; do not describe the original
`npm test` process as a clean pass. All observed failures are resolved by the
recorded focused reruns.
