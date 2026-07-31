# Release Baseline Characterization

Date: 2026-07-31
Status: frozen post-host-repair baseline
Run contract: `run-contract.kp.release-baseline-recovery-v1`, slice `s02`
Measured build: `f4d4a65d`

## Scope

This record freezes the six remaining release failures after the Animation
Library host repair. It is evidence for the approved recovery run, not a
second plan. No threshold, production source, route, or animation behavior was
changed while recording it.

The exact four-file architecture command produced 20 tests: 16 passed and the
four failures below reproduced. Both payload commands also reproduced their
single shared-closure failure. The inspected owner paths do not overlap the
user's unrelated dirty project-memory files.

## Frozen Failures

| ID | Current measurement | Owner and later slices | Preservation boundary | Exact check |
| --- | --- | --- | --- | --- |
| `html-helper-count` | 22 files define `function escapeHtml`; accepted count 21; excess 1 | `tests/canonical-animation-construction-inventory.test.ts` owns the ratchet; the 22 context-specific consumers are classified in `s06`, one proven duplicate is consolidated in `s07`, and context laws close in `s08` | Preserve `src/tutorial/generated-html-escaping.ts`, its text/attribute/script-JSON distinctions, and byte-for-byte accessible output unless a focused consumer test proves an intentional equivalent | `node --disable-warning=ExperimentalWarning --test tests/canonical-animation-construction-inventory.test.ts` |
| `canonical-scene-source` | 141,543 source bytes; accepted ceiling 136,000; excess 5,543; exactly four audited modules | `src/architecture/canonical-equation-renderer-convergence.ts` and `tests/canonical-equation-renderer-convergence.test.ts`; closure audit in `s12`, responsibility reductions in `s13`-`s14`, closeout in `s15` | Preserve the four-module measured closure, five paint kinds, six lifecycles, one ephemeral renderer session, public scene contracts, native KaTeX paint ownership, direct seek, rewind, and accepted glyph behavior | `node --disable-warning=ExperimentalWarning --test tests/canonical-equation-renderer-convergence.test.ts` |
| `linear-provider-direction` | `providers/linear-problems/rational.ts` imports `../../domains/math/exact-rational.ts`; the provider therefore depends on a KP domain pack | Provider rational facade, current domain rational authority, and neutral `protocols` boundary; neutral authority in `s09`, migration in `s10`, single-authority proof in `s11` | Preserve `providers/linear-problems/public-api.ts`, exact DTOs, normalization and bigint semantics, generated fixtures, and the prohibition on provider-to-KP or presentation dependencies | `node --disable-warning=ExperimentalWarning --test tests/linear-provider-boundary.test.ts` |
| `operation-promotion-evidence` | `executable-motif.promotion.operation-evaluation` points to metadata-only `src/editor/animation-library-display-catalog.ts`, where its needle is absent. The adjacent exact-fraction evidence record has the same stale path; both needles live in `animation-library-display-catalog-builder.ts` | `src/architecture/operation-presentation-migration-inventory.ts`; split-aware ledger repair in `s04` | Keep the runtime display catalog metadata-only; it must not import promotion certificates or reconstruct source evidence | `node --disable-warning=ExperimentalWarning --test tests/operation-presentation-migration-inventory.test.ts` |
| `main-host-payload` | Main host 495,627 gzip bytes; ceiling 490,000; excess 5,627. Outer shell is 9,911/50,000 and place-value incremental closure is 70,436/75,000, so neither is the failing closure | `scripts/check-animation-library-bundle-boundary.ts` owns measurement; stable attribution in `s03`, main-host pruning/lazy loading in `s16` | Preserve the metadata-only Animation Library shell, `src/animation/catalog-packs/place-value.ts` as a lazy pack, route identity, selection/readiness behavior, and the accepted three ceilings | `npm run check:animation-library-bundle-boundary` |
| `shared-reader-payload` | Nine equation-reader routes share a 151,256-byte runtime closure; baseline 138,095, 5% ceiling 145,000, excess 6,256. Distribution-area (14,936) and quadratic-branching (14,796) remain green; no compiled-HTML metric fails | `scripts/check-reader-route-budgets.ts`, the shared reader entry/runtime closure, and the route manifest; stable attribution in `s03`, shared closure repair in `s17`, route proof in `s18` | Preserve all 11 manifest routes, one shared reader runtime, compiled content, typography, Review, accessibility, direct navigation, and static/export behavior | `npm run check:reader-budgets` |

