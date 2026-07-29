import type {
  KpVerifiedExactFractionQuantityPromotionReadiness
} from "../../src/architecture/exact-fraction-quantity-promotion-types.ts";

// @ts-expect-error Only the complete automated verifier can mint readiness.
const fabricated:
KpVerifiedExactFractionQuantityPromotionReadiness = {
  schemaVersion:
    "kp.verified-exact-fraction-quantity-promotion-readiness.v1",
  animationId:
    "animation.exact-fraction-quantity.third-plus-sixth",
  status: "ready-for-human-review",
  prerequisiteEvidence: [],
  remainingGate: "human-perceptual-review"
};

void fabricated;
