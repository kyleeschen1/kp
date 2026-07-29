export const kpOperationEvaluationContinuityReference = Object.freeze({
  schemaVersion: "kp.operation-evaluation-continuity-reference.v1",
  canonicalExemplar: Object.freeze({
    id: "kp.operation-evaluation.exemplar.one-plus-two",
    sourceLatex: "1 + 2",
    targetLatex: "3",
    transformationKind: "simplifyConstantSum"
  }),
  requiredConformanceCallers: Object.freeze([
    Object.freeze({
      id: "kp.operation-evaluation.caller.one-plus-two",
      sourceLatex: "1 + 2",
      targetLatex: "3",
      transformationKind: "simplifyConstantSum"
    }),
    Object.freeze({
      id: "kp.operation-evaluation.caller.five-plus-two",
      sourceLatex: "5 + 2",
      targetLatex: "7",
      transformationKind: "simplifyConstantSum"
    }),
    Object.freeze({
      id: "kp.operation-evaluation.caller.three-sixths",
      sourceLatex: "\\frac{3}{6}",
      targetLatex: "\\frac{1}{2}",
      transformationKind: "simplifyConstantQuotient"
    })
  ]),
  ownership: Object.freeze({
    policy: "exclusive-continuous-carrier",
    legalTransfer: Object.freeze([
      "paint-equivalent-pose",
      "shared-zero-area-junction"
    ]),
    nonZeroPaintOpacity: 1,
    nativeEndpointAuthority: true
  }),
  renderer: Object.freeze({
    strategy: "canonical-native-katex-successor",
    unsupportedPresentation: "explicit-static-checkpoint",
    newRendererAllowed: false
  }),
  temporalSampling: Object.freeze({
    boundaryOffsets: Object.freeze([-1, 0, 1] as const),
    epsilonProgress: 1 / 1_000,
    browserEngines: Object.freeze([
      "chromium",
      "firefox",
      "webkit"
    ] as const),
    maximumBoundaryDisplacementPx: 0.75,
    maximumBoundaryVelocityDeltaPx: 1.5,
    maximumResidualTransformPx: 0.25,
    maximumStructuralScaleSkew: 0.015
  }),
  pacing: Object.freeze({
    minimumActionDurationMs: 1_100,
    setupFraction: 0.18,
    settleFraction: 0.18
  }),
  forbiddenCallerAuthority: Object.freeze([
    "opacity",
    "paint-policy",
    "path-family",
    "handoff-progress",
    "scheduler",
    "dom",
    "pixel-geometry",
    "keyframes",
    "duration"
  ] as const),
  preservation: Object.freeze([
    "verified-semantic-operation",
    "total-material-lineage",
    "native-katex-endpoints",
    "exact-seek-and-rewind",
    "accessibility-and-static-export",
    "one-runtime-clock-and-session",
    "review-capture",
    "production-isolation"
  ] as const)
} as const);

export type KpOperationEvaluationContinuityReference =
  typeof kpOperationEvaluationContinuityReference;
