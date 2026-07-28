import type {
  KpGovernedCanonicalConstructionRequest
} from "../../src/authoring/governed-semantic-request.ts";
import {
  type KpFractionCompositionPromotionReadinessInput,
  type KpVerifiedFractionCompositionPromotionReadiness
} from "../../src/architecture/fraction-composition-promotion-types.ts";
import type {
  KpVerifiedFractionCompositionReleaseApproval
} from "../../src/architecture/fraction-composition-release-approval.ts";

// @ts-expect-error Only the complete automated verifier can mint readiness.
const fabricatedReadiness: KpVerifiedFractionCompositionPromotionReadiness = {
  schemaVersion: "kp.verified-fraction-composition-promotion-readiness.v1",
  animationId: "animation.fraction-composition.two-thirds-solve",
  status: "ready-for-human-review",
  prerequisiteEvidence: [],
  remainingGate: "human-perceptual-review"
};

// @ts-expect-error Catalog callers cannot fabricate the human release token.
const fabricatedRelease: KpVerifiedFractionCompositionReleaseApproval = {
  schemaVersion:
    "kp.verified-fraction-composition-release-approval.v1",
  animationId: "animation.fraction-composition.two-thirds-solve",
  reviewDecision: "approved-repair-complete",
  releaseDecision: "passed",
  evidenceSourceIds: [
    "review.kp.canonical-fraction-composition-human-visual-checkpoint",
    "run-contract.kp.canonical-fraction-composition-promotion-v1"
  ]
};

const invalidReadinessInput: KpFractionCompositionPromotionReadinessInput = {
  markdown: "# Valid input boundary",
  // @ts-expect-error Authorable booleans cannot assert a passed prerequisite.
  semanticPassed: true
};

const governedRequest: KpGovernedCanonicalConstructionRequest = {
  schemaVersion: "kp.governed-semantic-authoring-request.v2",
  id: "request.fraction-composition.adversarial",
  source: {
    kind: "verified-semantic-source",
    sourceId: "asset.fraction-composition-equation",
    revisionId: "1",
    operationPacks: [{ packId: "kp.algebra", version: "1.0.0" }]
  },
  approvedObjectIds: ["fraction-solve.state.factored"],
  approvedOperationIds: ["fraction-solve.step.distribute"],
  explanationPurpose: {
    kind: "notice",
    objectIds: ["fraction-solve.state.factored"],
    operationIds: []
  },
  detailLevel: "summary",
  compositionIntent: {
    kind: "sequence",
    operationIds: ["fraction-solve.step.distribute"]
  },
  // @ts-expect-error Governed requests cannot author mathematical notation.
  latex: "\\frac{2}{3}(x+6)=10"
};

void [
  fabricatedReadiness,
  fabricatedRelease,
  invalidReadinessInput,
  governedRequest
];
