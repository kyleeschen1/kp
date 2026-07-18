export type KpTutorialStateValue = boolean | number | string;

export interface KpTutorialStateSnapshot {
  readonly id: string;
  readonly values: Readonly<Record<string, KpTutorialStateValue>>;
}

export interface KpTutorialExplorationState {
  readonly reference: KpTutorialStateSnapshot;
  readonly live: KpTutorialStateSnapshot;
}

export interface KpTutorialStateDiff {
  readonly parameterId: string;
  readonly referenceValue: KpTutorialStateValue;
  readonly liveValue: KpTutorialStateValue;
}

export function createKpTutorialExplorationState(input: {
  readonly id: string;
  readonly values: Readonly<Record<string, KpTutorialStateValue>>;
}): KpTutorialExplorationState {
  const values = cloneValues(input.values);

  return {
    reference: { id: `${input.id}.reference`, values },
    live: { id: `${input.id}.live`, values: cloneValues(values) }
  };
}

export function updateKpTutorialLiveState(
  state: KpTutorialExplorationState,
  patch: Readonly<Record<string, KpTutorialStateValue>>
): KpTutorialExplorationState {
  const unknownIds = Object.keys(patch).filter(
    (parameterId) => !(parameterId in state.reference.values)
  );

  if (unknownIds.length > 0) {
    throw new Error(`Unknown tutorial parameters: ${unknownIds.join(", ")}.`);
  }

  return {
    reference: state.reference,
    live: {
      id: state.live.id,
      values: { ...state.live.values, ...patch }
    }
  };
}

export function diffKpTutorialExplorationState(
  state: KpTutorialExplorationState
): readonly KpTutorialStateDiff[] {
  return Object.entries(state.reference.values).flatMap(
    ([parameterId, referenceValue]) => {
      const liveValue = state.live.values[parameterId];
      return liveValue === undefined || Object.is(referenceValue, liveValue)
        ? []
        : [{ parameterId, referenceValue, liveValue }];
    }
  );
}

function cloneValues(
  values: Readonly<Record<string, KpTutorialStateValue>>
): Readonly<Record<string, KpTutorialStateValue>> {
  return { ...values };
}
