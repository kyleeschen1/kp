import {
  kpEigenvectorBeatIds,
  type KpEigenvectorBeatId
} from "./eigenvector-endpoints.ts";
import {
  kpEigenvectorScalarControl,
  projectKpEigenvectorScalarManipulation,
  type KpEigenvectorScalarManipulationState
} from "./eigenvector-manipulation.ts";
import {
  evaluateKpEigenvectorPrediction,
  type KpEigenvectorPredictionChoiceId,
  type KpEigenvectorPredictionResult
} from "./eigenvector-prediction.ts";

export type KpEigenvectorExperienceEvent =
  | { readonly type: "select-beat"; readonly beatId: KpEigenvectorBeatId }
  | { readonly type: "move"; readonly direction: "previous" | "next" }
  | { readonly type: "answer-prediction"; readonly choiceId: KpEigenvectorPredictionChoiceId }
  | { readonly type: "set-scalar"; readonly coefficient: number };

export type KpEigenvectorExperienceEffect =
  | {
      readonly type: "transition";
      readonly fromBeatId: KpEigenvectorBeatId;
      readonly toBeatId: KpEigenvectorBeatId;
    }
  | { readonly type: "announce"; readonly text: string };

export interface KpEigenvectorExperienceState {
  readonly beatId: KpEigenvectorBeatId;
  readonly prediction: KpEigenvectorPredictionResult | undefined;
  readonly scalar: KpEigenvectorScalarManipulationState;
  readonly revision: number;
}

export interface KpEigenvectorExperienceUpdate {
  readonly state: KpEigenvectorExperienceState;
  readonly effects: readonly KpEigenvectorExperienceEffect[];
}

export function createKpEigenvectorExperienceState(
  beatId: KpEigenvectorBeatId = "most-vectors-turn"
): KpEigenvectorExperienceState {
  return {
    beatId,
    prediction: undefined,
    scalar: projectKpEigenvectorScalarManipulation(
      kpEigenvectorScalarControl.initial
    ),
    revision: 0
  };
}

/** Every input surface dispatches here; DOM and frameworks never own lesson state. */
export function updateKpEigenvectorExperience(
  state: KpEigenvectorExperienceState,
  event: KpEigenvectorExperienceEvent
): KpEigenvectorExperienceUpdate {
  if (event.type === "select-beat") {
    return moveTo(state, event.beatId);
  }
  if (event.type === "move") {
    const currentIndex = kpEigenvectorBeatIds.indexOf(state.beatId);
    const offset = event.direction === "previous" ? -1 : 1;
    const next = kpEigenvectorBeatIds[currentIndex + offset] ?? state.beatId;
    return moveTo(state, next);
  }
  if (event.type === "answer-prediction") {
    const prediction = evaluateKpEigenvectorPrediction(event.choiceId);
    const nextBeatId = prediction.revealBeatId ?? state.beatId;
    const transition = nextBeatId === state.beatId
      ? []
      : [{
          type: "transition" as const,
          fromBeatId: state.beatId,
          toBeatId: nextBeatId
        }];
    return {
      state: {
        ...state,
        beatId: nextBeatId,
        prediction,
        revision: state.revision + 1
      },
      effects: [
        { type: "announce", text: prediction.feedback },
        ...transition
      ]
    };
  }
  const scalar = projectKpEigenvectorScalarManipulation(event.coefficient);
  const nextBeatId: KpEigenvectorBeatId = "reveal-the-eigenspace";
  const effects: KpEigenvectorExperienceEffect[] = [];
  if (state.beatId !== nextBeatId) {
    effects.push({
      type: "transition",
      fromBeatId: state.beatId,
      toBeatId: nextBeatId
    });
  }
  effects.push({ type: "announce", text: scalar.explanation });
  return {
    state: {
      ...state,
      beatId: nextBeatId,
      scalar,
      revision: state.revision + 1
    },
    effects
  };
}

function moveTo(
  state: KpEigenvectorExperienceState,
  beatId: KpEigenvectorBeatId
): KpEigenvectorExperienceUpdate {
  if (beatId === state.beatId) {
    return { state, effects: [] };
  }
  return {
    state: {
      ...state,
      beatId,
      revision: state.revision + 1
    },
    effects: [{
      type: "transition",
      fromBeatId: state.beatId,
      toBeatId: beatId
    }]
  };
}
