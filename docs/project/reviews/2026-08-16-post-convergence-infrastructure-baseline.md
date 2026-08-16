# Post-Convergence Infrastructure Baseline

Date: 2026-08-16  
Status: measured baseline for
`run-contract.kp.post-convergence-infrastructure-compression-v1` slice `s04`

## Result

The completed narrow core has substantially improved authority and extension
direction, but the routine authoring loop is not yet cheap. The equation path
still spans 39 authority files and 16,906 source lines, TypeScript's inference
fixture closure creates 57,283 compiler type objects, full typecheck takes
43.20 seconds on this host, and 222 named verification scripts obscure the
smallest truthful command. These are the denominators for this run; none is an
automatic deletion or line-count target.

The release baseline found one explained red gate: a source-level assertion in
`tests/equation-presentation-profile-authoring-ratchet.test.ts` still hard-codes
25 equation assets while the canonical inventory now derives 30. A direct
inspection confirms all 30 have an equation-domain typed profile, so this is a
stale aggregate-count ratchet rather than missing presentation authority. It is
scheduled for exact-set/test-owner replacement in slices `s17`-`s18`; the
baseline does not silently fix or waive it.

## Canonical Inventory

The generated projection at
`../../../src/architecture/post-convergence-infrastructure-inventory.generated.json`
reports:

| Measure | Baseline |
| --- | ---: |
| Loadable catalogue assets | 45 |
| Equation surfaces | 30 |
| Equation dispositions | 3 canonical, 22 adapter-backed, 4 static-only, 1 retirement candidate |
| Selected capability IDs | 10 |
| Compatibility ledger entries | 6: 1 canonical, 3 compatibility-only, 2 retained fixtures |

## Iteration Economics

Stable command: `npm run measure:equation-iteration-economics`

| Measure | Baseline |
| --- | ---: |
| Equation authority files | 39 |
| Equation authority source lines | 16,906 |
| Closed switch sites | 14 across 9 files |
| Direct function-wrap profile consumers | 2 |
| Direct function-wrap reception consumers | 7 |
| Test files scanned | 1,349 |
| Test lines scanned | 212,543 |
| Tests inspecting production source | 192 |
| Aggregate count-ratchet tests | 26 |
| Named verification scripts | 222 |
| Generic compatibility equation rows | 23 |
| Specialized adapter equation rows | 7 |
| Whole-equation fallback rows | 23 |
| Rows with non-semantic transitions | 5 rows / 8 transitions |
| Unique local sampler nodes | 15 |
| Private-clock rows | 0 |
| CSS-animation-authority rows | 0 |

The zero private-clock and CSS-animation-authority counts are preservation
requirements. Closed switches and source-inspection tests are diagnostic
candidates, not defects by count; later slices must distinguish generated
closed execution and useful architecture tests from handwritten extension
pressure.

## Compiler Cost

Stable command: `npm run check:inference`

| Measure | Baseline | Current budget | State |
| --- | ---: | ---: | --- |
| TypeScript compiler type objects | 57,283 | 50,000 | red; attribution required |
| Generic instantiations | 79,220 | 100,000 | pass |
| Compiler-reported check time | 2.57 s | informational | measured |
| Whole command wall time | 5.13 s | informational | measured |

`Types` is the compiler workset, not the number of KP domain declarations.
Slice `s05` must attribute it per fixture and import root before `s29` changes
implementation or budget.

## Bundle Closures

Stable command: `npm run check:animation-library-bundle-boundary`

| Closure | Baseline gzip | Budget | Headroom |
| --- | ---: | ---: | ---: |
| Outer catalogue shell | 10,819 B | 50,000 B | 39,181 B |
| Main host | 198,600 B | 490,000 B | 291,400 B |
| Measured catalogue route script | 114,866 B | 190,000 B | 75,134 B |
| Place-value incremental capability | 74,281 B | 75,000 B | 719 B |

Place value remains the tight selected-capability boundary. Loader and module
decomposition slices must preserve or improve all four closures and must stop
on unexplained chunk coalescing.

## Verification Timing On This Host

These wall times are orientation measurements, not flaky pass/fail budgets.

| Tier/sample | Command | Wall time | Result |
| --- | --- | ---: | --- |
| Focused | `npm run test:equation-extension-dispatch` | 1.15 s | 4/4 passed |
| Architecture boundary | `npm run check:architecture` | 3.49 s | passed |
| Full type boundary | `npm run typecheck` | 43.20 s | passed |
| Release attempt | `npm run health:pre-expansion:release` | 57.99 s to first failure | stopped at stale 25-row ratchet after 250/251 semantic-convergence tests passed |

The focused-to-typecheck ratio is the practical authoring problem. Slice `s06`
will expose explicit inner, boundary, and release commands; slice `s30` will run
the complete release gate and compare final costs.

## High-Churn Ownership

| File | Lines | Current concern |
| --- | ---: | --- |
| `src/editor/equation-surface-adapter.ts` | 4,233 | semantic projection, planning, measurement, sampling, paint, and compatibility coexist |
| `src/animation/symbolic-manipulation-family-registry.ts` | 5,236 | family metadata and pack-scale construction coexist in one review surface |
| `src/editor/selected-surface-capability-host.ts` | 208 | literal imports are correct, but the capability extension point is a handwritten conditional chain |
| `package.json` | 324 | discoverability is poor despite useful scoped commands |

Line reduction is not the objective. Slices `s21`-`s28` must improve ownership,
import closure, or extension edits while retaining exact runtime behavior.

## Baseline Decision

Continue the approved run. Bundle, architecture, typecheck, semantic profiles,
and deterministic authority remain intact. The one release failure is explained
and belongs to an already approved exact-set/test-owner slice. It is recorded
as debt and must be green by release closeout; no gate has been weakened.
