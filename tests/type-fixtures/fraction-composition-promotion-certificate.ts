import type {
  KpGovernedCanonicalConstructionRequest
} from "../../src/authoring/canonical-animation-public-api.ts";
import {
  certifyKpFractionCompositionPromotionReadiness,
  type KpVerifiedFractionCompositionPromotionReadiness
} from "../../src/architecture/fraction-composition-promotion-certificate.ts";

// @ts-expect-error Only the complete automated verifier can mint readiness.
const fabricatedReadiness: KpVerifiedFractionCompositionPromotionReadiness = {
  schemaVersion: "kp.verified-fraction-composition-promotion-readiness.v1",
  animationId: "animation.fraction-composition.two-thirds-solve",
  status: "ready-for-human-review",
  prerequisiteEvidence: [],
  remainingGate: "human-perceptual-review"
};

certifyKpFractionCompositionPromotionReadiness({
  markdown: "# Valid input boundary",
  // @ts-expect-error Authorable booleans cannot assert a passed prerequisite.
  semanticPassed: true
});

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

void [fabricatedReadiness, governedRequest];
