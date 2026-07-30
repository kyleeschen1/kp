import type {
  KpVerifiedPlaceValueAdditionPromotionReadiness
} from "../../src/architecture/place-value-addition-promotion-types.ts";

// @ts-expect-error Only the complete automated verifier can mint readiness.
const fabricatedReadiness:
KpVerifiedPlaceValueAdditionPromotionReadiness = {
  schemaVersion:
    "kp.verified-place-value-addition-promotion-readiness.v1",
  animationId: "animation.place-value-addition.278-plus-156",
  status: "ready-for-human-review",
  prerequisiteEvidence: [],
  remainingGate: "human-perceptual-review"
};

void fabricatedReadiness;
