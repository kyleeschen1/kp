import type {
  KpEquationProtectedTransitCertificate
} from "../../src/rendering/equation-protected-transit-types.ts";
import type {
  KpVerifiedOperationPresentationPlanId
} from "../../src/animation/operation-presentation-plan-authority.ts";

// @ts-expect-error Dense measured-paint inspection is the only minting authority.
const fabricated: KpEquationProtectedTransitCertificate = {
  kind: "equation-protected-transit-certificate",
  geometryAuthority: "measured-visible-paint",
  sampleCount: 100,
  inspectedPairCount: 0,
  opacityScheduledTrackIds: [],
  rescheduledComponentIds: [],
  routedComponentIds: [],
  routedTrackIds: []
};

void fabricated;

// @ts-expect-error Raw strings cannot grant renderer collision authority.
const unverifiedCohort: KpVerifiedOperationPresentationPlanId =
  "operation-presentation.unverified";

void unverifiedCohort;
