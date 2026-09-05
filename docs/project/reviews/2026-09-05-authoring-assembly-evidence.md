# Internal Authoring Assembly Evidence

This is implementation evidence for the accepted
[authoring-integration proposal](2026-09-05-authoring-integration-market-preview-long-loop-proposal.md),
not a second execution plan or a public API promotion. Theseus owns run progress.

## What the specimen establishes

The internal composed-market specimen now declares its existing schema,
explicit domain derivations, typed families, named applications, and explanation
structure through model/explanation assembly. Assembly delegates to the existing
schema compiler, handles, derived graph, aggregate snapshots, preflight, endpoint
chain, and family evaluators. It does not introduce another semantic store,
transaction engine, inferred dependency tracker, or mathematical authority.

`npm run test:authoring-integration` executes the frozen manual source from
`tests/fixtures/authoring-integration/composed-market-baseline.ts.txt` in the Node
test environment and compares the migrated packet's snapshots, journals,
declarations, and composition handles. This is trusted committed test source,
not permission to evaluate arbitrary source in a browser. Existing market
characterization and 257-address pressure tests retain their economic assertions.

The final composed variation remains demand intercept 14 and tax 2, with exact
quantity 5, consumer/producer prices 9/7, revenue 10, and total surplus 35. It is
not the reviewed canonical demand-12/tax-4 reader scenario.

## Measured author cost

The stable command prints `AUTHORING_COST` using
`tests/helpers/authoring-integration-cost.ts`. Counts are nonblank source lines,
not compressed tokens or claims about elapsed authoring time.

| Measure | Frozen manual | Internal assembly |
| --- | ---: | ---: |
| Authored setup | 205 | 158 |
| Setup orchestration | 52 | 15 |
| Semantic declarations | 153 | 143 |
| Compatibility return | 23 | 29 |
| Charged orchestration, including added compatibility glue | 52 | 21 |
| Entire specimen module | 330 | 267 |
| Import modules | 22 | 14 |
| Import lines | 66 | 44 |

The model wrapper's seven lines, handle alias, and all seven explanation assembly
lines count as orchestration. Only the nested explicit domain derivation
declarations are excluded from that wrapper charge, matching the baseline rule.
All six added compatibility return lines are charged, including the newly exposed
model/explanation references. The charged orchestration reduction is 59.6%; the
overall authored setup reduction is 22.9%. Exact-rational helper bodies remain
byte-for-byte unchanged; no market-specific glue moved into shared helpers.

New shared source cost, including imports and type declarations:

| Internal module | Nonblank lines |
| --- | ---: |
| Model assembly | 81 |
| Explanation assembly | 133 |
| Query session | 79 |
| Diagnostic boundary | 94 |
| Total | 387 |

This is reduced caller orchestration at the cost of additional shared code, not
a net code-size reduction. The later fixed inference/import gate must assess
whether that shared abstraction cost remains acceptable; this report does not
pre-approve new budgets.

## Preserved boundaries and remaining product work

- Independent cohorts larger than two return typed unsupported gaps. A retained
  pair certificate checks its two orders at its pinned base only; it is not a
  universal read-independence proof. Aliased driver writes and binding/lifecycle
  changes are excluded from the independent path.
- Query sessions own bounded acceleration and request-local derived evaluation.
  Recovery indexes reference public settled snapshots only, not sample history
  or private pair execution endpoints. Reset/disposal cannot rewrite snapshots.
- The explicit diagnostic boundary retains original exceptions and observed
  source/declaration/target metadata. Missing, stale, foreign, and invalid-operation
  fixtures return repair gaps without partial authored values. Unknown codes are
  unclassified, never invented support or certification evidence.
- This remains a nonvisual internal specimen. Typed-math integration, canonical
  asset lowering, author edit/preview behavior, cross-view reader integration,
  and the mandatory author/API plus visual checkpoint remain separate obligations
  of the approved proposal. No renderer, Article, publication, or public facade
  migration follows from these measurements alone.

## Bounded math storage boundary

The math-owned state adapter deep-freezes structural descriptors through the
existing aggregate value validator. It explicitly retains the existing hidden
Hessian symmetry evidence in enumerable state data. It neither serializes
functions nor mints new law, operation, or rendering authority.

Local map/basis registrations require explicit scope, capability identity, kind,
and version. Only their data references enter state. A typed local binding is
required to recover the callable; missing, foreign, disposed, and stale-version
cases fail explicitly. An existing version cannot be overwritten, and an older
reference cannot silently resolve to the latest capability. Version assignment
remains the author's declaration, not a hash or proof of callback semantics.

The broad source-inventory check observed 16 added scanned files from the approved
assembly/bridge modules, tests, helper, and baseline metadata. Regeneration changed
only `scannedFileCount` from 4207 to 4223 in the exact equation reachability graph.
Its 68 roots, callers, policy, and all budget ceilings remained unchanged.
