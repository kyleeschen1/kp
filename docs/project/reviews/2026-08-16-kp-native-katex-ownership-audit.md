# Native KaTeX Ownership Audit

## Conclusion

KP has one promoted native-KaTeX compositor, but application callers still
reach its implementation files directly. The next boundary should not replace
the renderer. It should make the existing renderer a typed, lazy feature pack
whose implementation remains the sole owner of observation, reconciliation,
material paint, and native settlement.

This migration is safe only if it changes import and loading ownership while
leaving endpoint HTML, semantic IDs, timing, accessibility, and paint ownership
unchanged.

## Current Production Cost

The selected-experience report attributes these gzip costs:

| Emitted owner | Solve-x | Place value |
| --- | ---: | ---: |
| Native fragment observation | 2,164 | 2,164 |
| Native paint geometry | 1,476 | 1,476 |
| Native rendered-scene observation | — | 3,053 |
| Native scene compositor | — | 26,399 |
| KaTeX adapter | 238 | 238 |
| KaTeX texture atlas | 3,957 | 3,957 |
| Equation font readiness | shared elsewhere | 363 |

Place value currently reaches the full compositor in its selected closure.
The pack boundary must make this cost attributable and deferrable; it must not
duplicate the compositor into caller-specific chunks.

## Ownership Layers

### Semantic and runtime authority

Animation assets, transformations, lineage, presentation plans, direct seek,
and sampled endpoints remain framework-neutral. They must not import the pack
or any DOM renderer.

### Native endpoint authority

Callers continue to create native endpoint markup through the existing KaTeX
adapter. The source and target roots retain their KaTeX HTML and MathML. The
pack observes those roots after font readiness; it does not mint alternate
semantic endpoints.

### Native observation authority

`native-katex-rendered-scene.ts` and
`native-katex-fragment-observer.ts` own settled DOM observation, paint atoms,
presentation groups, viewport identity, and font revision. The two-layout-frame
settlement check remains mandatory.

### Composition and paint authority

`native-katex-scene-compositor.ts` remains the sole production owner of
reconciliation, protected transit, material tracks, exclusive native/material
paint handoff, and native-target settlement. Its supporting choreography and
geometry modules remain implementation details of the pack.

### Host authority

Surface and reader hosts own DOM placement, lifecycle, disposal, URL state,
and accessible prose. They may ask the pack to observe and compose, but may not
reach compositor implementation functions after migration.

## Consumer Classification

| Cohort | Current examples | Disposition |
| --- | --- | --- |
| Canonical application caller | `operation-evaluation-surface-adapter.ts` through the reader compositor adapter | Migrate first; it already has one measured renderer-session seam. |
| Specialized selected surfaces | exact-fraction and log-exponent surface adapters | Migrate after the exemplar without changing their surface contracts. |
| Reader runtime | canonical reader session and equation-scene compositor adapter | Consume an injected pack client; preserve reader render plans and measurement identity. |
| Place-value rendering | native-scene DOM, column evaluation/exchange, and shared DOM geometry | Defer to slices 12–13, where semantic startup and heavy selected rendering are separated. |
| Public/static publication | build-time KaTeX HTML and MathML | Do not migrate; these pages should not acquire a browser compositor. |
| Experiments and development microscopes | glyph-reconciliation experiments and `.dev.ts` inspection | Keep explicit development-only access or migrate after production callers; never make them production dependencies. |
| Renderer internals and type-only imports | compositor helpers, choreography, architecture inventories | Not callers. Keep internal imports and type erasure inside the feature-pack boundary. |

## Feature-Pack Contract

The contract should be split into a dependency-light type module and one
literal dynamic implementation import. The first version needs only the
capabilities already exercised by the canonical caller:

```ts
interface KpNativeKatexFeaturePack {
  readonly schemaVersion: "kp.native-katex-feature-pack.v1"
  readonly id: "feature-pack.native-katex.canonical"
  readonly observe: {
    settleAndObserve: typeof settleAndObserveKpNativeKatexRenderedScene
  }
  readonly compose: {
    createSession: typeof createKpCanonicalNativeKatexSceneSession
    projectRelations: typeof projectKpNativeKatexSemanticPaintRelations
  }
}
```

The declaration owns a literal `import()` of the implementation module. A
single memoized loader owns concurrent requests and retry semantics. Callers
receive the immutable client through their existing async preparation path;
render-loop sampling never awaits or imports.

Do not put KaTeX CSS, endpoint rendering, reader plans, surface registration,
or place-value policy into this pack. Those have different loading and
ownership lifecycles.

## Preservation Contract

The migration must preserve all of the following:

- identical source and target native KaTeX endpoints;
- identical MathML availability and host `aria-label` output;
- the same semantic entity and presentation-group IDs;
- font readiness before observation and the same settled geometry checks;
- one `native-katex-renderer-session` with the same disposition and tracks;
- exclusive source-native, material, and target-native paint ownership;
- direct seek, rewind, endpoint dwell, and sampled progress behavior;
- existing data attributes and disposal behavior; and
- one emitted compositor implementation, not one copy per selected surface.

## Promotion Order

1. Define and unit-test the immutable feature-pack contract, literal loader,
   memoization, and failure behavior.
2. Route the operation-evaluation reader compositor seam through an injected
   pack client and prove identical native endpoints, accessibility, session
   identity, and sampled ownership.
3. Migrate exact-fraction and log-exponent application callers where the same
   contract fits; keep development-only inspection separate.
4. Enforce that the empty catalogue, economics, programming, and Graph3D
   scenarios do not acquire the pack.
5. Use the proven seam when place-value rendering is deferred in slices 12–13.

This audit does not authorize a visual change or a universal rewrite of every
file containing the phrase `native-katex`. Promotion is limited to production
application-boundary callers of the existing canonical renderer.
