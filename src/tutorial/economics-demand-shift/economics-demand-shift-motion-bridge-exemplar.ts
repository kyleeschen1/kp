import {
  defineKpTutorialMotionBridge
} from "../kp-tutorial-motion-bridge-authoring.ts";

/** The single reversible exemplar compiled into the opt-in reader route. */
export const kpEconomicsDemandShiftMotionBridgeExemplar =
  defineKpTutorialMotionBridge({
    id: "demand-increase",
    beforePassageId: "follow-shift",
    afterPassageId: "new-equilibrium",
    distance: "standard",
    motionBlockId: "demand-shift",
    fromCheckpointId: "shift-ready",
    toCheckpointId: "shift-settled"
  });
