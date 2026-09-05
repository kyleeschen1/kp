# Semantic State Aggregate Composition Baseline

Date: 2026-09-04
Run contract: `run-contract.kp.aggregate-composition-logical-timeline-v1`
Slice: `s01` — Baseline and aggregate-law ledger

## Baseline Result

The Loop 4 baseline is green after regenerating the exact equation
reachability graph for the added characterization test. The new test freezes
the current single-family boundary and proves that aggregate composition and
logical timeline authority do not yet exist accidentally.

## Frozen Metrics

| Measure | Loop 3 checkpoint | Loop 4 baseline |
| --- | ---: | ---: |
| Semantic-state tests | 260 | 261 |
| Repository tests | 6,375 | 6,376 |
| TypeScript types | 107,053 | 107,053 |
| TypeScript instantiations | 181,758 | 181,758 |
| Semantic-state modules | 24 | 24 |
| Semantic-state source lines | 7,784 | 7,784 |
| Direct-module exported declarations | 271 | 271 |
| Supply-tax authoring packet, nonblank lines | 106 | 106 |
| Circle authoring packet, nonblank lines | 70 | 70 |

The architecture check scanned 2,007 TypeScript modules and resolved 7,464 of
7,515 local references with zero exceptions. The production bundle transformed
1,603 modules. The exact equation reachability graph retains 68 roots and now
records 4,168 scanned files because the characterization test is in scope.

## Frozen Absence Contract

`tests/semantic-state-aggregate-baseline.test.ts` characterizes the current
supply-tax family at exact progress `1/4` and `3/4`. It proves all of the
following before aggregate implementation begins:

- sampling does not change the persistent snapshot, application, transition
  plan, commit boundaries, or operation journal;
- a family application exposes no composition members, nested scopes,
  boundary table, or logical address;
- a family evaluator exposes neither historical seek nor branching authority;
- exact sampling remains caller-cached and produces two misses for two distinct
  progress values in a capacity-two cache.

This is a characterization boundary, not a claim that property absence should
remain the final API. Later slices must add aggregate authority explicitly and
retain the single-family laws recorded here.

## Verification

- `npm run verify:impact -- --path tests/semantic-state-aggregate-baseline.test.ts`
- `npm run test:semantic-state` — 261/261 passed
- `npm run typecheck`
- `npm run check:architecture`
- `npm run check:inference` — 107,053 types; 181,758 instantiations
- `npm run test:equation-reachability` — 12/12 passed after regeneration
- `npm test` — 6,376/6,376 passed after the generated scanned-file count was
  repaired by the stable generator and the active-queue wording was retained
  on one line for its existing project-direction contract
- `npm run build:bundle`
- `theseus workspace validate`

The complete suite passed after both bounded baseline repairs.
