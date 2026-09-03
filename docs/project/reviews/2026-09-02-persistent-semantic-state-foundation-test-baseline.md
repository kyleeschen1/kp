# Persistent Semantic State Foundation Test Baseline

Date: 2026-09-02
Status: BASELINE CAPTURED
Run contract: `run-contract.kp.persistent-semantic-state-foundation-v1`
Slice: `s01` (`broad-failure-baseline`)
Starting commit: `6ec09f727`

## Outcome

The complete repository gate has 49 client-side failures: 16 catalogue and
asset expectations, 14 generated-order or direction expectations, and 19
renderer-source or architecture expectations. Every failure is assigned to
one of the three already approved repair slices. None requires changing
semantic truth, visible behavior, a public API, or the persistent-state
contract, and none is being deferred.

The baseline therefore does not fire the slice stop condition. Slices `s02`
through `s04` must still prove each replacement value from its current
canonical declaration. This document is a routing ledger, not permission to
raise a ceiling or copy a generated count merely to make a test pass.

## Command Evidence

- `npm test` reached the Node test summary with 6,080 tests: 6,031 passed and
  49 failed in 525,803.218792 ms. Its prerequisite architecture, inference,
  concept-catalogue, and promotion-memory checks passed before the test run.
- `npm run check:architecture` passed independently: 1,978 TypeScript modules,
  7,308 of 7,359 local references, zero direction exceptions, and all eight
  cross-domain gateway tests passing.
- `npm run check:inference` passed independently with 98,881 types, 164,998
  instantiations, and a 5.64 s check.
- `npm run typecheck` passed, including Svelte with zero errors and zero
  warnings and the domain TypeScript project.
- `theseus workspace validate` passed with 1,084 nodes and 26,396 events.

Direct sandboxed `node --test` diagnostics add 13 unrelated server failures
because the managed sandbox rejects `listen(127.0.0.1)` with `EPERM`. Those
environment failures are not included in the 49-item repository ledger. The
approved `npm test` command remains the broad gate.

## s02: Catalogue And Asset Ledgers (16)

These failures compare derived catalogue membership, hostability, search,
descriptors, or dashboard rows with older closed-world snapshots. The
canonical owner is the current concrete asset/loadable registry and its
generated projections; the repair must preserve one concrete identity per
asset and must not add reachability.

1. `animation-catalogue-health.test.ts` — `current unobserved catalogue health is honest about review and breakage`
2. `animation-catalogue-identity-boundary.test.ts` — `catalogue membership is exactly concrete while planned identity is retained`
3. `animation-catalogue-loadable-registry.test.ts` — `loadable registry has one compact entry per concrete animation asset`
4. `animation-catalogue-projection.test.ts` — `asset-first projection keeps one lightweight entry with subordinate contexts`
5. `animation-catalogue-related-context-inventory.test.ts` — `concrete assets keep related contexts subordinate to one loadable id`
6. `animation-catalogue-row-identity.test.ts` — `catalogue rows equal concrete registry and resolved asset identities`
7. `animation-catalogue-row-identity.test.ts` — `descriptors and contexts remain subordinate to their concrete row`
8. `animation-catalogue-seam-atlas.test.ts` — `seam atlas enumerates every concrete asset without assigning review`
9. `animation-catalogue-search.test.ts` — `blank catalogue search keeps one row per asset with selection first`
10. `animation-catalogue-search.test.ts` — `catalogue search supports direct, tokenized, and fuzzy cross-domain terms`
11. `even-root-catalogue-integration.test.ts` — `selection loads the specialized root surface with generic static fallback`
12. `kp-editor-animation-picker.test.ts` — `editor animation picker groups the concrete catalog by supported surface`
13. `kp-editor-animation-selection-route.test.ts` — `editor renders every concrete asset through a stable descriptor selection`
14. `kp-editor-animation-surface-dispatch.test.ts` — `editor animation surface dispatch covers every current concrete asset`
15. `kp-editor-calculus-equation-visible-animations.test.ts` — `generated calculus equations expose exact derivative and integral transitions`
16. `project-dashboard-animation-asset-catalog.test.ts` — `generated algebra dashboard catalog exposes animation asset rows`

## s03: Generated Order And Direction Ledgers (14)

These failures hold older asset lists, caller discovery, declaration order,
capability maturity, or active-direction snapshots. Canonical declarations
already contain the added entries. Repairs must remain deterministic under
clean-process import order and must not turn registration side effects into
authority.

