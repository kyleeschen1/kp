export interface KpCausalChainAction {
  readonly id: string;
  readonly semanticRank: number;
  readonly canonicalOperationId: string;
  readonly dependsOnActionIds: readonly string[];
  readonly fullDurationMs: number;
  readonly minimumVisibleDurationMs: number;
}

export interface KpCausalChainSegment {
  readonly id: string;
  readonly actionId: string;
  readonly canonicalOperationId: string;
  readonly presentation: "full-detail" | "compressed-context";
  readonly disclosure: "full-operation" | "compressed-causal-operation";
  readonly startMs: number;
  readonly durationMs: number;
  readonly endMs: number;
}

export interface KpCausalChainPlan {
  readonly kind: "kp-causal-chain-plan";
  readonly schemaVersion: "kp.causal-chain-plan.v1";
  readonly id: string;
  readonly presentation: KpCausalChainSegment["presentation"];
  readonly actions: readonly KpCausalChainAction[];
  readonly segments: readonly KpCausalChainSegment[];
  readonly totalDurationMs: number;
}

export interface KpCausalChainIssue {
  readonly code:
    | "causal-chain.invalid-action"
    | "causal-chain.duplicate-action"
    | "causal-chain.dependency-order"
    | "causal-chain.missing-action"
    | "causal-chain.segment-order"
    | "causal-chain.invisible-operation"
    | "causal-chain.invalid-total";
  readonly message: string;
}

export function createKpCausalChainPlan(input: {
  readonly id: string;
  readonly presentation: KpCausalChainPlan["presentation"];
  readonly actions: readonly KpCausalChainAction[];
  readonly compressedDurationMsByActionId?: Readonly<Record<string, number>>;
}): KpCausalChainPlan {
  const actions = input.actions.map((action) => ({
    ...action,
    dependsOnActionIds: [...action.dependsOnActionIds]
  }));
  const inputIssues = validateActions(actions);
  if (inputIssues.length > 0) {
    throw new Error(inputIssues.map(({ message }) => message).join("\n"));
  }
  let cursor = 0;
  const segments = actions.map((action) => {
    const durationMs = input.presentation === "full-detail"
      ? action.fullDurationMs
      : input.compressedDurationMsByActionId?.[action.id] ??
        action.minimumVisibleDurationMs;
    const segment: KpCausalChainSegment = {
      id: `${input.id}.segment.${action.semanticRank}`,
      actionId: action.id,
      canonicalOperationId: action.canonicalOperationId,
      presentation: input.presentation,
      disclosure: input.presentation === "full-detail"
        ? "full-operation"
        : "compressed-causal-operation",
      startMs: cursor,
      durationMs,
      endMs: cursor + durationMs
    };
    cursor = segment.endMs;
    return segment;
  });
  const plan: KpCausalChainPlan = {
    kind: "kp-causal-chain-plan",
    schemaVersion: "kp.causal-chain-plan.v1",
    id: input.id,
    presentation: input.presentation,
    actions,
    segments,
    totalDurationMs: cursor
  };
  const issues = evaluateKpCausalChainPlan(plan);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join("\n"));
  }
  return plan;
}

export function evaluateKpCausalChainPlan(
  plan: KpCausalChainPlan
): readonly KpCausalChainIssue[] {
  const issues = [...validateActions(plan.actions)];
  const actionById = new Map(
    plan.actions.map((action) => [action.id, action] as const)
  );
  const segmentActionIds = plan.segments.map((segment) => segment.actionId);
  const actionIds = plan.actions.map((action) => action.id);
  const missing = actionIds.filter(
    (actionId) => !segmentActionIds.includes(actionId)
  );
  if (missing.length > 0 || segmentActionIds.length !== actionIds.length) {
    issues.push({
      code: "causal-chain.missing-action",
      message:
        `Every causal operation requires one distinct segment; missing ${missing.join(", ") || "none"}.`
    });
  }
  if (!sameIds(segmentActionIds, actionIds)) {
    issues.push({
      code: "causal-chain.segment-order",
      message: "Causal-chain segments must retain exact semantic order."
    });
  }
  plan.segments.forEach((segment) => {
    const action = actionById.get(segment.actionId);
    if (action === undefined ||
        segment.durationMs < action.minimumVisibleDurationMs ||
        segment.durationMs > action.fullDurationMs) {
      issues.push({
        code: "causal-chain.invisible-operation",
        message:
          `Segment ${segment.id} must remain between its visible minimum and full duration.`
      });
    }
  });
  const finalEnd = plan.segments.at(-1)?.endMs ?? 0;
  if (finalEnd !== plan.totalDurationMs ||
      plan.segments.some((segment, index) =>
        segment.startMs !==
          (index === 0 ? 0 : plan.segments[index - 1]!.endMs)
      )) {
    issues.push({
      code: "causal-chain.invalid-total",
      message: "Causal-chain segments must be contiguous and end at totalDurationMs."
    });
  }
  return issues;
}

function validateActions(
  actions: readonly KpCausalChainAction[]
): readonly KpCausalChainIssue[] {
  const issues: KpCausalChainIssue[] = [];
  const ids = new Set<string>();
  const seen = new Set<string>();
  actions.forEach((action, index) => {
    if (action.id.trim().length === 0 ||
        action.canonicalOperationId.trim().length === 0 ||
        !Number.isInteger(action.semanticRank) ||
        action.semanticRank !== index ||
        !positive(action.fullDurationMs) ||
        !positive(action.minimumVisibleDurationMs) ||
        action.minimumVisibleDurationMs > action.fullDurationMs) {
      issues.push({
        code: "causal-chain.invalid-action",
        message: `Action ${action.id || index} has invalid identity, rank, or duration bounds.`
      });
    }
    if (ids.has(action.id)) {
      issues.push({
        code: "causal-chain.duplicate-action",
        message: `Duplicate causal action ${action.id}.`
      });
    }
    ids.add(action.id);
    action.dependsOnActionIds.forEach((dependencyId) => {
      if (!seen.has(dependencyId)) {
        issues.push({
          code: "causal-chain.dependency-order",
          message:
            `Action ${action.id} depends on ${dependencyId} before it is available.`
        });
      }
    });
    seen.add(action.id);
  });
  return issues;
}

function positive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function sameIds(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((id, index) => id === right[index]);
}
