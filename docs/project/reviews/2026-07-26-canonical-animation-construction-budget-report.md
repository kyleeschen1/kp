# Canonical animation construction budget report

Date: 2026-07-26

Run contract:
`run-contract.kp.canonical-animation-construction-governed-round-trip-v1`

Slice: 28, performance, payload, and route budgets

## Result

The governed construction cohort, reconciliation compositor, isolated review
surface, and all eight ordinary reader routes pass fixed budgets. No existing
reader or compositor ceiling was raised. The review-only baseline is new and
is enforced by `npm run check:canonical-animation-budgets`.

| Measurement | Observed | Frozen maximum |
|---|---:|---:|
| Governed cohort construction p95 | 4.171 ms | 50 ms |
| Canonical verification/audit p95 | 1.004 ms | 10 ms |
| Compound frame sample p95 | 0.0059 ms | 0.1 ms |
| Serialized projection bundle | 26,725 bytes | 48,000 bytes |
| Review entry JavaScript gzip | 2,302 bytes | 4,000 bytes |
| Review shell closure gzip | 47,734 bytes | 80,000 bytes |
| Review shell + live KaTeX iframe closure gzip | 236,565 bytes | 250,000 bytes |
| Review shell closure files | 17 | 32 |
| Review-only files in ordinary reader closures | 0 | 0 |

Timing measurements have generous machine-noise headroom, while payload and
closure limits stay close enough to reject unexplained dependency growth.

## Existing compositor budgets

`npm run perf:glyph-reconciliation-experiment` continues to pass without
changing its established ceilings:

- cold reconciliation plan: 1.921 ms against 12 ms;
- cached plan: 0.058 ms against 2 ms;
- static frame sampling: 0.0041 ms against 1 ms;
- 32-track native scene sampling: 0.0102 ms against 1 ms;
- typography style sampling: 0.0188 ms against 1 ms;
- maximum planner work: 35 operations against 10,000;
- largest serialized plan: 2,573 bytes against 32,768; and
- experiment entry growth: 6,307 gzip bytes against 12,000.

## Route isolation

`npm run check:reader-budgets` passes the existing five-percent growth limits
for all eight accepted routes. The largest equation-reader runtime closure
remains 68,921 gzip bytes; the distribution and quadratic routes remain
14,161 and 14,442 bytes respectively. No route imports the canonical review
entry or governed-construction chunks.

The 236,565-byte combined review closure is explained and intentionally
isolated: the gallery iframe executes the existing full live KaTeX experiment
so it can show the real compositor, not a static imitation. The shell itself is
47,734 bytes, and none of this review-only closure reaches learner routes.
This first measured baseline is frozen at 250,000 bytes rather than pretending
the live renderer fits the pre-measurement 128,000-byte estimate.

## Durable checks

- `npm run check:canonical-animation-budgets`
- `npm run perf:glyph-reconciliation-experiment`
- `npm run check:reader-budgets`
- `npm run check:reader-production`
- `npm run build`

Budget comparison tests reject every metric independently and reject any
review-only chunk that leaks into an ordinary reader closure.
