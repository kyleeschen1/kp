export const kpFractionCompositionPreservationManifest = Object.freeze({
  route: "/reader/fraction-composition/",
  libraryEntryId: "animation.fraction-composition.two-thirds-solve",
  macroId: "macro.fraction.two-thirds-x-plus-six-equals-ten",
  document: Object.freeze({
    id: "lesson.algebra.fraction-composition",
    version: "1",
    title: "Distribute and solve with a fraction",
    searchableText:
      "Distribute two thirds, normalize the numerators, and solve the equation"
  }),
  exactSolution: Object.freeze({ numerator: "9", denominator: "1" }),
  stateIds: Object.freeze([
    "fraction-solve.state.factored",
    "fraction-solve.state.distributed",
    "fraction-solve.state.normalized",
    "fraction-solve.state.constant-product",
    "fraction-solve.state.constant-quotient",
    "fraction-solve.state.balanced-subtraction",
    "fraction-solve.state.additive-cancelled",
    "fraction-solve.state.difference-simplified",
    "fraction-solve.state.balanced-multiplication",
    "fraction-solve.state.denominator-cancelled",
    "fraction-solve.state.right-product-simplified",
    "fraction-solve.state.balanced-division",
    "fraction-solve.state.coefficient-cancelled",
    "fraction-solve.state.solved"
  ]),
  steps: Object.freeze([
    Object.freeze({
      id: "fraction-solve.step.distribute",
      transformType: "distributeMultiplication",
      dependencyIds: Object.freeze([])
    }),
    Object.freeze({
      id: "fraction-solve.step.normalize",
      transformType: "normalizeFractionNumerators",
      dependencyIds: Object.freeze(["fraction-solve.step.distribute"])
    }),
    Object.freeze({
      id: "fraction-solve.step.constant-product",
      transformType: "simplifyConstantProduct",
      dependencyIds: Object.freeze(["fraction-solve.step.normalize"])
    }),
    Object.freeze({
      id: "fraction-solve.step.constant-quotient",
      transformType: "simplifyConstantQuotient",
      dependencyIds: Object.freeze(["fraction-solve.step.constant-product"])
    }),
    Object.freeze({
      id: "fraction-solve.step.subtract-four",
      transformType: "subtractBothSides",
      dependencyIds: Object.freeze(["fraction-solve.step.constant-quotient"])
    }),
    Object.freeze({
      id: "fraction-solve.step.cancel-additive-inverses",
      transformType: "cancelAdditiveInverses",
      dependencyIds: Object.freeze(["fraction-solve.step.subtract-four"])
    }),
    Object.freeze({
      id: "fraction-solve.step.simplify-difference",
      transformType: "simplifyConstantDifference",
      dependencyIds: Object.freeze([
        "fraction-solve.step.cancel-additive-inverses"
      ])
    }),
    Object.freeze({
      id: "fraction-solve.step.multiply-by-three",
      transformType: "multiplyBothSides",
      dependencyIds: Object.freeze(["fraction-solve.step.simplify-difference"])
    }),
    Object.freeze({
      id: "fraction-solve.step.cancel-denominator",
      transformType: "cancelMultiplicativeInverses",
      dependencyIds: Object.freeze(["fraction-solve.step.multiply-by-three"])
    }),
    Object.freeze({
      id: "fraction-solve.step.simplify-right-product",
      transformType: "simplifyConstantProduct",
      dependencyIds: Object.freeze(["fraction-solve.step.cancel-denominator"])
    }),
    Object.freeze({
      id: "fraction-solve.step.divide-by-two",
      transformType: "divideBothSides",
      dependencyIds: Object.freeze([
        "fraction-solve.step.simplify-right-product"
      ])
    }),
    Object.freeze({
      id: "fraction-solve.step.cancel-coefficient",
      transformType: "cancelMultiplicativeInverses",
      dependencyIds: Object.freeze(["fraction-solve.step.divide-by-two"])
    }),
    Object.freeze({
      id: "fraction-solve.step.simplify-solution",
      transformType: "simplifyConstantQuotient",
      dependencyIds: Object.freeze(["fraction-solve.step.cancel-coefficient"])
    })
  ]),
  foldContract: Object.freeze({
    modes: Object.freeze(["expanded", "collapsed", "automatic", "pinned"]),
    preservedTruth: Object.freeze([
      "exact-state-chain",
      "step-dependencies",
      "verified-solution",
      "semantic-checkpoints",
      "accessible-explanation",
      "static-step-export"
    ])
  }),
  motifContract: Object.freeze({
    transformTypes: Object.freeze({
      distributeMultiplication: "copy-fan-out",
      normalizeFractionNumerators: "fraction-factor-split",
      simplifyConstantProduct: "successor-synthesis",
      simplifyConstantQuotient: "successor-synthesis",
      subtractBothSides: "append-after-shift",
      cancelAdditiveInverses: "cancelation",
      simplifyConstantDifference: "successor-synthesis",
      multiplyBothSides: "append-after-shift",
      cancelMultiplicativeInverses: "cancelation",
      divideBothSides: "append-after-shift"
    }),
    forbiddenMotifKinds: Object.freeze([
      "artifact-replace",
      "whole-equation-fade",
      "source-out-target-in"
    ])
  }),
  paintContract: Object.freeze({
    nativeEndpointAuthority: "native-katex",
    canonicalPaintPolicy: "exclusive-when-active",
    compatibilityPaintPolicy: "empty-when-canonical-active",
    structuralFractionOpacity: "opaque-throughout",
    forbiddenPolicies: Object.freeze([
      "whole-equation-fade-replacement",
      "source-out-target-in-crossfade",
      "fading-fraction-fan-out",
      "simultaneous-legacy-and-canonical-paint",
      "non-native-endpoint-settlement"
    ])
  }),
  presentation: Object.freeze({
    layoutAuthority: "certified-equation-stage",
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
    ])
  }),
  accessibility: Object.freeze({
    liveStructuredMath: true,
    staticNativeMathml: true,
    searchableWithoutJavaScript: true,
    semanticDomOwner: "reader",
    movingPaintAriaHidden: true,
    movingPaintInert: true,
    collapsedWorkDisclosed: true
  }),
  learningArtifacts: Object.freeze({
    narratedCheckpointCount: 6,
    transcriptOperationCount: 13,
    annotationIds: Object.freeze([
      "annotation.fraction-composition.inspect-normalized-fractions",
      "annotation.fraction-composition.inspect-isolated-fraction"
    ]),
    clozeCardId: "card.fraction-composition.exact-solution",
    staticExportArtifactId: "artifact.fraction-composition.static-steps",
    foldInvariant: true
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
  })
} as const);
