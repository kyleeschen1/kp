# KP Core Ownership Baseline

Captured: 2026-08-16
Scope: `run-contract.kp.core-ownership-convergence-v2`, slice 2

This dated snapshot fixes the pre-refactor evidence for the ownership tranche.
It is descriptive, not a second plan or a new budget authority. The approved
proposal owns rationale and scope; the Theseus contract owns execution.

## Source dependency baseline

The existing architecture command passes, but its five checks protect selected
seams rather than the complete source import graph:

```text
concept-room architecture gate: 105 files, 7 frozen legacy exceptions
semantic-reader architecture gate: 156 files
semantic-animation architecture gate: 565 files, 6 compatibility paths
operation-evaluation presentation boundary: 3 motif consumers
equation compiler authority: 1,557 source files
```

The following production imports currently point from a lower-level ownership
zone into a tutorial, editor, or application owner:

| Lower-level owner | Higher-level dependency | Current callers |
| --- | --- | --- |
| semantic | tutorial program trace | `src/semantic/program-trace-asset.ts` |
| semantic | tutorial linear-solve card | `src/semantic/linear-solve-asset.ts` |
| animation | tutorial program trace | `src/animation/program-trace-frame-preview.ts`, `src/animation/external-programming-port.ts`, `src/animation/programming-addition-runtime-frame.ts`, `src/animation/non-equation-sampled-frame-adapter.ts` |
| rendering | editor HTML encoder | `src/rendering/scheme-factorial-html.ts`, `src/rendering/scheme-factorial-first-expansion-html.ts`, `src/rendering/python-refactor-code-html.ts`, `src/rendering/typescript-refactor-code-html.ts` |
| rendering | application theme | `src/rendering/distribution-area-exemplar-svg.ts` |
| public compatibility | editor equation catalog | `src/public/equation-animation-manifest.ts`, `src/public/kp-animation-sdk.ts` |

This is the exact known-exception cohort to classify before the new global gate
can ratchet. Any additional lower-to-higher import discovered by the AST scan is
a new finding, not silently part of this baseline.

## Verification cost baseline

| Check | Result | Observed wall time |
| --- | --- | ---: |
| `npm run check:architecture` | pass | 4.05 s |
| `npm run check:inference` | pass: 52,864 types; 71,006 instantiations; TypeScript check 2.87 s | 5.76 s |
| `npm run typecheck` | pass: Svelte 0 errors, 0 warnings; domain project pass | about 42 s |
| `npm test` | pass: 4,752 / 4,752 | 439.12 s test duration |
| `npm run build:bundle` | pass: 1,446 modules; Vite build 2.76 s | 7.76 s |
| `npm run check:reader-production` | pass: 12 manifest routes | 1.34 s |
| `npm run check:dev-review-production` | known failure: two built CSS files contain `data-kp-dev-toolbar` | 0.78 s |

The dev-review production-closure failure belongs to the already deferred
bundle/application tranche. This ownership tranche must not conceal it or
expand into CSS and application-entry restructuring.

## Bundle baseline

The existing bundle boundary passes:

| Closure | Measured gzip | Ceiling | Headroom |
| --- | ---: | ---: | ---: |
| Animation Library outer shell | 10,819 B | 50,000 B | 39,181 B |
| Main host | 196,852 B | 490,000 B | 293,148 B |
| Measured catalogue route script | 118,535 B | 190,000 B | 71,465 B |
| Place-value incremental | 74,980 B | 75,000 B | 20 B |

The place-value closure is therefore passing but has no meaningful operating
margin. Its largest named contributors are the native-KaTeX scene compositor
(26,353 B gzip), the place-value surface capability (27,564 B), and its adapter
(7,394 B). Repairing that closure is explicitly the next tranche, after source
ownership converges.

The production build also reports two chunks above 500 kB uncompressed:
`graph-webgl-three` (528.81 kB) and `semantic-animation-workbench-view`
(676.95 kB). These are attribution inputs for the next tranche, not reasons to
split files mechanically during this one.

## Preservation interpretation

- Current semantic IDs, URLs, clocks, endpoints, visuals, and bundle ceilings
  are the before-state.
- Ownership changes must preserve runtime behavior and keep the above bundle
  gates passing.
- The new architecture gate should replace this prose inventory with an
  executable, source-derived policy; this document remains the historical
  baseline.
- The two production-closure CSS leaks and the 20-byte place-value margin stay
  visible as deferred debt rather than being accidentally declared healthy.