## Canonical Scene Byte Attribution

The current four-file source total is deterministic:

| Audited source | Bytes |
| --- | ---: |
| `src/rendering/native-katex-fragment-observer.ts` | 11,081 |
| `src/rendering/native-katex-glyph-compositor.ts` | 11,783 |
| `src/rendering/native-katex-rendered-scene.ts` | 22,512 |
| `src/rendering/native-katex-scene-compositor.ts` | 96,167 |
| **Total** | **141,543** |

These numbers are characterization only. Moving responsibility to an
unmeasured helper is explicitly not a repair; `s12` must make the closure
audit resistant to that evasion before source reduction begins.

## HTML Output-Context Inventory

The 22 current local helper owners are:

- capture-only HTML: `scripts/capture-animation-workbench.ts`,
  `scripts/capture-visual-contact-sheet.ts`;
- app/compiler HTML: `src/app-adapters/concept-review-html.ts`,
  `src/compiler/html-asset.ts`;
- editor HTML/SVG: `src/editor/animation-diagnostics.ts`,
  `src/editor/animation-picker.ts`, `src/editor/animation-player-shell.ts`,
  `src/editor/api-catalog.ts`, `src/editor/diagram-svg-adapter.ts`,
  `src/editor/editor.ts`, `src/editor/equation-surface-adapter.ts`,
  `src/editor/exact-fraction-quantity-surface-adapter.ts`,
  `src/editor/graph-svg-viewport.ts`,
  `src/editor/hermeneutic-tutorial-inspector.ts`,
  `src/editor/semantic-animation-workbench-acceptance.ts`,
  `src/editor/semantic-animation-workbench-review.ts`, and
  `src/editor/semantic-animation-workbench-shell.ts`;
- project and rendering output: `src/project-dashboard/render.ts`,
  `src/rendering/graph-svg.ts`, `src/rendering/graph-webgl.ts`;
- tutorial output: `src/tutorial/ftc-surface.ts`,
  `src/tutorial/hermeneutic-learner-shell.ts`.

This inventory does not yet declare which helper is redundant. That decision
belongs to the context classification in `s06`; text-node, attribute, SVG,
and script-JSON encoders must not be collapsed into a universal sanitizer.

## Impact-Selected Checks

The current impact selector maps representative owner paths as follows:

| Owner surface | Selected boundary checks |
| --- | --- |
| capture HTML and canonical compositor | `npm run typecheck`, `npm test`, `npm run build` (currently unmatched, so broad safe gate) |
| linear provider | `npm run typecheck`, `npm run check:architecture` |
| operation migration ledger | `npm run typecheck`, `npm test`, `npm run build` (currently unmatched, so broad safe gate) |
| main host | `npm run typecheck`, `npm test`, `npm run build` (currently unmatched, so broad safe gate) |
| shared reader | `npm run typecheck`, `npm run check:architecture`, `npm run test:browser:reader-conformance`, `npm run build`, `npm run check:reader-production`, `npm run check:reader-budgets`, `npm run check:dev-review-production` |

Focused checks run inside their owning slices; these impact-selected checks
run at subsystem boundaries, and the complete release matrix runs in `s19`.

## Reproduction Commands

```sh
node --disable-warning=ExperimentalWarning --test tests/canonical-animation-construction-inventory.test.ts tests/canonical-equation-renderer-convergence.test.ts tests/linear-provider-boundary.test.ts tests/operation-presentation-migration-inventory.test.ts
npm run check:animation-library-bundle-boundary
npm run check:reader-budgets
```

Expected baseline result: all three commands exit non-zero for only the six
named failures above. A missing failure, new failure, threshold edit, hidden
closure, or overlap with unrelated user work invalidates this baseline.
