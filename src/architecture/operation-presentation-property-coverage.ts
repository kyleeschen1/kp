import type {
  KpVerifiedOperationPresentationPlan
} from "../animation/operation-presentation-plan-types.ts";
import type {
  KpReaderEquationTransitionPresentationPlan
} from "../reader/renderers/equation-transition-presentation-plan.ts";

export const kpOperationPresentationPropertyDirections = Object.freeze([
  "forward",
  "rewind"
] as const);

export const kpOperationPresentationPropertySeekPoints = Object.freeze([
  0,
  0.001,
  0.25,
  0.5,
  0.75,
  0.999,
  1
] as const);

export const kpOperationPresentationPropertyViewports = Object.freeze([
  Object.freeze({
    id: "wide",
    width: 1_100,
    height: 800,
    layout: "single-row"
  }),
  Object.freeze({
    id: "phone",
    width: 390,
    height: 844,
    layout: "semantic-two-row-stage"
  })
] as const);

export const kpOperationPresentationPropertyAstShapes = Object.freeze([
  "identity-presentation",
  "unary-rewrite",
  "binary-evaluation",
  "balanced-branch",
  "inverse-pair",
  "fan-out",
  "fan-in",
  "fission",
  "fusion"
] as const);

export const kpOperationPresentationPropertyNotationStructures =
  Object.freeze([
    "inline-equation",
    "parenthesized-expression",
    "fraction",
    "radical",
    "mixed-fraction-equation"
  ] as const);

export const kpOperationPresentationPropertyFamilies = Object.freeze([
  "default-motion",
  "visual-motif",
  "successor-synthesis",
  "balanced-introduction",
  "additive-cancellation",
  "multiplicative-cancellation",
  "distribution",
  "factoring",
  "fraction-fission",
  "fraction-fusion",
  "structural-succession",
  "explicit-static"
] as const);

export interface KpOperationPresentationPropertyCase {
  readonly id: string;
  readonly animationId: string;
  readonly transformationId: string;
  readonly astShape:
    typeof kpOperationPresentationPropertyAstShapes[number];
  readonly notationStructure:
    typeof kpOperationPresentationPropertyNotationStructures[number];
  readonly operationFamily:
    typeof kpOperationPresentationPropertyFamilies[number];
  readonly expectedStatus: "verified-animated" | "explicit-static";
  readonly expectedPlanKind:
    KpReaderEquationTransitionPresentationPlan["planKind"];
  readonly expectedOperationPlanKind?:
    KpVerifiedOperationPresentationPlan["planKind"] | undefined;
}

