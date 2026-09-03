# Typed Semantic State Facade API Gate

Date: 2026-09-03
Run: `run-contract.kp.typed-semantic-state-facade-derived-graph-v2`
Slice: s12
Decision: retain the internal facade and proceed to the explicit derivation boundary

## Decision

Retain the descriptor, handle, and transformation shapes implemented in s02-s11.
They remove the kernel-specific work from ordinary concrete and optional state
authoring, keep exact leaf callback types, and compile to the existing immutable
transaction authority. Do not promote the API publicly.

The one visible defect in the equivalent market packet is narrow and already
owns the next scheduled slice: initial derived declarations still use the s04
internal plan bridge and therefore expose three `.slotId` reads. Slice s13 must
replace those reads with typed dependency-handle tuples while keeping executable
compute functions outside snapshots. Hiding these reads in a fixture helper
would improve the count without improving the author boundary, so this gate
leaves them visible.

## Measured Packet

The executable comparison is between the frozen raw packet at
`tests/fixtures/semantic-state-authoring/raw-market.ts` and the typed packet at
`tests/fixtures/semantic-state-authoring/typed-market.ts`.

| Measure | Raw | Typed s12 |
| --- | ---: | ---: |
| Manual identity-factory calls | 10 | 0 |
| Low-level state construction calls | 7 | 0 |
| Manual kernel operation metadata fields | 7 | 0 |
| Persistent-value runtime narrowings | 1 | 0 |
| Author casts | not separately measured | 0 |
| Temporary derived `.slotId` references | not separately measured | 3 |
| Nonblank authored setup lines | 69 | 31 |

Line count is supporting evidence, not the design objective. The important
improvement is that `state.market.supply.update` receives and returns
`TypedMarketCurve` directly, while optional-only and derived-read-only
capabilities remain discoverable from the handle type.

## Compiler And Type-Surface Review

The convergence slice found that keeping all cumulative negative examples in
the repository's inference fixture expanded the measured program past its
existing ceiling. The bounded correction moved exhaustive negative assertions
to `tests/type-contracts/` and retained a small representative public surface in
`tests/type-fixtures/`. Both remain in typecheck; only the intended representative
surface contributes to the inference ratchet. The final s11 measurement was
102,883 types and 172,113 instantiations, below the unchanged ceilings of
103,000 and 176,000.

This is evidence for keeping capability interfaces slim and testing recursive
mapped types through representative fixtures. It is not evidence for runtime
code generation, `Proxy`, looser value types, or weaker negative contracts.

## Boundaries Retained

- Stable references are ordinary frozen objects; reads are explicitly pinned.
- Callback or statement order does not provide identity.
- `bind` and `bindCopy` remain distinct semantic operations.
- Derived leaves remain read-only until a named derived-binding transaction
  operation exists.
- The facade remains internal and renderer-, timeline-, and domain-neutral.

The next gate is therefore concrete: s13 succeeds only if typed derivation
definitions remove the three temporary slot references without putting closures
in snapshots, discovering dependencies from execution, or adding a registry.
