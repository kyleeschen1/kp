export {
  projectLinearEquationFrame,
  projectLinearEquationTrace,
  type KpSymbolicEquationLayoutIr,
  type KpSymbolicEquationIr,
  type KpSymbolicEquationToken,
  type KpSymbolicEquationTransitionIr,
  type KpSymbolicOperationApplicationIr,
  type KpSymbolicOperationWindow,
  type KpSymbolicEquationProjectionOptions,
  type KpSymbolicTokenLineageIr,
  type KpSymbolicTransitionPhase
} from "./linear-equation-symbolic.ts";

export {
  sampleLinearEquationTrace,
  type KpLinearEquationSample
} from "./linear-equation-frame.ts";

export {
  projectLinearEquationBalanceExemplar,
  type KpBalanceOperationApplicationIr,
  type KpBalanceSceneIr,
  type KpBalanceSideIr,
  type KpBalanceTermIr
} from "./linear-equation-balance-exemplar.ts";

export {
  correspondenceTargetsFor,
  createConceptRoomCorrespondenceIndex,
  projectConceptRoomFocus,
  type KpConceptRoomCorrespondenceIndex,
  type KpConceptRoomCorrespondenceSurface,
  type KpConceptRoomCorrespondenceTarget,
  type KpConceptRoomFocusChannel,
  type KpConceptRoomFocusProjection,
  type KpConceptRoomFocusTarget
} from "./concept-room-correspondence.ts";
