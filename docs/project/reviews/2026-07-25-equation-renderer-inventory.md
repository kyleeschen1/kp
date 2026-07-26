# Equation renderer inventory and retirement ledger

Date: 2026-07-25
Status: reconciled retirement ledger for
`run-contract.kp.canonical-equation-renderer-convergence-v1`

## Purpose

This inventory distinguishes equation-renderer implementations from the
semantic, runtime, host, and non-equation surfaces they consume. It is the
migration and retirement baseline for the canonical-renderer convergence loop.
An entry may move from retained to removed only after its listed consumer and
capabilities are covered by verified replacement evidence.

## Canonical boundaries

The durable animation authority is not one of the DOM implementations below.
It remains the semantic animation, operation trace, lineage, correspondence,
renderer-neutral frames, and shared clock. Native KaTeX owns settled
typography, MathML, focus, annotations, Cloze, and interaction. Moving paint is
ephemeral and inert.

Graph, SVG, DiagramScene, code, table, balance, static, and export renderers are
different output surfaces. They are explicitly outside the duplicate
equation-renderer ledger.

## Active paths and final dispositions

| Path | Current consumer and activation | Capabilities it owns today | Final disposition |
| --- | --- | --- | --- |
| `src/reader/renderers/equation-material-layer.ts` plus the material planning and sampling called by `src/reader/app/exemplar-entry.ts` | Non-migrated reader transitions and lesson variants | Operation-aware reader paint, focus styling, responsive fit, native endpoint opacity, witnesses, direct seek, rewind, reduced motion | **Compatibility-only.** Preserve until each consuming transition is separately migrated and approved. The migrated gold transition bypasses frame construction and clears this layer, so it never shares paint authority with the canonical session. |
| `src/reader/app/reader-canonical-equation-session.ts` and `src/reader/renderers/equation-scene-compositor-adapter.ts` | Default solve-x streamlined gold transition; dynamically loaded only for the eligible lesson variant | Adapts canonical reader render/material plans into an ephemeral native-KaTeX renderer session; observes native endpoints and delegates total-scene ownership | **Canonical reader path.** The query selector and peer route are gone. This is the only paint implementation for the migrated transition. Expand only through separately approved exemplar migrations. |
| `src/rendering/native-katex-rendered-scene.ts`, `src/rendering/native-katex-fragment-observer.ts`, `src/rendering/native-katex-scene-compositor.ts`, and `src/rendering/native-katex-glyph-compositor.ts` | Canonical reader session, isolated review route, and focused browser/performance checks | Native paint observation, semantic-lineage reconciliation, five paint kinds, six lifecycles, scene tracks, exclusive ownership, exact native settlement | **Canonical equation-renderer core.** Both human checkpoints and the generic cross-family proof passed. It is the promoted implementation for structurally changing native-KaTeX equations, without authorizing a global family rollout. |
| `src/editor/equation-surface-adapter.ts` and its `equation-motion-*`, material-owner, motif, artifact, and radical helpers | Registered by `src/main.ts`, dynamically used by the linear-equation story adapter, and used by the editor animation catalog | Broad editor equation preview coverage, measured motion, annotations, artifacts, matrices, calculus forms, and synchronized graph panels | **Active host requiring later convergence, not deletion in this loop.** Preserve its accepted catalog and behavior. The current loop may prove a shared renderer contract but cannot migrate the editor before the reader checkpoint and a separately approved scope. |
| `src/editor/equation-motion-demo-controller.ts` | Registered by `src/main.ts` for the older editor motion-demo surface | Interactive formula demo controls and the older annotated-token motion presentation | **Active reference/product surface.** Preserve during this loop. Audit for consolidation only after the canonical reader decision; do not delete based on apparent age. |

## Reference-only and archive candidates

