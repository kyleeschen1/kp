import type {
  KpEquationProtectedTransitCertificate
} from "../../src/rendering/equation-motion-path-planner.ts";

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
