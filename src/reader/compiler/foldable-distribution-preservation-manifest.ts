/**
 * Observable acceptance boundary for the foldable distribution exemplar.
 * It freezes semantic and product requirements before implementation without
 * prescribing compositor geometry or creating a second animation runtime.
 */
export const kpFoldableDistributionPreservationManifest = Object.freeze({
  route: "/reader/foldable-distribution/",
  libraryEntryId: "animation.foldable-distribution.collect-like-terms",
  document: Object.freeze({
    id: "lesson.algebra.foldable-distribution",
    version: "1",
    title: "Distribute and collect like terms",
    searchableText:
      "Distribute each factor, gather like terms, and collect the result"
  }),
  expressionChain: Object.freeze([
    Object.freeze({
      id: "expression.foldable-distribution.factored",
      latex: "3(x + 2) + 2(x - 1)"
    }),
    Object.freeze({
      id: "expression.foldable-distribution.distributed",
      latex: "3x + 6 + 2x - 2"
    }),
    Object.freeze({
      id: "expression.foldable-distribution.grouped",
      latex: "(3x + 2x) + (6 - 2)"
    }),
    Object.freeze({
      id: "expression.foldable-distribution.coefficient-factored",
      latex: "(3 + 2)x + (6 - 2)"
    }),
    Object.freeze({
      id: "expression.foldable-distribution.collected",
      latex: "5x + 4"
    })
  ]),
  canonicalReferences: Object.freeze([
    Object.freeze({
      route: "/reader/distribution-area/",
      preserves: "visible-factor-fan-out"
    }),
    Object.freeze({
      route: "/reader/split-merge-fractions/",
      preserves: "opaque-structural-fission-fusion"
    }),
    Object.freeze({
      route: "/reader/radical-succession/",
      preserves: "paint-space-typography-and-endpoint-continuity"
    }),
    Object.freeze({
      route: "/reader/solve-x/",
      preserves: "native-settlement-responsive-seek-and-rewind"
    }),
    Object.freeze({
      route: "/canonical-animation-review.html",
      preserves: "single-lazy-host-and-persistent-review-capture"
    })
  ]),
  visualPhases: Object.freeze([
    Object.freeze({
      id: "phase.distribute",
      requiredMotif: "copy-fan-out",
      canonicalOperationIds: Object.freeze([
        "kp.core.persist",
        "kp.core.fan-out",
        "kp.core.reorder"
      ]),
      observable:
        "Each factor visibly branches into lineage-bearing descendant products.",
      opacityPolicy: "opaque-lineage"
    }),
    Object.freeze({
      id: "phase.evaluate-products",
      requiredMotif: "successor-synthesis",
      canonicalOperationIds: Object.freeze([
        "kp.core.persist",
        "kp.core.merge"
      ]),
      observable:
        "Every product result visibly inherits its complete contributing lineage.",
      opacityPolicy: "opaque-lineage"
    }),
    Object.freeze({
      id: "phase.gather-like-terms",
      requiredMotif: "semantic-reorder-and-group",
      canonicalOperationIds: Object.freeze([
        "kp.core.reorder",
        "kp.core.group"
      ]),
      observable:
        "Signed terms reflow into stable coefficient and constant groups without changing identity.",
      opacityPolicy: "opaque-lineage"
    }),
    Object.freeze({
      id: "phase.factor-common-x",
      requiredMotif: "merge-fan-in",
      canonicalOperationIds: Object.freeze([
        "kp.core.persist",
        "kp.core.merge",
        "kp.core.group"
      ]),
      observable:
        "The repeated x factors visibly coalesce before either coefficient is evaluated.",
      opacityPolicy: "opaque-lineage"
    }),
    Object.freeze({
      id: "phase.collect-results",
      requiredMotif: "merge-fan-in",
      canonicalOperationIds: Object.freeze(["kp.core.merge"]),
      observable:
        "Exact coefficient and constant contributors visibly coalesce into their results.",
      opacityPolicy: "opaque-lineage"
    })
  ]),
  paintContract: Object.freeze({
    nativeEndpointAuthority: "native-katex",
    canonicalPaintPolicy: "exclusive-when-active",
    compatibilityPaintPolicy: "empty-when-canonical-active",
    structuralFissionFusionOpacity: "opaque-throughout",
    forbiddenPolicies: Object.freeze([
      "whole-equation-fade-replacement",
      "source-out-target-in-crossfade",
      "fading-structural-fission-fusion",
      "simultaneous-legacy-and-canonical-paint",
      "non-native-endpoint-settlement"
    ])
  }),
  foldContract: Object.freeze({
    modes: Object.freeze(["expanded", "collapsed", "automatic", "pinned"]),
    preservedTruth: Object.freeze([
      "expression-chain",
      "operation-dependencies",
      "semantic-checkpoints",
      "accessible-explanation",
      "static-step-export"
    ]),
    urlState: Object.freeze([
      "node",
      "folds",
      "pins",
      "direction",
      "checkpoint"
    ])
  }),
  presentation: Object.freeze({
    layoutAuthority: "reader-semantic-group-envelopes",
    phonePolicy: "deterministic-staging-or-folding",
    fullMotionSamplesPermille: Object.freeze([
      0, 125, 250, 375, 500, 625, 750, 875, 1_000
    ]),
    reducedMotionEndpointsPermille: Object.freeze([0, 1_000]),
    reviewViewports: Object.freeze([
      Object.freeze({ width: 1_100, height: 800, deviceScaleFactor: 1 }),
      Object.freeze({ width: 390, height: 844, deviceScaleFactor: 1 }),
      Object.freeze({ width: 1_100, height: 800, deviceScaleFactor: 2 }),
      Object.freeze({ width: 390, height: 844, deviceScaleFactor: 2 })
    ]),
    forbiddenDiscontinuities: Object.freeze([
      "overlap",
      "clipping",
      "font-swap",
      "baseline-jerk",
      "endpoint-jump",
      "unexplained-line-change"
    ])
  }),
  accessibility: Object.freeze({
    nativeMathml: true,
    searchableWithoutJavaScript: true,
    semanticDomOwner: "reader",
    movingPaintAriaHidden: true,
    movingPaintInert: true,
    collapsedWorkDisclosed: true
  }),
  preservationBoundary: Object.freeze({
    runtimeClockCount: 1,
    canonicalRendererSessionCount: 1,
    structuralWebglLeaseLimit: 1,
    compositorCoreFrozen: true,
    lifecycleVocabularyFrozen: true,
    schedulerVocabularyFrozen: true,
    operationSpecificGeometryAllowed: false,
    existingCanonicalReadersMustRemainUnchanged: true
  }),
  rollbackUnits: Object.freeze({
    foldArchitectureSlices: "s10-s14",
    readerIntegrationSlices: "s15-s21"
  })
} as const);