| Path | Import evidence | Retained capability | Baseline disposition |
| --- | --- | --- | --- |
| `src/rendering/katex-transition-controller.ts`, `src/rendering/katex-token-matcher.ts`, and `src/rendering/katex-token-snapshot.ts` | No product source imports the controller. It is named by headless boundary metadata and exercised by focused tests. | Historical DOM-token snapshot, visual-equality matching, canvas overlay, and fallback reference behavior | **Reference-only.** Keep through convergence for regression evidence. It is not a candidate canonical matcher because identity is not semantic-lineage constrained. |
| `src/rendering/katex-webgl-transition.ts` and its texture/artifact helpers | Dynamically imported only by the reference controller; direct consumers are tests and artifact helpers. `src/rendering/radical-webgl-morph.ts` remains actively imported by the editor equation surface. | GPU texture transition and radical artifact experimentation | **Retained archive/reference split.** The transition remains tested reference evidence; radical helpers remain active product capability. No deletion is safe until a later exact audit can separate them without losing editor coverage. |
| `src/experiments/glyph-reconciliation-*` | Isolated glyph-reconciliation review entrypoint and stable visual harness | Four-case compositor evidence, dense endpoint capture, inverse split, radical, and compound examples | **Review evidence.** Keep through both renderer decisions. It does not authorize product routing or become an authoring API. |

## Shared infrastructure that is not a duplicate renderer

- `src/reader/renderers/equation-render-plan.ts` and
  `equation-material-plan.ts` project canonical semantic authority; the
  convergence loop may simplify their renderer-facing use but must not move
  DOM or computed style into them.
- `src/rendering/equation-material-layer-dom.ts` is a low-level inert-layer
  synchronizer used by the current compositor and editor surface. It is shared
  mechanics, not an independently routed product renderer.
- `src/rendering/equation-font-readiness.ts`,
  `equation-native-endpoint-law.ts`, computed-style cloning, and native fit are
  cross-path safety utilities.
- Reader compiler output, static MathML/KaTeX, headless projections, iframe and
  static-step exports remain native settled outputs and cannot be replaced by
  moving clones.

## Capability comparison at the migration boundary

| Capability | Compatibility material path | Canonical equation session | Reconciled outcome |
| --- | ---: | ---: | --- |
| Native settled typography and MathML | Yes | Yes | Preserve exactly |
| Canonical semantic lineage | Indirect through material owners | Yes | One direct session input |
| Merge and split multiplicity | Operation-aware sampling | Generic scene relations | Generic scene relation only |
| Glyph, rule, path, introduction, elimination, settlement | Split across motifs/helpers | Five paint kinds and six lifecycles | One internal vocabulary |
| Focus, annotations, Cloze, hover, accessibility | Native reader authority | Native reader authority | Native-only authority |
| Direct seek, rewind, reduced motion | Yes | Yes | Preserve |
| Static/headless/export closure | Yes | Preserved by staying ephemeral | Preserve |
| Responsive reader projection | Yes | Bounded exemplar evidence | Preserve without viewport dispatch |
| Default product routing | Non-migrated transitions only | Approved gold transition | Exactly one paint path per transition |

No supposed duplicate owns an unrecorded capability that invalidates the
approved convergence plan. The active editor surfaces do own broader catalog
coverage, so they are explicitly preserved rather than treated as deletable
reader duplicates.

## Retirement rules

1. Retire compatibility paint per transition, in the same rollback unit as its
   approved canonical migration; do not delete shared support while another
   transition consumes it.
2. Keep exactly one paint owner per transition. A migrated transition must
   bypass compatibility-frame construction and clear compatibility paint.
3. Do not migrate another card, equation family, or editor surface without its
   own approved exemplar checkpoint.
4. Do not delete reference WebGL or token-transition code merely because it has
   no current route import; first prove that editor artifacts, tests, exports,
   and architecture metadata no longer require it.
5. Preserve semantic assets, authoring guidance, visual baselines, and tests
   even when their superseded runtime implementation is retired.

## Slice-27 reconciliation conclusion

The temporary architecture fork is closed. The query-selected peer is gone,
the approved gold transition has one canonical paint owner, and the remaining
material layer is explicitly a compatibility path for different, non-migrated
transitions. The editor still has active equation surfaces with broader catalog
capabilities and remains a later host-convergence target, not a duplicate to
delete.

No additional runtime deletion is safe in this slice: every retained path is
either an active consumer, a compatibility implementation with known
consumers, or tested reference evidence with a named revisit condition. There
are no unclassified equation-renderer paths and no query-selected renderer
switches.
