/**
 * Reviewed observable boundary for the first exact-quantity exemplar.
 *
 * The semantic atoms deliberately precede circles, bars, and number-line
 * geometry. That makes "the same selected half" a checkable identity shared by
 * every view instead of a visual coincidence reconstructed by each renderer.
 */
export const kpExactFractionQuantityPreservationManifest = Object.freeze({
  schemaVersion: "kp.exact-fraction-quantity-preservation.v1",
  animationId: "animation.exact-fraction-quantity.third-plus-sixth",
  stablePromotionId: "kp.promotion.exact-fraction-quantity",
  canonicalExpression: "1/3 + 1/6 = 1/2",
  exactUnit: Object.freeze({
    id: "unit.exact-fraction-quantity.one-whole",
    label: "one whole",
    convention: "same-unit-addends",
    canonicalPartitionDenominator: 6
  }),
  atomicPartIds: Object.freeze([
    "part.unit-sixth.0",
    "part.unit-sixth.1",
    "part.unit-sixth.2",
    "part.unit-sixth.3",
    "part.unit-sixth.4",
    "part.unit-sixth.5"
  ]),
  selections: Object.freeze({
    oneThird: Object.freeze({
      id: "selection.addend.one-third",
      atomicPartIds: Object.freeze([
        "part.unit-sixth.0",
        "part.unit-sixth.1"
      ])
    }),
    oneSixth: Object.freeze({
      id: "selection.addend.one-sixth",
      atomicPartIds: Object.freeze(["part.unit-sixth.2"])
    }),
    resultHalf: Object.freeze({
      id: "selection.result.one-half",
      atomicPartIds: Object.freeze([
        "part.unit-sixth.0",
        "part.unit-sixth.1",
        "part.unit-sixth.2"
      ])
    })
  }),
  checkpoints: Object.freeze([
    Object.freeze({
      id: "checkpoint.exact-fraction.establish",
      beatId: "beat.exact-fraction.establish-same-unit",
      label: "Establish thirds and sixths of one unit",
      progressPermille: 0
    }),
    Object.freeze({
      id: "checkpoint.exact-fraction.refined",
      beatId: "beat.exact-fraction.refine-third",
      label: "Refine one third into two sixths",
      progressPermille: 240
    }),
    Object.freeze({
      id: "checkpoint.exact-fraction.aligned",
      beatId: "beat.exact-fraction.align-sixths",
      label: "Align two sixths and one sixth",
      progressPermille: 440
    }),
    Object.freeze({
      id: "checkpoint.exact-fraction.merged",
      beatId: "beat.exact-fraction.merge-three-sixths",
      label: "Merge the three selected sixths",
      progressPermille: 720
    }),
    Object.freeze({
      id: "checkpoint.exact-fraction.recognized",
      beatId: "beat.exact-fraction.recognize-half",
      label: "Recognize the same selected half",
      progressPermille: 1_000
    })
  ]),
  pacing: Object.freeze([
    Object.freeze({
      beatId: "beat.exact-fraction.establish-same-unit",
      startPermille: 0,
      endPermille: 180
    }),
    Object.freeze({
      beatId: "beat.exact-fraction.refine-third",
      startPermille: 180,
      endPermille: 400
    }),
    Object.freeze({
      beatId: "beat.exact-fraction.align-sixths",
      startPermille: 400,
      endPermille: 560
    }),
    Object.freeze({
      beatId: "beat.exact-fraction.merge-three-sixths",
      startPermille: 560,
      endPermille: 820
    }),
    Object.freeze({
      beatId: "beat.exact-fraction.recognize-half",
      startPermille: 820,
      endPermille: 1_000
    })
  ]),
  viewObligations: Object.freeze([
    "symbolic",
    "partitioned-circle",
    "fraction-bar",
    "number-line"
  ]),
  foldContract: Object.freeze({
    modes: Object.freeze(["expanded", "collapsed", "automatic", "pinned"]),
    preservedTruth: Object.freeze([
      "exact-values",
      "same-unit-identity",
      "selected-part-provenance",
      "contributor-lineage",
      "checkpoint-order",
      "accessible-explanation",
      "static-export"
    ])
  }),
  identityContract: Object.freeze({
    persistentPartOpacity: "opaque-throughout",
    fissionOpacity: "opaque-throughout",
    fusionOpacity: "opaque-throughout",
    contributorMerge: Object.freeze({
      sourceSelectionIds: Object.freeze([
        "selection.addend.one-third",
        "selection.addend.one-sixth"
      ]),
      targetSelectionId: "selection.result.one-half"
    }),
    forbiddenChoreography: Object.freeze([
      "whole-view-fade-replacement",
      "source-out-target-in-crossfade",
      "persistent-part-eliminate-and-create",
      "fission-opacity-handoff",
      "fusion-opacity-handoff"
    ])
  }),
  authorityContract: Object.freeze({
    mathematics: "verified-exact-quantity-trace",
    settledSymbolicTypography: "native-katex",
    playbackClockCount: 1,
    canonicalRendererSessionCount: 1,
    forbiddenAuthorities: Object.freeze([
      "renderer-owned-arithmetic",
      "geometry-derived-identity",
      "dom-order-derived-lineage",
      "glyph-text-semantic-matching",
      "color-derived-correspondence"
    ])
  }),
  presentation: Object.freeze({
    widePolicy: "four-view-readable-grid",
    phonePolicy: "deterministic-active-view-focus",
    minimumMathFontPx: 18,
    fullMotionSamplesPermille: Object.freeze([
      0, 90, 180, 240, 400, 440, 560, 720, 820, 910, 1_000
    ]),
    reducedMotionEndpointsPermille: Object.freeze([0, 1_000]),
    reviewViewports: Object.freeze([
      Object.freeze({ width: 1_100, height: 800, deviceScaleFactor: 1 }),
      Object.freeze({ width: 390, height: 844, deviceScaleFactor: 1 }),
      Object.freeze({ width: 1_100, height: 800, deviceScaleFactor: 2 }),
      Object.freeze({ width: 390, height: 844, deviceScaleFactor: 2 })
    ])
  }),
  preservationBoundary: Object.freeze({
    addendUnitIdsMustMatch: true,
    exactValuesMustNormalize: true,
    selectedPartProvenanceMustClose: true,
    requiredViewCount: 4,
    compositorCoreFrozen: true,
    lifecycleVocabularyFrozen: true,
    schedulerVocabularyFrozen: true,
    displayPageCountMayIncrease: false,
    webglLeaseCountMayIncrease: false,
    operationSpecificGeometryAllowed: false,
    existingCanonicalReadersMustRemainUnchanged: true
  }),
  rollbackBoundary: Object.freeze({
    descriptorAndLazyCatalogEntryTogether: true,
    exemplarProjectionFilesTogether: true,
    sharedContractsRetainedOnlyWithIndependentUse: true
  })
} as const);
