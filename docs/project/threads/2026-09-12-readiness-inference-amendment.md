# Release inference-cost amendment

The release's first npm run test stopped at the existing combined inference
type ceiling. This is handled under the user's standing automatic approval for
bounded engineering/TypeScript budget repairs, not a waived correctness gate.

Actual unchanged 51-fixture cohort: 178,493 types / 300,444 instantiations.
The old combined ceilings were 176,800 / 301,600. Core remains below its
unchanged 117,700 / 198,900 ceilings at 115,831 / 198,356.

Attribution used a read-only compiler-host counterfactual: retain the exact
compiler options and all 51 fixtures, but substitute the audit-baseline text of
the five immutable-adoption caller files (tax asset, governed tax source,
TypeScript refactor operations, Bayesian evidence, fraction equivalence).
That version still typechecks and produces 175,948 types / 292,801
instantiations. Ordinary current compilation reproduces the CLI's counts
exactly. Thus the adopted deep-immutable data boundary accounts for 2,545 types
and 7,643 instantiations in this comparison. This is compiler workload,
not downloaded bytes or an animation-time regression.

The factory already names its output type and the consumer cohort remains
directly scoped. Removing the recursive readonly/unsupported-data checks or
reverting caller adoption would trade away the approved ownership guarantee;
no such weakening was made. A speculative broad type rewrite is not justified
to recover this small, attributed increase during release.

Amend only combined types to 182,100: measured 178,493 plus the existing bounded
2% type-headroom rule, rounded up to 100. Keep the passing 301,600 instantiation
cap, both original core caps, exact 49+2 membership, active checking and all
negative fixtures. The budget test records exact values and still constrains
headroom. Core and combined instantiation headroom are tight; future changes
must continue measuring rather than silently increasing them.

Durable verification owners: npm run check:inference and
tests/typescript-inference-budget.test.ts, followed by a fresh full npm run test.
The temporary read-only attribution script was removed. This is an explicit
cost-policy amendment, not an optimization or a claim that compiler cost fell.
