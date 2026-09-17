# Reader HTML cohort correction

Approved scope: standing September 10 engineering-budget repair authority,
within slice `chain.nonterminal-reader`. This is an explicit HTML baseline
amendment, not an optimization or a visual/semantic change.

`npm run build:bundle` and `npm run check:reader-budgets` exposed three small
HTML overruns. A detached clean build of `7032e4798` (before either chain
implementation slice), using the same installed dependencies, produced exactly
the same raw/gzip sizes and identical HTML after asset-hash normalization.
The scratch checkout was removed after comparison.

| Consumer | Raw bytes before / after | Gzip before / after | Failed metric: old baseline → new baseline |
| --- | --- | --- | --- |
| `/reader/generated-solve-x/` | 55,293 / 55,293 | 5,177 / 5,177 | gzip 4,914 → 5,177 |
| `/reader/split-merge-fractions/` | 32,097 / 32,097 | 4,306 / 4,306 | raw 30,526 → 32,097 |
| `/reader/fraction-composition/` | 124,276 / 124,276 | 8,051 / 8,051 | gzip 7,664 → 8,051 |

The affected routes share the same 56-module production bootstrap cohort;
their heads measure 5,041, 5,069 and 5,091 bytes. The latter two routes both
stand 1,571 raw bytes above the older complete-HTML baseline. The discrepancy
predates this run; this comparison does not attribute every historical byte to
a particular earlier commit. No learner content or consumer is removed.

Alternatives considered: change the shared publication bootstrap, strip static
content, or amend only the stale measured dimensions. Bootstrap redesign would
change loading behavior across unrelated readers; content stripping would hide
cost. Adopt the bounded amendment. Existing executable route checks, forbidden
asset checks, every consumer, all other baseline dimensions, the 152,463-byte
shared runtime baseline and the 5% growth allowance remain unchanged. New
limits are 5,436 gzip, 33,702 raw, and 8,454 gzip bytes respectively.

A separate import-boundary improvement keeps refinement correspondence lazy in
the mechanics reader instead of eagerly importing domain plans at initial load.
It does not repair or explain these unchanged HTML overruns. Closure measurements
are gzip transfer estimates over emitted JS/CSS, not browser timing measurements.

Repeatable evidence: `npm run build:bundle`, `npm run check:reader-production`,
`npm run check:reader-budgets`, and
`node --experimental-strip-types --test scripts/check-reader-route-budgets.test.ts`.
Theseus records the final results with this slice.
