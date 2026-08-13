# TypeScript Threshold Pre-Exemplar Baseline

Date: 2026-08-13

Revision before slice work: `fffcd2d6aea1772761d1d1a16092bb77402636e0`

Run: `run-contract.kp.typescript-threshold-architecture-convergence-v1`

## Protected Worktree

The loop starts with two pre-existing tracked edits that are outside its
authority:

- `content/lessons/economics-demand-shift.kp.md`
- `src/tutorial/economics-demand-shift/economics-demand-shift-publication.generated.json`

Their combined unstaged patch hash is
`a5430a36a8607a425e617310febf99cc10ec69af`. The unrelated untracked decision,
review, thread, and specification documents visible at loop start are also
excluded from every commit pathspec.

## Repository Scale

| Measure | Baseline |
| --- | ---: |
| Files under `src/` | 1,395 |
| Source TypeScript, Svelte, and CSS lines | 318,499 |
| Files under `tests/` | 1,232 |
| Node unit-test files | 1,018 |
| Named `public-api.ts` files | 13 |
| Built files | 381 |
| Built directory size | 9,016 KiB |

These aggregate measurements are context, not transfer budgets. Route closure
remains the product authority.

## Architecture And Compatibility

- `npm run check:architecture` passes across 102 concept-room, 156 reader, and
  468 semantic-animation files.
- The semantic-animation boundary reports zero frozen architecture exceptions
  and seven classified compatibility paths.
- The narrow retirement candidate is
  `compatibility.typed-gap-to-legacy-fade`; its declared production consumer is
  `src/domain-ir/semantic-equation-transition-compiler.ts`.
- The canonical governed construction facade has zero production callers and
  12 test callers. The older narrow balanced-solve authoring facade has exactly
  two production callers.

## Route-Specific Bundle Baseline

| Closure | Measured gzip bytes | Ceiling | Headroom |
| --- | ---: | ---: | ---: |
| Catalogue outer shell | 10,148 | 50,000 | 39,852 |
| Main host | 186,429 | 490,000 | 303,571 |
| Measured economics catalogue route scripts | 112,449 | 190,000 | 77,551 |
| Place-value incremental capability | 70,481 | 75,000 | 4,519 |

The outer shell contains no forbidden animation-runtime files. The TypeScript
compiler is not present in the measured browser closures; later slices must
preserve that property.

## Baseline Commands

- `npm run check:architecture` — pass.
- `npm run check:animation-library-bundle-boundary` — pass.
- `npm run audit:animation-api-callers` — confirms zero production callers for
  the governed construction facade and twelve test callers.
- `theseus workspace validate` — valid before slice implementation.

## Preservation Rule

Every subsequent slice must compare its changed source and route-specific
metrics against this baseline. Aggregate repository size may explain a change,
but cannot justify weakening a route budget, adding a runtime authority, or
touching protected worktree content.
