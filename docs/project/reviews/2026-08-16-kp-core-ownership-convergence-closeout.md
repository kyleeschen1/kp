# KP Core Ownership Convergence Closeout

Status: complete
Completed: 2026-08-16
Run contract: `run-contract.kp.core-ownership-convergence-v2`

## Outcome

The approved ownership tranche is complete. KP now has one mechanically
enforced TypeScript dependency-direction policy over the full production graph,
and its exact exception ledger has fallen from 18 entries to zero without a
visible, semantic, URL, or bundle-ceiling change.

The work also retired the unexported legacy equation-animation SDK after an
exact caller audit, moved program-trace contracts and fixtures into neutral
domain ownership, removed the linear-solve semantic-to-tutorial cycle, moved
HTML output encoding out of editor ownership, and replaced a renderer-to-theme
dependency with an injected neutral theme reference.

## Before And After

| Measure | Baseline | Closeout |
| --- | ---: | ---: |
| Exact dependency exceptions | 18 | 0 |
| Full-suite tests | 4,752 passing | 4,774 passing |
| Full-suite duration | 439.12 seconds | 428.43 seconds |
| Production build modules | 1,446 | 1,444 |
| TypeScript compiler types | 52,864 | 52,888 |
| TypeScript instantiations | 71,006 | 71,039 |

The final dependency gate covered 1,563 TypeScript modules and reported
5,507/5,544 local references with no exact retiring exceptions. The small type
count movement buys the new ownership declarations and gates; it does not
indicate another combinatorial expansion.

## Ownership Changes

- `src/domain/programming/` owns the reusable program source, trace contracts,
  and deterministic addition trace fixture. Tutorials and renderers project
  that truth rather than defining it.
- Linear-solve semantics no longer import tutorial behavior. Exact reachability
  proved that the old behavior module had no production callers before it was
  retired.
- `src/rendering/html-output-encoding.ts` owns context-specific text and
  attribute encoding. Editor code retains only a compatibility re-export.
- Renderers consume a narrow theme reference; application theme tokens remain
  application-owned.
- The private legacy equation SDK and its duplicate six-entry manifest were
  removed after the import graph proved zero production consumers.
- Dashboard, roadmap, and authority projections now name the neutral kernel and
  lazy family loader as the canonical path.

## Release Evidence

- `npm run typecheck` passed.
- `npm run check:architecture` passed, including the global direction gate.
- `npm run test:semantic-animation-convergence` passed 249 tests.
- `npm test` passed 4,774 tests with zero failures in 428.43 seconds.
- `npm run build:bundle` passed after transforming 1,444 modules.
- `npm run check:animation-library-bundle-boundary` passed every current
  ceiling.
- `theseus workspace validate` passed with 963 nodes and 21,856 events before
  final closeout records were added.

Vite still reports its known large-chunk warning. The place-value incremental
closure also remains only 20 gzip bytes below its 75,000-byte ceiling. Both are
explicit inputs to the next tranche rather than hidden debt in this one.

## Preservation Result

No choreography, visual tuning, semantic identity, sampled endpoint, public
URL, or publication contract was deliberately changed. The user's uncommitted
economics lesson and generated publication were left untouched. The binary
log-product visual checkpoint remains the catalogue's next human visual review
after architecture work.

## Next Tranche

`action.kp.bundle-application-isolation` is now the durable next architecture
action. It starts with measured selected-experience bundle scenarios, then adds
the native-KaTeX pack seam, repairs place-value headroom, and isolates Internal
Studio and Public Web entry graphs before considering pack, CSS, build-helper,
or physical-package changes. It has been recorded but not started.
