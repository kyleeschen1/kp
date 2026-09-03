# Semantic State Family Baseline

Date: 2026-09-03
Status: BASELINE CAPTURED
Run contract: `run-contract.kp.semantic-state-families-interpolation-v2`
Slice: `s01` (`baseline-and-law-ledger`)
Starting commit: `eaf8c8006`

## Outcome

The incoming persistent semantic-state kernel is green and endpoint-only.
There is no state-family sampling or exact semantic-progress API under
`src/semantic-state/`: an authored transform produces one ordinary immutable
application with exact `before`, `after`, and `commit` authority. The new
characterization test freezes that boundary before Loop 3 adds disposable
interior evaluation.

The baseline also serializes every persistent inventory that arbitrary samples
must leave byte-for-byte unchanged: aggregate snapshots, entity versions,
transaction and journal records, change sets, correspondence, provenance,
lineage, and recovery pins. Repeated captures of the same application are
identical, and none contains sample, progress, or transient records.

All required broad gates pass, so the slice stop condition did not fire. Slice
`s02` may add one exact-progress value without changing persistent authority.

## Incoming Surface

- `src/semantic-state/` contains 18 TypeScript modules, 5,512 lines, and 185
  direct exported declarations.
- `defineKpSemanticStateTransform(...)` exposes only `schemaVersion`, `kind`,
  `id`, `localId`, and `apply`.
- An applied transform exposes only `schemaVersion`, `kind`, `definitionId`,
  `transformationId`, `commit`, `before`, and `after`.
- The application reuses its commit's exact `before` snapshot; pinned endpoint
  handle reads produce the authored values without a sampling seam.
- Existing numeric progress and sampling code elsewhere in `src/semantic/`
  belongs to earlier animation, lifecycle, or renderer-facing contracts. It is
  not a semantic-state family API and is outside this loop's migration scope.

## Persistent Inventory Law

The characterization ledger captures these authorities from one committed
application and its existing authority projection:

1. the exact before and after aggregate snapshots;
2. every entity store and semantic version ID in those snapshots;
3. the transaction ID, transformation ID, and transaction journal;
4. the projected semantic change set;
5. the projected correspondence map;
6. the source and target provenance registries;
7. the projected lineage graph; and
8. aggregate-snapshot and slot-version recovery pins for both endpoints.

Interior samples added later must not add to or mutate any item in this list.
This is an exact serialized comparison, not a count-only proxy.

## Pressure-Caller Baseline

The existing supply-tax authoring fixture remains a Loop 2 endpoint pressure
case. Its setup uses 82 nonblank lines and no manual semantic IDs, stores,
kernel metadata, casts, or market-specific facade. Its current endpoint
transaction intentionally writes both `market.phase` and `market.supply`, then
exercises bind and bind-copy behavior. Loop 3 will preserve this fixture while
adding a separate family that writes only canonical `market.taxAmount` and
derives economics from domain-owned exact-rational authority.

The existing circle pressure fixture remains renderer-free, unit-tagged, and
nonlinear. It derives area and a point-dependent response from radius while
retaining compile-time and runtime wrong-unit rejection. It is the second
caller for the generic mechanism, not justification for circle-specific state
machinery.

## Command Evidence

- Focused baseline, supply-tax, circle, and derived-history tests passed 15 of
  15.
- `npm run test:semantic-state` passed 155 of 155 tests.
- `npm run typecheck` passed, including Svelte with zero errors and zero
  warnings and the domain TypeScript project.
- `npm run check:architecture` passed over 2,000 TypeScript modules and 7,411
  of 7,462 local references, with zero dependency exceptions and all eight
  cross-domain gateway tests passing.
- `npm run check:inference` passed with 104,742 types, 176,892
  instantiations, and no ratchet change.
- `npm test` passed all 6,265 tests in 560,461.742167 ms.
- `npm run build:bundle` passed, including the economics demand-shift
  publication check and a 1,603-module Vite production build in 2.42 s. The
  existing large-chunk advisory remains non-blocking.
- `theseus workspace validate` passed with 1,091 nodes and 27,029 events before
  the completed-slice evidence was recorded.

Adding the characterization test changed only the generated reachability
scanner's file count: 68 declared roots remain unchanged and the scan now
covers 4,130 files. No new production root or reachable implementation was
introduced.

## Decision

The baseline establishes an exact negative boundary: persistent transformation
application exists; state-family sampling does not. The next slice may add a
canonical exact progress value over the existing rational provider. It may not
add interpolation, sampling, timeline, renderer, KaTeX, or durable sample
authority.
