import { normalizeAnimationProgress } from "../animation/kernel.ts";
import {
  diffKpTutorialExplorationState,
  updateKpTutorialLiveState,
  type KpTutorialExplorationState,
  type KpTutorialStateDiff,
  type KpTutorialStateSnapshot,
  type KpTutorialStateValue
} from "./exploration-state.ts";

export interface KpTutorialBranchPatch {
  readonly id: string;
  readonly sequence: number;
  readonly values: Readonly<Record<string, KpTutorialStateValue>>;
}

export interface KpTutorialExplorationBranch {
  readonly id: string;
  readonly state: KpTutorialExplorationState;
  readonly patches: readonly KpTutorialBranchPatch[];
  readonly lockedParameterIds: readonly string[];
}

export interface KpTutorialRejoinFrame {
  readonly branchId: string;
  readonly progress: number;
  readonly snapshot: KpTutorialStateSnapshot;
  readonly remainingDiffs: readonly KpTutorialStateDiff[];
  readonly rejoined: boolean;
}

export function createKpTutorialExplorationBranch(input: {
  readonly id: string;
  readonly state: KpTutorialExplorationState;
}): KpTutorialExplorationBranch {
  return {
    id: input.id,
    state: input.state,
    patches: [],
    lockedParameterIds: []
  };
}

export function setKpTutorialBranchLocks(
  branch: KpTutorialExplorationBranch,
  parameterIds: readonly string[]
): KpTutorialExplorationBranch {
  const unknown = parameterIds.filter(
    (parameterId) => !(parameterId in branch.state.reference.values)
  );
  if (unknown.length > 0) {
    throw new Error(`Cannot lock unknown tutorial parameters: ${unknown.join(", ")}.`);
  }

  return {
    ...branch,
    lockedParameterIds: [...new Set(parameterIds)]
  };
}

export function applyKpTutorialBranchPatch(
  branch: KpTutorialExplorationBranch,
  values: Readonly<Record<string, KpTutorialStateValue>>
): KpTutorialExplorationBranch {
  const locked = Object.keys(values).filter((parameterId) =>
    branch.lockedParameterIds.includes(parameterId)
  );
  if (locked.length > 0) {
    throw new Error(`Cannot patch locked tutorial parameters: ${locked.join(", ")}.`);
  }

  const sequence = branch.patches.length;
  return {
    ...branch,
    state: updateKpTutorialLiveState(branch.state, values),
    patches: [
      ...branch.patches,
      { id: `${branch.id}.patch.${sequence}`, sequence, values: { ...values } }
    ]
  };
}

export function sampleKpTutorialBranchRejoin(
  branch: KpTutorialExplorationBranch,
  progress: number
): KpTutorialRejoinFrame {
  const clamped = normalizeAnimationProgress(progress);
  const values = Object.fromEntries(
    Object.entries(branch.state.reference.values).map(
      ([parameterId, referenceValue]) => {
        const liveValue = branch.state.live.values[parameterId] ?? referenceValue;
        return [
          parameterId,
          interpolateStateValue(liveValue, referenceValue, clamped)
        ];
      }
    )
  );
  const snapshot = { id: `${branch.id}.rejoin`, values };
  const remainingDiffs = diffKpTutorialExplorationState({
    reference: branch.state.reference,
    live: snapshot
  });

  return {
    branchId: branch.id,
    progress: clamped,
    snapshot,
    remainingDiffs,
    rejoined: clamped === 1
  };
}

function interpolateStateValue(
  live: KpTutorialStateValue,
  reference: KpTutorialStateValue,
  progress: number
): KpTutorialStateValue {
  if (typeof live === "number" && typeof reference === "number") {
    return live + (reference - live) * progress;
  }

  return progress === 1 ? reference : live;
}