1. `algebra-capability-import-order.test.ts` — `every compiler-first and pack-first clean-process order has the same result`
2. `animation-governance-baseline.test.ts` — `epoch v2 preserves existing inference and runtime targets`
3. `animation-transformation-coverage-view.test.ts` — `coverage view is one ordered evidence-derived list`
4. `balanced-operation-caller-inventory.test.ts` — `literal discovery cannot add an orphan balanced-operation caller`
5. `current-direction-authoring-ratchet.test.ts` — `current project direction holds the bounded Focus Deck checkpoint`
6. `equation-llm-authoring-catalogue.test.ts` — `recipe catalogue groups callers and owners from canonical declarations`
7. `equation-presentation-catalog-conformance.test.ts` — `catalog separates executable routes from generic presentation labels`
8. `equation-structural-family-declarations.test.ts` — `wave B has one immutable structural recipe declaration per asset`
9. `exact-equation-reachability-graph.test.ts` — `generated reachability graph owns the exact declared root set`
10. `finite-binder-case-ledger.test.ts` — `registry remains unique after adding the finite binder family`
11. `homomorphic-crossover-authoring.test.ts` — `the LLM catalogue exposes one shared recipe through exact caller authority`
12. `kp-algebra-choreography-capabilities.test.ts` — `the algebra pack carries immutable runtime capabilities beside serializable assets`
13. `kp-calculus-rule-promotion.test.ts` — `calculus rule cohort passes semantic motion promotion`
14. `symbolic-mathematics-capability-taxonomy.test.ts` — `new curriculum capability rows remain evidence-derived missing gaps`

The direction ratchet is specifically stale: the roadmap now names
`threads/typed-semantic-authoring-framework.md` as active and retains Focus
Deck as a supporting human checkpoint. The test must follow that accepted
direction rather than restore Focus Deck as the active lane.

## s04: Renderer, Source, And Architecture Ledgers (19)

These failures are source-call inventories, bounded source closures, ownership
snapshots, compatibility counts, lexical audits, or renderer test fixtures.
The architecture and dependency-direction commands pass, so the repairs must
update the audits without changing production behavior.

1. `animation-api-caller-ledger.test.ts` — `governed construction has one explicit public authoring seam`
2. `canonical-equation-renderer-convergence.test.ts` — `canonical scene core stays within source and vocabulary ceilings`
3. `canonical-equation-renderer-convergence.test.ts` — `canonical scene source audit seals its direct local dependency closure`
4. `canonical-equation-renderer-convergence.test.ts` — `planner renderer support and aggregate source remain separately measured`
5. `canonical-equation-renderer-convergence.test.ts` — `reader keeps no compositor query switch and one adapter loader`
6. `cross-language-code-animation-conformance.test.ts` — `the approved callers share optical theme tokens without sharing language syntax`
7. `equation-surface-cost-model.test.ts` — `equation cost plan covers one representative per preservation family`
8. `equation-surface-cost-model.test.ts` — `compatibility counts preserve the measured surface authority split`
9. `equation-surface-disposition-ledger.test.ts` — `disposition ledger classifies every equation row exactly once`
10. `equation-wave-c-disposition-declarations.test.ts` — `wave C classifies every current remainder exactly once`
11. `html-output-encoding-inventory.test.ts` — `every local generic HTML helper has one classified sink owner`
12. `kp-application-entry-ownership.test.ts` — `the shared main build does not compile or own Public Web routes`
13. `kp-editor-graph-svg-viewport.test.ts` — `generic retained SVG lifecycle has no domain renderer dependency`
14. `native-katex-compositor-conformance-typography.test.ts` — `carries authoritative expected paint into target-style normalization`
15. `operation-presentation-migration-inventory.test.ts` — `operation presentation migration inventory has unique executable evidence`
16. `post-convergence-infrastructure-inventory.test.ts` — `post-convergence counts are projections of canonical declarations`
17. `semantic-reader-equation-scene-compositor-adapter.test.ts` — `explicit static plans clamp the canonical session to native checkpoints`
18. `semantic-reader-equation-scene-compositor-adapter.test.ts` — `the same reader session adapter accepts both fraction fission and fusion plans`
19. `semantic-reader-equation-scene-compositor-adapter.test.ts` — `reader sessions expose the exact executed program and phase telemetry`

Two source ceilings need explicit review in `s04`: canonical scene core is
142,414 bytes against a 140,000-byte baseline, and renderer support is 69,595
bytes against 65,000. The added `native-katex-endpoint-ownership.ts` closure is
intentional current authority, but a new bounded ceiling must be justified by
that ownership extraction rather than inferred from the observed byte count.

The four apparent compositor failures are stale expectations or fixtures:

- Typography sampling now correctly follows the supplied authoritative paint
  rectangle, producing `translate(-20, 0)` instead of the obsolete wrapper-box
  expectation `translate(-25, -14)`.
- The three reader tests supply an `HTMLElement` double without `closest()`;
  the production owner is a real element and the accepted dual-revision visual
  cache uses the standard method. The test double needs the missing DOM method;
  production behavior does not need a compatibility branch.

## Guardrails For The Repair Slices

- Derive counts and ordered IDs from current canonical declarations before
  editing expectations.
- Preserve exact planned/concrete, maturity, ownership, and route distinctions.
- Keep import-order results identical; do not add a global registry or rely on
  module evaluation order.
- Do not remove architecture assertions. Replace obsolete lexical or source
  snapshots with assertions over the current ownership boundary where useful.
- Do not change renderer, stage, KaTeX, graph, route, or animation behavior.
- Re-run the focused owning tests after each slice and the complete gate at
  `s05`.
