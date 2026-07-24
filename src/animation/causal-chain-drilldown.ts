import type { KpCausalChainPlan } from "./compressed-causal-chain.ts";

export interface KpCausalChainDrillDown {
  readonly kind: "kp-causal-chain-drilldown";
  readonly schemaVersion: "kp.causal-chain-drilldown.v1";
  readonly id: string;
  readonly parentPlanId: string;
  readonly childPlanId: string;
  readonly actionIds: readonly string[];
  readonly parentClock: {
    readonly paused: true;
    readonly elapsedMs: number;
    readonly progress: number;
  };
  readonly childClock: {
    readonly nested: true;
    readonly durationMs: number;
  };
  readonly restore: {
    readonly exact: true;
    readonly elapsedMs: number;
    readonly progress: number;
  };
}

export interface KpCausalChainDrillDownIssue {
  readonly code:
    | "drilldown.parent-not-compressed"
    | "drilldown.child-not-full"
    | "drilldown.trace-mismatch"
    | "drilldown.invalid-parent-time"
    | "drilldown.restore-mismatch";
  readonly message: string;
}

export function createKpCausalChainDrillDown(input: {
  readonly id: string;
  readonly parentPlan: KpCausalChainPlan;
  readonly childPlan: KpCausalChainPlan;
  readonly parentElapsedMs: number;
}): KpCausalChainDrillDown {
  const progress = input.parentPlan.totalDurationMs === 0
    ? 0
    : input.parentElapsedMs / input.parentPlan.totalDurationMs;
  const drillDown: KpCausalChainDrillDown = {
    kind: "kp-causal-chain-drilldown",
    schemaVersion: "kp.causal-chain-drilldown.v1",
    id: input.id,
    parentPlanId: input.parentPlan.id,
    childPlanId: input.childPlan.id,
    actionIds: input.parentPlan.actions.map((action) => action.id),
    parentClock: {
      paused: true,
      elapsedMs: input.parentElapsedMs,
      progress
    },
    childClock: {
      nested: true,
      durationMs: input.childPlan.totalDurationMs
    },
    restore: {
      exact: true,
      elapsedMs: input.parentElapsedMs,
      progress
    }
  };
  const issues = evaluateKpCausalChainDrillDown({
    drillDown,
    parentPlan: input.parentPlan,
    childPlan: input.childPlan
  });
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join("\n"));
  }
  return drillDown;
}

export function evaluateKpCausalChainDrillDown(input: {
  readonly drillDown: KpCausalChainDrillDown;
  readonly parentPlan: KpCausalChainPlan;
  readonly childPlan: KpCausalChainPlan;
}): readonly KpCausalChainDrillDownIssue[] {
  const issues: KpCausalChainDrillDownIssue[] = [];
  if (input.parentPlan.presentation !== "compressed-context") {
    issues.push({
      code: "drilldown.parent-not-compressed",
      message: "A causal drill-down parent must be compressed contextual work."
    });
  }
  if (input.childPlan.presentation !== "full-detail") {
    issues.push({
      code: "drilldown.child-not-full",
      message: "A causal drill-down child must expose full operation detail."
    });
  }
  const parentTrace = input.parentPlan.actions.map(
    ({ id, canonicalOperationId }) => [id, canonicalOperationId]
  );
  const childTrace = input.childPlan.actions.map(
    ({ id, canonicalOperationId }) => [id, canonicalOperationId]
  );
  if (JSON.stringify(parentTrace) !== JSON.stringify(childTrace) ||
      JSON.stringify(input.drillDown.actionIds) !== JSON.stringify(
        input.parentPlan.actions.map((action) => action.id)
      )) {
    issues.push({
      code: "drilldown.trace-mismatch",
      message: "Parent and child must project the identical causal trace."
    });
  }
  if (!Number.isFinite(input.drillDown.parentClock.elapsedMs) ||
      input.drillDown.parentClock.elapsedMs < 0 ||
      input.drillDown.parentClock.elapsedMs >
        input.parentPlan.totalDurationMs) {
    issues.push({
      code: "drilldown.invalid-parent-time",
      message: "Parent pause time must lie on its causal-chain clock."
    });
  }
  if (!input.drillDown.parentClock.paused ||
      !input.drillDown.restore.exact ||
      input.drillDown.restore.elapsedMs !==
        input.drillDown.parentClock.elapsedMs ||
      input.drillDown.restore.progress !==
        input.drillDown.parentClock.progress) {
    issues.push({
      code: "drilldown.restore-mismatch",
      message: "Closing the drill-down must restore the exact paused parent frame."
    });
  }
  return issues;
}
