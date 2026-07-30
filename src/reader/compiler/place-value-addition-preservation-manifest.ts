/**
 * Pre-implementation authority and cost boundary for the first place-value
 * exemplar. These paths are recorded because this loop is meant to exercise
 * the canonical system, not quietly replace one of its expensive subsystems.
 */
export const kpPlaceValueAdditionPreservationManifest = Object.freeze({
  schemaVersion: "kp.place-value-addition-preservation.v1",
  stablePromotionId: "kp.promotion.place-value-addition",
  animationId: "animation.place-value-addition.278-plus-156",
  baselineCommit: "de441846",
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
      sha256: "a4d1673e5db14cfc9cdbd1becaac88e56e62d40051c4c802bdb292147a6b3cb7"
    }),
    Object.freeze({
      path: "src/rendering/native-katex-rendered-scene.ts",
      sha256: "0bfd6b8f2648a0c0e94850e0e4748ce33c98b9dcc015d0868cf6062aadc26df8"
    }),
    Object.freeze({
      path: "src/rendering/native-katex-scene-compositor.ts",
      sha256: "c19c9f8b2faccf76ed473cf3e63807a66b0c94471ea460dd46580102177f395f"
    }),
    Object.freeze({
      path: "src/reader/app/reader-canonical-equation-session.ts",
      sha256: "d4243fdb443ece21bd9a237dac1fb76dc43e147b1b6a44d677042a96618a7ecb"
    }),
    Object.freeze({
      path: "src/reader/renderers/equation-scene-compositor-adapter.ts",
      sha256: "da183e47c91b0cc18c91436a2ed8644951bce2a329a9934fd7ce2cb48206b0d7"
    }),
    Object.freeze({
      path: "src/reader/renderers/equation-render-plan.ts",
      sha256: "4fb0f0b64e10816b1895924b24154ab3a3dc590ddd9e30778588f819d1172898"
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
      sha256: "250b09057b3d9e7900c83ece6475295bcd2ef938e6e70e633b0015ccf1bd0517"
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