export const kpOperationPresentationPropertyCases = Object.freeze([
  propertyCase({
    id: "default-jacobian-presentation",
    animationId: "animation.comparison.jacobian-hessian",
    transformationId:
      "transform.comparison.jacobian-hessian.present-jacobian",
    astShape: "identity-presentation",
    notationStructure: "inline-equation",
    operationFamily: "default-motion",
    expectedStatus: "verified-animated",
    expectedPlanKind: "default-motion"
  }),
  propertyCase({
    id: "fraction-normalization-motif",
    animationId: "animation.fraction-composition.two-thirds-solve",
    transformationId: "fraction-solve.step.normalize",
    astShape: "unary-rewrite",
    notationStructure: "mixed-fraction-equation",
    operationFamily: "visual-motif",
    expectedStatus: "verified-animated",
    expectedPlanKind: "visual-motif"
  }),
  propertyCase({
    id: "constant-successor",
    animationId: "animation.fraction-composition.two-thirds-solve",
    transformationId: "fraction-solve.step.constant-product",
    astShape: "binary-evaluation",
    notationStructure: "mixed-fraction-equation",
    operationFamily: "successor-synthesis",
    expectedStatus: "verified-animated",
    expectedPlanKind: "successor-synthesis",
    expectedOperationPlanKind: "successor-synthesis"
  }),
  propertyCase({
    id: "balanced-subtraction",
    animationId: "animation.fraction-composition.two-thirds-solve",
    transformationId: "fraction-solve.step.subtract-four",
    astShape: "balanced-branch",
    notationStructure: "mixed-fraction-equation",
    operationFamily: "balanced-introduction",
    expectedStatus: "verified-animated",
    expectedPlanKind: "operation-choreography",
    expectedOperationPlanKind: "synchronized-balanced-introduction"
  }),
  propertyCase({
    id: "additive-inverse-pair",
    animationId: "animation.fraction-composition.two-thirds-solve",
    transformationId:
      "fraction-solve.step.cancel-additive-inverses",
    astShape: "inverse-pair",
    notationStructure: "mixed-fraction-equation",
    operationFamily: "additive-cancellation",
    expectedStatus: "verified-animated",
    expectedPlanKind: "operation-choreography",
    expectedOperationPlanKind: "inverse-cancellation"
  }),
  propertyCase({
    id: "multiplicative-inverse-pair",
    animationId: "animation.fraction-composition.two-thirds-solve",
    transformationId: "fraction-solve.step.cancel-denominator",
    astShape: "inverse-pair",
    notationStructure: "fraction",
    operationFamily: "multiplicative-cancellation",
    expectedStatus: "verified-animated",
    expectedPlanKind: "operation-choreography",
    expectedOperationPlanKind: "inverse-cancellation"
  }),
  propertyCase({
    id: "distribution-fan-out",
    animationId: "animation.generated.distribution.expand-a-sum",
    transformationId:
      "transform.generated.distribution.expand-a-sum.distribute",
    astShape: "fan-out",
    notationStructure: "parenthesized-expression",
    operationFamily: "distribution",
    expectedStatus: "verified-animated",
    expectedPlanKind: "distribution",
    expectedOperationPlanKind: "distribution"
  }),
  propertyCase({
    id: "factoring-fan-in",
    animationId: "animation.generated.distribution.factor-common-a",
    transformationId:
      "transform.generated.distribution.factor-common-a.factor",
    astShape: "fan-in",
    notationStructure: "parenthesized-expression",
    operationFamily: "factoring",
    expectedStatus: "verified-animated",
    expectedPlanKind: "factoring",
    expectedOperationPlanKind: "factoring"
  }),
  propertyCase({
    id: "fraction-fission",
    animationId: "animation.numerator-split-merge.round-trip",
    transformationId: "transform.numerator-split-merge.split-sum",
    astShape: "fission",
    notationStructure: "fraction",
    operationFamily: "fraction-fission",
    expectedStatus: "verified-animated",
    expectedPlanKind: "fraction-material",
    expectedOperationPlanKind: "fraction-material"
  }),
  propertyCase({
    id: "fraction-fusion",
    animationId: "animation.numerator-split-merge.round-trip",
    transformationId: "transform.numerator-split-merge.merge-sum",
    astShape: "fusion",
    notationStructure: "fraction",
    operationFamily: "fraction-fusion",
    expectedStatus: "verified-animated",
    expectedPlanKind: "fraction-material",
    expectedOperationPlanKind: "fraction-material"
  }),
  propertyCase({
    id: "radical-succession",
    animationId: "animation.generated.radical.square-root-as-power",
    transformationId:
      "transform.generated.radical.square-root-as-power.rewrite-power-as-root",
    astShape: "unary-rewrite",
    notationStructure: "radical",
    operationFamily: "structural-succession",
    expectedStatus: "verified-animated",
    expectedPlanKind: "structural-succession",
    expectedOperationPlanKind: "structural-succession"
  }),
  propertyCase({
    id: "honest-static-gap",
    animationId: "animation.linear-solve.solve-x.teacher-zero",
    transformationId: "transform.linear-solve.expose-left-zero",
    astShape: "fan-in",
    notationStructure: "inline-equation",
    operationFamily: "explicit-static",
    expectedStatus: "explicit-static",
    expectedPlanKind: "explicit-static-checkpoint"
  })
] as const satisfies readonly KpOperationPresentationPropertyCase[]);

export const kpOperationPresentationPropertyBudget = Object.freeze({
  maxCases: 16,
  maxPlanSamples: 256,
  maxGeneratedDrafts: 32,
  maxUnitDurationMs: 3_000,
  expectedPlanSamples:
    kpOperationPresentationPropertyCases.length *
    kpOperationPresentationPropertyDirections.length *
    kpOperationPresentationPropertySeekPoints.length
});

export const kpOperationPresentationPropertyBrowserChecks = Object.freeze([
  "npm run test:browser:canonical-reader-contract",
  "npm run visual:fraction-composition-canonical",
  "npm run perf:fraction-composition-scroll"
] as const);

function propertyCase(
  value: KpOperationPresentationPropertyCase
): KpOperationPresentationPropertyCase {
  return Object.freeze(value);
}
