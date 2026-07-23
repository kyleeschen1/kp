import type {
  KpAnimationExecutionState
} from "./semantic-animation-workbench-lifecycle.ts";

export interface KpAnimationTheseusControlNode {
  readonly id: string;
  readonly status: string;
  readonly progress?: {
    readonly state: string;
  };
  readonly slices?: readonly {
    readonly id: string;
    readonly status: string;
  }[];
}

export interface KpAnimationTheseusBinding {
  readonly animationId: string;
  readonly node: KpAnimationTheseusControlNode;
  readonly sliceId?: string;
}

export interface KpAnimationTheseusDiagnostic {
  readonly code:
    | "conflicting-execution-state"
    | "missing-slice"
    | "stale-node-state"
    | "unsupported-control-state";
  readonly animationId: string;
  readonly controlIds: readonly string[];
  readonly message: string;
}

export interface KpAnimationTheseusProjection {
  readonly animationId: string;
  readonly execution?: KpAnimationExecutionState;
  readonly controlIds: readonly string[];
  readonly diagnostics: readonly KpAnimationTheseusDiagnostic[];
}

export function projectKpAnimationTheseusState(
  bindings: readonly KpAnimationTheseusBinding[]
): readonly KpAnimationTheseusProjection[] {
  const byAnimation = new Map<string, KpAnimationTheseusBinding[]>();
  for (const binding of bindings) {
    const group = byAnimation.get(binding.animationId) ?? [];
    group.push(binding);
    byAnimation.set(binding.animationId, group);
  }

  return [...byAnimation.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([animationId, animationBindings]) =>
      projectAnimationBindings(animationId, animationBindings)
    );
}

function projectAnimationBindings(
  animationId: string,
  bindings: readonly KpAnimationTheseusBinding[]
): KpAnimationTheseusProjection {
  const diagnostics: KpAnimationTheseusDiagnostic[] = [];
  const states = bindings.flatMap((binding) => {
    const state = resolveBindingState(binding, diagnostics);
    return state === undefined ? [] : [state];
  });
  const distinctStates = [...new Set(states)];
  const controlIds = bindings.map(({ node, sliceId }) =>
    sliceId === undefined ? node.id : `${node.id}#${sliceId}`
  );

  if (distinctStates.length > 1) {
    diagnostics.push({
      code: "conflicting-execution-state",
      animationId,
      controlIds,
      message:
        `Theseus controls for ${animationId} disagree: ${distinctStates.join(", ")}.`
    });
  }

  return {
    animationId,
    ...(distinctStates.length === 1
      ? { execution: distinctStates[0]! }
      : {}),
    controlIds,
    diagnostics
  };
}

function resolveBindingState(
  binding: KpAnimationTheseusBinding,
  diagnostics: KpAnimationTheseusDiagnostic[]
): KpAnimationExecutionState | undefined {
  if (binding.sliceId !== undefined) {
    const slice = binding.node.slices?.find(
      (candidate) => candidate.id === binding.sliceId
    );
    if (slice === undefined) {
      diagnostics.push({
        code: "missing-slice",
        animationId: binding.animationId,
        controlIds: [binding.node.id],
        message:
          `Theseus control ${binding.node.id} has no slice ${binding.sliceId}.`
      });
      return undefined;
    }
    return executionState(slice.status, binding, diagnostics);
  }

  const nodeState = executionState(binding.node.status, binding, diagnostics);
  const progressState =
    binding.node.progress === undefined
      ? undefined
      : executionState(binding.node.progress.state, binding, diagnostics);

  if (
    nodeState === "complete" &&
    progressState !== undefined &&
    progressState !== "complete"
  ) {
    diagnostics.push({
      code: "stale-node-state",
      animationId: binding.animationId,
      controlIds: [binding.node.id],
      message:
        `Theseus control ${binding.node.id} is complete but its progress is ${binding.node.progress!.state}.`
    });
    return undefined;
  }
  return progressState ?? nodeState;
}

function executionState(
  status: string,
  binding: KpAnimationTheseusBinding,
  diagnostics: KpAnimationTheseusDiagnostic[]
): KpAnimationExecutionState | undefined {
  switch (status) {
    case "in-progress":
    case "active":
      return "active";
    case "ready":
    case "queued":
      return "queued";
    case "blocked":
      return "blocked";
    case "complete":
    case "completed":
    case "resolved":
      return "complete";
    case "planned":
    case "skipped":
    case "superseded":
      return "not-scheduled";
    default:
      diagnostics.push({
        code: "unsupported-control-state",
        animationId: binding.animationId,
        controlIds: [binding.node.id],
        message:
          `Theseus control ${binding.node.id} has unsupported state ${status}.`
      });
      return undefined;
  }
}
