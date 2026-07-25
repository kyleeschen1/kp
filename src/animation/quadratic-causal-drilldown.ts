import {
  createKpCausalChainPlan,
  type KpCausalChainAction,
  type KpCausalChainPlan
} from "./compressed-causal-chain.ts";
import {
  createKpCausalChainDrillDown,
  type KpCausalChainDrillDown
} from "./causal-chain-drilldown.ts";
import { createKpCompletingSquareKatexProjection } from "../projections/quadratic-completing-square-katex.ts";
import { createKpQuadraticFormulaKatexProjection } from "../projections/quadratic-formula-katex.ts";
import type { KpQuadraticMethodId } from "../semantic/quadratic-solution-method-graph.ts";

export interface KpQuadraticCausalDrillDownBundle {
  readonly methodId: KpQuadraticMethodId;
  readonly compressed: KpCausalChainPlan;
  readonly full: KpCausalChainPlan;
  readonly drillDown: KpCausalChainDrillDown;
}

export function createKpQuadraticCausalDrillDownBundle(input: {
  readonly methodId: KpQuadraticMethodId;
  readonly parentProgress: number;
}): KpQuadraticCausalDrillDownBundle {
  if (
    !Number.isFinite(input.parentProgress) ||
    input.parentProgress < 0 ||
    input.parentProgress > 1
  ) {
    throw new Error("Quadratic drill-down parent progress must be normalized.");
  }
  const actions = actionsFor(input.methodId);
  const suffix = input.methodId.split(".").at(-1)!;
  const compressed = createKpCausalChainPlan({
    id: `causal-chain.quadratic.${suffix}.compressed`,
    presentation: "compressed-context",
    actions,
    compressedDurationMsByActionId: Object.fromEntries(
      actions.map(({ id }) => [id, 180])
    )
  });
  const full = createKpCausalChainPlan({
    id: `causal-chain.quadratic.${suffix}.full`,
    presentation: "full-detail",
    actions
  });
  const parentElapsedMs = Math.round(
    input.parentProgress * compressed.totalDurationMs
  );
  const drillDown = createKpCausalChainDrillDown({
    id: `drilldown.quadratic.${suffix}`,
    parentPlan: compressed,
    childPlan: full,
    parentElapsedMs
  });
  return Object.freeze({
    methodId: input.methodId,
    compressed,
    full,
    drillDown
  });
}

function actionsFor(
  methodId: KpQuadraticMethodId
): readonly KpCausalChainAction[] {
  const transitions = methodId === "method.quadratic.formula"
    ? createKpQuadraticFormulaKatexProjection().transitions
    : createKpCompletingSquareKatexProjection().transitions;
  return Object.freeze(transitions.map((transition, semanticRank) => {
    const operationId = transition.presentation?.operationRef;
    if (operationId === undefined) {
      throw new Error(
        `Quadratic transition ${transition.id} lacks operation authority.`
      );
    }
    return Object.freeze({
      id: operationId,
      semanticRank,
      canonicalOperationId: operationId,
      dependsOnActionIds: Object.freeze(
        semanticRank === 0
          ? []
          : [transitions[semanticRank - 1]!.presentation!.operationRef]
      ),
      fullDurationMs: 720,
      minimumVisibleDurationMs: 140
    });
  }));
}
