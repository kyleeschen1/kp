/**
 * Pre-implementation authority and cost boundary for the first place-value
 * exemplar. These paths are recorded because this loop is meant to exercise
 * the canonical system, not quietly replace one of its expensive subsystems.
 */
export const kpPlaceValueAdditionPreservationManifest = Object.freeze({
  schemaVersion: "kp.place-value-addition-preservation.v1",
  stablePromotionId: "kp.promotion.place-value-addition",
  animationId: "animation.place-value-addition.278-plus-156",
  baselineCommit: "5f688d34",
  canonicalExpression: "278 + 156 = 434",
  primaryProjection: Object.freeze({
    kind: "stacked-written-algorithm",
    addends: Object.freeze([278, 156]),
    operator: "+",
    operatorPlacement: "left-of-second-addend",
    underlinePlacement: "beneath-second-addend",
    alignment: "right-aligned-place-columns",
    traversal: "ones-to-tens-to-hundreds",
    carryPlacement: "above-next-column"
  }),
  secondaryProjection: Object.freeze({
    kind: "base-ten-blocks",
    authority: "projection-only",
    widePlacement: "beside-primary-when-readable",
    phonePlacement: "separately-selectable",
    mayReplacePrimary: false
  }),
  existingAuthorities: Object.freeze([
    Object.freeze({
      concern: "operation-evaluation-program",
      path: "src/animation/operation-evaluation-presentation-registry.ts",
      disposition: "reuse-or-bounded-caller-extension"
    }),
    Object.freeze({
      concern: "identity-fission-program",
      path: "src/animation/motifs/identity-fission-executable-program.ts",
      disposition: "reuse-unchanged"
    }),
    Object.freeze({
      concern: "identity-fusion-program",
      path: "src/animation/motifs/identity-fusion-executable-program.ts",
      disposition: "reuse-unchanged"
    }),
    Object.freeze({
      concern: "motif-continuity-compiler",
      path: "src/animation/motifs/executable-motif-continuity-compiler.ts",
      disposition: "reuse-unchanged"
    }),
    Object.freeze({
      concern: "foldable-evaluation-tree",
      path: "src/semantic/foldable-distribution-evaluation-tree.ts",
      disposition: "reuse-pattern-with-new-domain-trace"
    }),
    Object.freeze({
      concern: "fold-projection",
      path: "src/semantic/foldable-distribution-fold-projection.ts",
      disposition: "reuse-pattern-with-new-domain-trace"
    }),
    Object.freeze({
      concern: "semantic-stage-layout",
      path: "src/reader/runtime/foldable-distribution-layout.ts",
      disposition: "reuse-policy-with-new-column-groups"
    }),
    Object.freeze({
      concern: "canonical-session",
      path: "src/reader/app/reader-canonical-equation-session.ts",
      disposition: "reuse-unchanged"
    }),
    Object.freeze({
      concern: "native-scene-compositor",
      path: "src/rendering/native-katex-scene-compositor.ts",
      disposition: "reuse-unchanged"
    }),
    Object.freeze({
      concern: "exact-quantity-session-reference",
      path: "src/rendering/exact-fraction-quantity-runtime.ts",
      disposition: "reuse-session-pattern"
    }),
    Object.freeze({
      concern: "animation-library",
      path: "src/editor/animation-library-display-catalog.ts",
      disposition: "add-one-lazy-entry-at-checkpoint"
    }),
    Object.freeze({
      concern: "review-capture",
      path: "src/editor/editor-animation-library-review-capture-loader.ts",
      disposition: "reuse-unchanged"
    }),
    Object.freeze({
      concern: "promotion-authority",
      path: "src/animation/artifact-promotion.ts",
      disposition: "derive-one-new-entry-at-release"
    })
  ]),
  protectedCoreDigests: Object.freeze([
    Object.freeze({
      path: "src/rendering/native-katex-glyph-compositor.ts",
      sha256: "79024061c96c1e6a7bcb16ba2b40b56caa9da18f7ffe103fbc2155634a3bb38d"
    }),
    Object.freeze({
      path: "src/rendering/native-katex-rendered-scene.ts",
      sha256: "05f4a3e9f9129b493051240df9fda8afdca828201afe73741fa1cf9215a9a1dc"
    }),
    Object.freeze({
      path: "src/rendering/native-katex-scene-compositor.ts",
      sha256: "3e9cfee07a97f5434ab7d489d20d266103eb1f5962c39f014b386100eb20181e"
    }),
    Object.freeze({
      path: "src/reader/app/reader-canonical-equation-session.ts",
      sha256: "b0e98954a0883356cab3f046c1760c918572b6f5ca3107a1b4cf3360ffe9ee23"
    }),
    Object.freeze({
      path: "src/reader/renderers/equation-scene-compositor-adapter.ts",
      sha256: "38d5c38d3f91efd15e8b7ff2f729a66938624690cec27fef96843b4ef0e30649"
    }),
    Object.freeze({
      path: "src/reader/renderers/equation-render-plan.ts",
      sha256: "065f9247d906afcfcf99daaa8f6968e64e236c1d17b008529572cc29a6034a1f"
    }),
    Object.freeze({
      path: "src/reader/renderers/equation-material-plan.ts",
      sha256: "67bddf955e0b6e571231e9e1aa2cf6088726bfd0a06a1647b6258cc8de88bc97"
    }),
    Object.freeze({
      path: "src/rendering/equation-motion-plan.ts",
      sha256: "fc234313d69ec81c5cd3f1617462147def84347c400cb8294a71d623906f701f"
    }),
    Object.freeze({
      path: "src/animation/choreography-lifecycle.ts",
      sha256: "182da6b3cc3d56efc6c32dc050d2400d5dd306b4578c436937d0d7191d5d8af2"
    }),
    Object.freeze({
      path: "src/rendering/webgl-context-lease-pool.ts",
      sha256: "07639373e57b526c1f226f5683cecaec00a91bbb721e01db7cda42d096df3885"
    })
  ]),
  costBoundary: Object.freeze({
    canonicalRuntimeCount: 1,
    canonicalClockCount: 1,
    maximumNewRendererCategories: 0,
    maximumNewCompositorCategories: 0,
    maximumNewLifecycleCategories: 0,
    maximumNewSchedulerCategories: 0,
    maximumNewDisplayPages: 0,
    maximumNewWebglLeases: 0,
    operationSpecificGeometryAllowed: false,
    viewportSpecificMotionAllowed: false,
    genericFadeFallbackAllowed: false
  }),
  preservationBoundary: Object.freeze({
    existingPromotedReadersMustRemainUnchanged: true,
    nativeEndpointAuthority: "native-katex",
    semanticLayoutOwnsGroupsAndColumns: true,
    localCompositorOwnsMeasuredPaintRouting: true,
    reviewCaptureOwner: "existing-animation-library",
    staticAndAccessibleTruthMustMatch: true
  }),
  rollbackBoundary: Object.freeze({
    removeDescriptorAndLazyCatalogEntryTogether: true,
    removeDomainCompilerProjectionAndTestsTogether: true,
    retainGenericExchangeOnlyWithIndependentUse: true
  })
} as const);
