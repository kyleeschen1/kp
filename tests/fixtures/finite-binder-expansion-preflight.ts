export const finiteBinderExpansionPreflight = Object.freeze({
  schemaVersion: "kp.finite-binder-expansion-preflight.v1",
  retiredBroadCapabilityId:
    "capability.equation.binders-and-calculus-operators",
  capabilityId: "capability.equation.finite-binder-expansion",
  statusBeforeEvidence: "Missing",
  statusAfterEvidence: "Direct",
  baselineRequirementIds: Object.freeze([
    "requirement.equation.finite-binder-expansion.normalizer",
    "requirement.equation.finite-binder-expansion.operation",
    "requirement.equation.finite-binder-expansion.recipe",
    "requirement.equation.finite-binder-expansion.corpus"
  ]),
  releaseRequirementIds: Object.freeze([
    "requirement.equation.finite-binder-expansion.sum-normalizer",
    "requirement.equation.finite-binder-expansion.product-normalizer",
    "requirement.equation.finite-binder-expansion.kernel",
    "requirement.equation.finite-binder-expansion.sum-operation",
    "requirement.equation.finite-binder-expansion.product-operation",
    "requirement.equation.finite-binder-expansion.recipe",
    "requirement.equation.finite-binder-expansion.sum-exemplar",
    "requirement.equation.finite-binder-expansion.product-exemplar",
    "requirement.equation.finite-binder-expansion.authoring",
    "requirement.equation.finite-binder-expansion.corpus"
  ]),
  canonicalSum: Object.freeze({
    sourceLatex: "\\sum_{i=1}^{3} a_i",
    targetLatex: "a_1+a_2+a_3",
    binder: "i",
    lowerBound: 1,
    upperBound: 3,
    orderedValues: Object.freeze([1, 2, 3]),
    proposedAnimationId: "animation.equation.finite-sum-expansion.v1"
  }),
  productPressure: Object.freeze({
    sourceLatex: "\\prod_{k=0}^{2} x_k",
    targetLatex: "x_0x_1x_2",
    binder: "k",
    lowerBound: 0,
    upperBound: 2,
    orderedValues: Object.freeze([0, 1, 2]),
    proposedAnimationId: "animation.equation.finite-product-expansion.v1"
  }),
  existingLargeOperatorFixtureId: "large-operator.sum.add-bounds",
  existingPaintShapeId: "shape.compound.large-operator",
  existingPaintShapeLatex: "\\sum_{i=1}^{n}x_i",
  visualCheckpointSlice: "bf16",
  promotionPressureSlice: "bf18"
} as const);
